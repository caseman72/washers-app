import { Tournament, BracketNode } from '../types'

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Shuffle array using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get next power of 2 >= n
function nextPowerOf2(n: number): number {
  let power = 1
  while (power < n) {
    power *= 2
  }
  return power
}

// Calculate number of rounds needed
function calculateRounds(numPlayers: number): number {
  const bracketSize = nextPowerOf2(numPlayers)
  return Math.log2(bracketSize)
}

// Generate winner's bracket
function generateWinnersBracket(
  playerIds: string[],
  _format: 'single_elimination' | 'double_elimination'
): BracketNode[] {
  const numPlayers = playerIds.length
  const bracketSize = nextPowerOf2(numPlayers)
  const numRounds = calculateRounds(numPlayers)
  const nodes: BracketNode[] = []

  // Shuffle players
  const shuffledPlayers = shuffleArray(playerIds)

  // Create seeding with byes distributed properly
  // BYEs should be spread across matches so no match has double-BYE
  // Put players in first positions of each match, BYEs fill remaining second positions
  const seeding: (string | null)[] = new Array(bracketSize).fill(null)
  const numMatches = bracketSize / 2

  // Distribute players across matches
  // First, fill player1 slots (even indices), then player2 slots (odd indices)
  let playerIndex = 0

  // Fill player1 slots first (positions 0, 2, 4, 6, ...)
  for (let i = 0; i < numMatches && playerIndex < numPlayers; i++) {
    seeding[i * 2] = shuffledPlayers[playerIndex++]
  }

  // Fill player2 slots (positions 1, 3, 5, 7, ...)
  for (let i = 0; i < numMatches && playerIndex < numPlayers; i++) {
    seeding[i * 2 + 1] = shuffledPlayers[playerIndex++]
  }

  // Generate round 1 matches (skip matches with no players)
  const round1Matches: BracketNode[] = []
  for (let i = 0; i < bracketSize / 2; i++) {
    const player1Idx = i * 2
    const player2Idx = i * 2 + 1
    const player1 = seeding[player1Idx] || undefined
    const player2 = seeding[player2Idx] || undefined

    // Skip matches with no players (double BYE)
    if (!player1 && !player2) {
      continue
    }

    const match: BracketNode = {
      id: `w-r1-${i}`,
      round: 1,
      position: i,
      bracket: 'winners',
      player1Id: player1,
      player2Id: player2,
    }

    // Handle byes - if only one player, they auto-advance
    if (match.player1Id && !match.player2Id) {
      match.winnerId = match.player1Id
    } else if (!match.player1Id && match.player2Id) {
      match.winnerId = match.player2Id
    }

    round1Matches.push(match)
  }
  nodes.push(...round1Matches)

  // Generate subsequent rounds
  let prevRoundMatches = round1Matches
  for (let round = 2; round <= numRounds; round++) {
    const roundMatches: BracketNode[] = []
    const matchesInRound = prevRoundMatches.length / 2

    for (let i = 0; i < matchesInRound; i++) {
      const match: BracketNode = {
        id: `w-r${round}-${i}`,
        round: round,
        position: i,
        bracket: 'winners',
      }
      roundMatches.push(match)

      // Link previous round matches to this one
      const prevMatch1 = prevRoundMatches[i * 2]
      const prevMatch2 = prevRoundMatches[i * 2 + 1]
      prevMatch1.nextMatchId = match.id
      prevMatch2.nextMatchId = match.id

      // If previous matches have winners (byes), propagate them
      if (prevMatch1.winnerId && prevMatch2.winnerId) {
        match.player1Id = prevMatch1.winnerId
        match.player2Id = prevMatch2.winnerId
      } else if (prevMatch1.winnerId) {
        match.player1Id = prevMatch1.winnerId
      } else if (prevMatch2.winnerId) {
        match.player2Id = prevMatch2.winnerId
      }
    }

    nodes.push(...roundMatches)
    prevRoundMatches = roundMatches
  }

  return nodes
}

