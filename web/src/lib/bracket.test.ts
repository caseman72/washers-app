import { describe, it, expect } from 'vitest'
import {
  generateTournament,
  advanceWinner,
  getMatchesByRound,
  isMatchReady,
  isByeMatch,
  computeGameNumbers,
} from './bracket'
import { BracketNode } from '../types'

// Helper: deterministic list of player IDs (p1, p2, ...)
const players = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)

// A WB Round 1 match with exactly one player is a structural BYE.
const isStructuralR1Bye = (m: BracketNode) =>
  m.round === 1 && m.bracket === 'winners' && (!!m.player1Id !== !!m.player2Id)

describe('generateTournament', () => {
  it('builds a 4-player single-elimination bracket (2 R1 + 1 final)', () => {
    const t = generateTournament('T', players(4), 'single_elimination')
    expect(t.format).toBe('single_elimination')
    expect(t.status).toBe('active')
    expect(t.playerIds).toEqual(players(4))
    expect(t.teams).toBeUndefined()

    const wb = t.bracket.filter(m => m.bracket === 'winners')
    expect(wb).toHaveLength(3)
    expect(wb.filter(m => m.round === 1)).toHaveLength(2)
    expect(wb.filter(m => m.round === 2)).toHaveLength(1)
    expect(t.bracket.some(m => m.bracket === 'losers')).toBe(false)
  })

  it('builds an 8-player single-elimination bracket (4 + 2 + 1)', () => {
    const t = generateTournament('T', players(8), 'single_elimination')
    const wb = t.bracket.filter(m => m.bracket === 'winners')
    expect(wb).toHaveLength(7)
    expect(wb.filter(m => m.round === 1)).toHaveLength(4)
    expect(wb.filter(m => m.round === 2)).toHaveLength(2)
    expect(wb.filter(m => m.round === 3)).toHaveLength(1)
  })

  it('auto-advances BYE matches for non-power-of-2 counts (3 players)', () => {
    const t = generateTournament('T', players(3), 'single_elimination')
    const byes = t.bracket.filter(isStructuralR1Bye)
    expect(byes.length).toBeGreaterThanOrEqual(1)
    // A BYE match auto-sets its winner to the only present player
    byes.forEach(m => expect(m.winnerId).toBe(m.player1Id ?? m.player2Id))
  })

  it('creates teams for doubles and seeds the bracket with team IDs', () => {
    const t = generateTournament('T', players(8), 'single_elimination', 1, 'doubles')
    expect(t.type).toBe('doubles')
    expect(t.teams).toHaveLength(4)
    expect(t.playerIds).toEqual(players(8)) // original players preserved

    const teamIds = new Set(t.teams!.map(tm => tm.id))
    const r1 = t.bracket.filter(m => m.round === 1 && m.bracket === 'winners')
    r1.forEach(m => {
      if (m.player1Id) expect(teamIds.has(m.player1Id)).toBe(true)
      if (m.player2Id) expect(teamIds.has(m.player2Id)).toBe(true)
    })
  })

  it('builds winners + losers brackets and grand finals for double elimination', () => {
    const t = generateTournament('T', players(4), 'double_elimination')
    expect(t.bracket.some(m => m.bracket === 'losers')).toBe(true)
    expect(t.bracket.find(m => m.id === 'grand-finals')).toBeDefined()
    expect(t.bracket.find(m => m.id === 'grand-finals-2')).toBeDefined()
  })

  it('passes bestOf through to the tournament', () => {
    expect(generateTournament('T', players(4), 'single_elimination', 5).bestOf).toBe(5)
  })
})

describe('advanceWinner', () => {
  it('propagates a winner into the next match by position (even → player1)', () => {
    const t = generateTournament('T', players(4), 'single_elimination')
    const r1 = t.bracket
      .filter(m => m.bracket === 'winners' && m.round === 1)
      .sort((a, b) => a.position - b.position)
    const m0 = r1[0] // position 0 → feeds player1 slot of final
    const winner = m0.player1Id!

    const t2 = advanceWinner(t, m0.id, winner)
    const final = t2.bracket.find(m => m.id === m0.nextMatchId)!
    expect(final.player1Id).toBe(winner)
  })

  it('records completedAt and the winner on the played match', () => {
    const t = generateTournament('T', players(4), 'single_elimination')
    const m = t.bracket.find(x => x.bracket === 'winners' && x.round === 1)!
    const updated = advanceWinner(t, m.id, m.player1Id!).bracket.find(x => x.id === m.id)!
    expect(updated.winnerId).toBe(m.player1Id)
    expect(typeof updated.completedAt).toBe('number')
  })

  it('completes a single-elimination tournament and sets the winner', () => {
    let t = generateTournament('T', players(4), 'single_elimination')
    const r1 = t.bracket.filter(m => m.bracket === 'winners' && m.round === 1)
    for (const m of r1) t = advanceWinner(t, m.id, m.player1Id!)

    const final = t.bracket.find(m => m.bracket === 'winners' && !m.nextMatchId)!
    expect(final.player1Id).toBeDefined()
    expect(final.player2Id).toBeDefined()

    t = advanceWinner(t, final.id, final.player1Id!)
    expect(t.status).toBe('complete')
    expect(t.winnerId).toBe(final.player1Id)
  })

  it('clears stale advancement when the winner is changed', () => {
    const t = generateTournament('T', players(4), 'single_elimination')
    const m0 = t.bracket
      .filter(m => m.bracket === 'winners' && m.round === 1)
      .sort((a, b) => a.position - b.position)[0]
    const first = m0.player1Id!
    const second = m0.player2Id!

    let t2 = advanceWinner(t, m0.id, first)
    expect(t2.bracket.find(m => m.id === m0.nextMatchId)!.player1Id).toBe(first)

    t2 = advanceWinner(t2, m0.id, second)
    expect(t2.bracket.find(m => m.id === m0.nextMatchId)!.player1Id).toBe(second)
  })
})