// Generate loser's bracket for double elimination
function generateLosersBracket(
  winnersBracket: BracketNode[],
  numPlayers: number
): BracketNode[] {
  const nodes: BracketNode[] = []
  const numRounds = calculateRounds(numPlayers)

  // Loser's bracket has (numRounds - 1) * 2 rounds
  // Round 1 losers drop to LB round 1
  // Each winner's round after that feeds into LB

  // For simplicity, create placeholder matches
  // The actual structure depends on the bracket size

  const bracketSize = nextPowerOf2(numPlayers)
  let matchesInFirstLBRound = bracketSize / 4

  // Loser's bracket round 1: losers from winner's round 1
  let lbRound = 1
  let prevMatches: BracketNode[] = []

  // First round of loser's bracket
  for (let i = 0; i < matchesInFirstLBRound; i++) {
    const match: BracketNode = {
      id: `l-r${lbRound}-${i}`,
      round: lbRound,
      position: i,
      bracket: 'losers',
    }
    nodes.push(match)
    prevMatches.push(match)
  }

  // Link winner's round 1 losers to loser's bracket
  const winnersRound1 = winnersBracket.filter(m => m.round === 1)
  for (let i = 0; i < winnersRound1.length; i++) {
    winnersRound1[i].loserNextMatchId = `l-r1-${Math.floor(i / 2)}`
  }

  // Continue building loser's bracket rounds
  // Pattern: alternate between "losers play losers" and "loser plays drop-down from winners"
  let winnersRound = 2

  while (prevMatches.length > 0 || winnersRound <= numRounds) {
    lbRound++

    // This round: previous LB winners vs dropdowns from winners bracket
    if (winnersRound <= numRounds) {
      const winnersRoundMatches = winnersBracket.filter(m => m.round === winnersRound)
      const newMatches: BracketNode[] = []

      for (let i = 0; i < prevMatches.length; i++) {
        const match: BracketNode = {
          id: `l-r${lbRound}-${i}`,
          round: lbRound,
          position: i,
          bracket: 'losers',
        }
        nodes.push(match)
        newMatches.push(match)

        prevMatches[i].nextMatchId = match.id

        // Link dropdowns from winners
        if (winnersRoundMatches[i]) {
          winnersRoundMatches[i].loserNextMatchId = match.id
        }
      }

      prevMatches = newMatches
      winnersRound++

      if (prevMatches.length <= 1) break

      // Next round: LB winners play each other
      lbRound++
      const consolidationMatches: BracketNode[] = []
      for (let i = 0; i < prevMatches.length / 2; i++) {
        const match: BracketNode = {
          id: `l-r${lbRound}-${i}`,
          round: lbRound,
          position: i,
          bracket: 'losers',
        }
        nodes.push(match)
        consolidationMatches.push(match)

        prevMatches[i * 2].nextMatchId = match.id
        prevMatches[i * 2 + 1].nextMatchId = match.id
      }
      prevMatches = consolidationMatches
    } else {
      break
    }
  }

  // Finals Game 1: winner of LB vs winner of winners bracket
  const finalsGame1: BracketNode = {
    id: 'grand-finals',
    round: lbRound + 1,
    position: 0,
    bracket: 'losers',
  }
  nodes.push(finalsGame1)

  // Finals Game 2 (if needed): only played if LB winner wins Game 1
  const finalsGame2: BracketNode = {
    id: 'grand-finals-2',
    round: lbRound + 2,
    position: 0,
    bracket: 'losers',
    // This match inherits players from game 1, handled in advanceWinner
  }
  nodes.push(finalsGame2)

  // Link game 1 to game 2
  finalsGame1.nextMatchId = 'grand-finals-2'

  // Link finals
  const winnersFinalsMatch = winnersBracket[winnersBracket.length - 1]
  winnersFinalsMatch.nextMatchId = finalsGame1.id

  if (prevMatches.length > 0) {
    prevMatches[0].nextMatchId = finalsGame1.id
  }

  return nodes
}

// Mark LB Round 1 matches that will be BYEs (one feeder WB match is a BYE)
function markLosersBracketByes(bracket: BracketNode[]): void {
  // Find all WB Round 1 BYE matches (have winner but missing a player)
  const wbRound1Byes = bracket.filter(
    m => m.bracket === 'winners' && m.round === 1 && m.winnerId && (!m.player1Id || !m.player2Id)
  )

  // For each BYE match, the corresponding LB Round 1 match will only receive 1 player
  for (const byeMatch of wbRound1Byes) {
    if (!byeMatch.loserNextMatchId) continue

    const lbMatch = bracket.find(m => m.id === byeMatch.loserNextMatchId)
    if (!lbMatch) continue

    // Mark this LB match as a BYE by setting player2Id to a special marker
    // The arriving player will be auto-advanced
    ;(lbMatch as any).isByeMatch = true
  }
}

// Generate a complete tournament bracket
export function generateTournament(
  name: string,
  playerIds: string[],
  format: 'single_elimination' | 'double_elimination',
  bestOf: number = 1
): Tournament {
  const winnersBracket = generateWinnersBracket(playerIds, format)

  let fullBracket = winnersBracket

  if (format === 'double_elimination') {
    const losersBracket = generateLosersBracket(winnersBracket, playerIds.length)
    fullBracket = [...winnersBracket, ...losersBracket]

    // Mark LB matches that will be BYEs
    markLosersBracketByes(fullBracket)
  }

  return {
    id: generateId(),
    name,
    type: 'singles',
    format,
    bestOf,
    status: 'active',
    playerIds,
    bracket: fullBracket,
    createdAt: new Date(),
  }
}