describe('getMatchesByRound', () => {
  it('groups matches of the requested bracket by round, sorted by position', () => {
    const bracket: BracketNode[] = [
      { id: 'a', round: 1, position: 2, bracket: 'winners' },
      { id: 'b', round: 1, position: 0, bracket: 'winners' },
      { id: 'c', round: 2, position: 0, bracket: 'winners' },
      { id: 'x', round: 1, position: 0, bracket: 'losers' },
    ]
    const byRound = getMatchesByRound(bracket, 'winners')
    expect([...byRound.keys()].sort()).toEqual([1, 2])
    expect(byRound.get(1)!.map(m => m.id)).toEqual(['b', 'a']) // sorted by position
    expect(byRound.get(1)!.some(m => m.id === 'x')).toBe(false) // losers excluded
  })
})

describe('isMatchReady', () => {
  const base: BracketNode = { id: 'm', round: 1, position: 0, bracket: 'winners' }

  it('is not ready when a player is missing', () => {
    expect(isMatchReady({ ...base, player1Id: 'p1' })).toBe(false)
  })
  it('is ready when both players are present and there is no winner', () => {
    expect(isMatchReady({ ...base, player1Id: 'p1', player2Id: 'p2' })).toBe(true)
  })
  it('stays ready within the 60s edit window after a winner is set', () => {
    expect(
      isMatchReady({ ...base, player1Id: 'p1', player2Id: 'p2', winnerId: 'p1', completedAt: Date.now() })
    ).toBe(true)
  })
  it('is not ready once the edit window has passed', () => {
    expect(
      isMatchReady({ ...base, player1Id: 'p1', player2Id: 'p2', winnerId: 'p1', completedAt: Date.now() - 61_000 })
    ).toBe(false)
  })
  it('is not ready when a winner exists but completedAt is missing', () => {
    expect(isMatchReady({ ...base, player1Id: 'p1', player2Id: 'p2', winnerId: 'p1' })).toBe(false)
  })
})

describe('isByeMatch', () => {
  const base: BracketNode = { id: 'm', round: 1, position: 0, bracket: 'winners' }

  it('is a bye when only one player is present and a winner is set', () => {
    expect(isByeMatch({ ...base, player1Id: 'p1', winnerId: 'p1' })).toBe(true)
  })
  it('is a bye for an isByeMatch-flagged match with a winner', () => {
    expect(isByeMatch({ ...base, bracket: 'losers', isByeMatch: true, player2Id: 'p2', winnerId: 'p2' })).toBe(true)
  })
  it('is not a bye when both players are present', () => {
    expect(isByeMatch({ ...base, player1Id: 'p1', player2Id: 'p2', winnerId: 'p1' })).toBe(false)
  })
  it('is not a bye without a winner', () => {
    expect(isByeMatch({ ...base, player1Id: 'p1' })).toBe(false)
  })
})

describe('computeGameNumbers (BFS playability ordering)', () => {
  it('numbers every real match contiguously starting at 1', () => {
    const t = generateTournament('T', players(8), 'single_elimination')
    const nums = computeGameNumbers(t)
    // 8 players, no byes → 4 + 2 + 1 = 7 numbered matches
    expect([...nums.values()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('orders every feeder before the match it feeds (game N is playable before N+1)', () => {
    const t = generateTournament('T', players(8), 'double_elimination')
    const nums = computeGameNumbers(t)

    for (const fed of t.bracket) {
      const fedNum = nums.get(fed.id)
      if (fedNum === undefined) continue
      for (const feeder of t.bracket) {
        const feedsFed = feeder.nextMatchId === fed.id || feeder.loserNextMatchId === fed.id
        if (!feedsFed) continue
        const feederNum = nums.get(feeder.id)
        if (feederNum !== undefined) expect(feederNum).toBeLessThan(fedNum)
      }
    }
  })

  it('does not assign a game number to structural BYE matches', () => {
    const t = generateTournament('T', players(3), 'single_elimination')
    const nums = computeGameNumbers(t)
    t.bracket.filter(isStructuralR1Bye).forEach(b => expect(nums.has(b.id)).toBe(false))
    // 3 players → 1 real R1 match + final = 2 numbered games
    expect(nums.size).toBe(2)
  })

  it('numbers the grand finals games last in double elimination', () => {
    const t = generateTournament('T', players(8), 'double_elimination')
    const nums = computeGameNumbers(t)
    const max = Math.max(...nums.values())
    expect(nums.get('grand-finals-2')).toBe(max)
    expect(nums.get('grand-finals')).toBe(max - 1)
  })
})