// Advance a winner in the bracket
export function advanceWinner(
  tournament: Tournament,
  matchId: string,
  winnerId: string
): Tournament {
  const updatedBracket = tournament.bracket.map(match => {
    if (match.id === matchId) {
      return { ...match, winnerId }
    }
    return match
  })

  // Find the match and propagate winner
  const match = updatedBracket.find(m => m.id === matchId)

  // Special handling for Finals Game 1 result
  if (matchId === 'grand-finals') {
    const finalsGame1 = match!
    const finalsGame2 = updatedBracket.find(m => m.id === 'grand-finals-2')

    if (finalsGame2) {
      // WB winner is player1, LB winner is player2
      // If player1 (WB winner) wins Game 1 → tournament over (no Game 2)
      // If player2 (LB winner) wins Game 1 → Game 2 needed
      if (winnerId === finalsGame1.player2Id) {
        // LB winner won, set up Game 2 with same players
        finalsGame2.player1Id = finalsGame1.player1Id
        finalsGame2.player2Id = finalsGame1.player2Id
      }
      // If WB winner won, Game 2 stays empty (not needed)
    }
  } else if (match?.nextMatchId) {
    const nextMatch = updatedBracket.find(m => m.id === match.nextMatchId)
    if (nextMatch) {
      // Special handling for Finals Game 1
      if (nextMatch.id === 'grand-finals') {
        // WB Finals winner goes to player1, LB Finals winner goes to player2
        if (match.bracket === 'winners') {
          nextMatch.player1Id = winnerId
        } else {
          nextMatch.player2Id = winnerId
        }
      } else if (nextMatch.id === 'grand-finals-2') {
        // This is handled above in the grand-finals case
      } else {
        // Normal bracket advancement based on position
        // For LB crossover rounds (1:1 mapping), winner always goes to player1
        // For consolidation rounds (2:1 mapping), use position % 2
        if (match.bracket === 'losers' && nextMatch.bracket === 'losers' &&
            match.position === nextMatch.position) {
          // Crossover round - LB winner always goes to player1
          nextMatch.player1Id = winnerId
        } else {
          // Consolidation or WB - use position % 2
          const currentMatchPosition = match.position
          if (currentMatchPosition % 2 === 0) {
            nextMatch.player1Id = winnerId
          } else {
            nextMatch.player2Id = winnerId
          }
        }
      }
    }
  }

  // Handle loser going to loser's bracket (double elimination)
  if (tournament.format === 'double_elimination' && match?.loserNextMatchId) {
    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id
    if (loserId) {
      const loserMatch = updatedBracket.find(m => m.id === match.loserNextMatchId)
      if (loserMatch) {
        // WB Round 2+ losers drop to LB crossover rounds - they go to player2
        // (LB winners advance to player1 in crossover rounds)
        // WB Round 1 losers go to LB Round 1 where 2 losers share 1 match - use first available
        if (match.bracket === 'winners' && match.round > 1) {
          loserMatch.player2Id = loserId
        } else {
          // WB R1 losers or other cases - fill first available slot
          if (!loserMatch.player1Id) {
            loserMatch.player1Id = loserId
          } else if (!loserMatch.player2Id) {
            loserMatch.player2Id = loserId
          }
        }

        // If this is an LB BYE match (only 1 player expected), auto-advance
        if (loserMatch.isByeMatch && loserMatch.player1Id && !loserMatch.winnerId) {
          loserMatch.winnerId = loserMatch.player1Id

          // Propagate to next LB match
          if (loserMatch.nextMatchId) {
            const nextLbMatch = updatedBracket.find(m => m.id === loserMatch.nextMatchId)
            if (nextLbMatch) {
              // Use same crossover logic: if positions match, it's crossover → player1
              if (loserMatch.position === nextLbMatch.position) {
                nextLbMatch.player1Id = loserMatch.winnerId
              } else if (loserMatch.position % 2 === 0) {
                nextLbMatch.player1Id = loserMatch.winnerId
              } else {
                nextLbMatch.player2Id = loserMatch.winnerId
              }
            }
          }
        }
      }
    }
  }

  // Check if tournament is complete
  const finalMatch = updatedBracket.find(m => !m.nextMatchId && m.bracket === 'winners')

  let isComplete = false
  let tournamentWinnerId: string | undefined

  if (tournament.format === 'single_elimination') {
    isComplete = finalMatch?.winnerId !== undefined
    tournamentWinnerId = finalMatch?.winnerId
  } else {
    // Double elimination - check Finals
    const finalsGame1 = updatedBracket.find(m => m.id === 'grand-finals')
    const finalsGame2 = updatedBracket.find(m => m.id === 'grand-finals-2')

    if (finalsGame1?.winnerId) {
      // If WB winner (player1) won Game 1, tournament is over
      if (finalsGame1.winnerId === finalsGame1.player1Id) {
        isComplete = true
        tournamentWinnerId = finalsGame1.winnerId
      } else if (finalsGame2?.winnerId) {
        // LB winner won Game 1, and Game 2 has been played
        isComplete = true
        tournamentWinnerId = finalsGame2.winnerId
      }
    }
  }

  return {
    ...tournament,
    bracket: updatedBracket,
    status: isComplete ? 'complete' : 'active',
    winnerId: tournamentWinnerId,
  }
}

// Get matches by round for display
export function getMatchesByRound(
  bracket: BracketNode[],
  bracketType: 'winners' | 'losers'
): Map<number, BracketNode[]> {
  const matchesByRound = new Map<number, BracketNode[]>()

  bracket
    .filter(m => m.bracket === bracketType)
    .forEach(match => {
      const round = match.round
      if (!matchesByRound.has(round)) {
        matchesByRound.set(round, [])
      }
      matchesByRound.get(round)!.push(match)
    })

  // Sort matches within each round by position
  matchesByRound.forEach(matches => {
    matches.sort((a, b) => a.position - b.position)
  })

  return matchesByRound
}

// Check if a match is ready to be played
export function isMatchReady(match: BracketNode): boolean {
  return !!(match.player1Id && match.player2Id && !match.winnerId)
}

// Check if a match is a bye (auto-win)
export function isByeMatch(match: BracketNode): boolean {
  // WB BYE or LB BYE (marked with isByeMatch flag)
  return !!(
    ((match.player1Id && !match.player2Id) ||
     (!match.player1Id && match.player2Id) ||
     match.isByeMatch) && match.winnerId
  )
}
