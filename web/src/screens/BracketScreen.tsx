import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Player, BracketNode } from '../types'
import { usePlayers } from '../hooks/usePlayers'
import { useTournament } from '../hooks/useTournaments'
import { useConfirm } from '../contexts/ModalContext'
import { loadSettings } from './SettingsScreen'
import { MatchCard } from '../components/MatchCard'
import { getMatchesByRound, advanceWinner } from '../lib/bracket'

const styles = `
  .bracket-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .bracket-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #111;
    flex-shrink: 0;
  }

  .bracket-title {
    font-size: 1.125rem;
    font-weight: bold;
  }

  .bracket-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
  }

  .bracket-status.active {
    background: #27ae60;
    color: white;
  }

  .bracket-status.complete {
    background: #d35400;
    color: white;
  }

  .bracket-content {
    flex: 1;
    overflow: auto;
    padding: 1rem;
  }

  .bracket-section {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 0.875rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }

  .bracket-rounds {
    display: flex;
    gap: 1.5rem;
    overflow-x: auto;
    padding: 0 0 1rem 1rem;
  }

  .bracket-round {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 130px;
  }

  .round-label {
    font-size: 0.75rem;
    color: #666;
    text-align: center;
    margin-bottom: 0.25rem;
  }

  .round-matches {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    justify-content: space-around;
    flex: 1;
  }

  .match-spacer {
    flex: 1;
  }

  .champion-display {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, #d35400, #e67e22);
    border-radius: 1rem;
    margin-bottom: 1rem;
  }

  .champion-label {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.8);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .champion-name {
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 0.5rem;
  }

  .bracket-footer {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: #111;
    flex-shrink: 0;
  }

  .back-btn {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    background: #333;
    color: #aaa;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .back-btn:hover {
    background: #444;
    color: white;
  }

  .archive-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: #555;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .archive-btn:hover {
    background: #666;
  }

  .delete-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: #c0392b;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .delete-btn:hover {
    background: #e74c3c;
  }

  .archived-banner {
    background: #555;
    color: #ccc;
    text-align: center;
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .no-tournament {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #888;
  }

  .no-tournament-title {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .create-link {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #d35400;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }

  /* Mobile: vertical list layout */
  @media (max-width: 600px) {
    .bracket-rounds {
      flex-direction: column;
      overflow-x: visible;
      gap: 2rem;
      padding: 0;
    }

    .bracket-round {
      min-width: auto;
      width: 100%;
    }

    .round-label {
      font-size: 0.875rem;
      font-weight: bold;
      text-align: left;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #333;
    }

    .round-matches {
      gap: 0.75rem;
    }
  }

  /* Light theme */
  .bracket-screen.light {
    background: #f5f5f5;
    color: #333;
  }

  .bracket-screen.light .bracket-header {
    background: #fff;
    border-bottom: 1px solid #ddd;
  }

  .bracket-screen.light .section-title {
    color: #666;
    border-bottom-color: #ddd;
  }

  .bracket-screen.light .round-label {
    color: #888;
  }

  .bracket-screen.light .bracket-footer {
    background: #fff;
    border-top: 1px solid #ddd;
  }

  .bracket-screen.light .back-btn {
    background: #e0e0e0;
    color: #666;
  }

  .bracket-screen.light .back-btn:hover {
    background: #d0d0d0;
    color: #333;
  }

  .bracket-screen.light .archive-btn {
    background: #888;
  }

  .bracket-screen.light .archive-btn:hover {
    background: #999;
  }

  .bracket-screen.light .archived-banner {
    background: #ddd;
    color: #666;
  }

  .bracket-screen.light .no-tournament {
    color: #666;
  }

  .theme-toggle {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    background: #333;
    color: #aaa;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    margin-right: 0.5rem;
  }

  .theme-toggle:hover {
    background: #444;
    color: white;
  }

  .bracket-screen.light .theme-toggle {
    background: #e0e0e0;
    color: #666;
  }

  .bracket-screen.light .theme-toggle:hover {
    background: #d0d0d0;
    color: #333;
  }

  @media (max-width: 600px) {
    .bracket-screen.light .round-label {
      border-bottom-color: #ddd;
    }
  }
`

export function BracketScreen() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { id } = useParams()
  const settings = loadSettings()
  const namespace = settings.namespace
  const { players: playerList, recordTournamentGameResult, undoTournamentGameResult, recordFinalsWin, recordFinalsLoss, undoFinalsWin, undoFinalsLoss, recordTeamGameResult, undoTeamGameResult, recordTeamFinalsWin, recordTeamFinalsLoss, undoTeamFinalsWin, undoTeamFinalsLoss } = usePlayers(namespace)
  const { tournament, loading, updateTournament, archiveTournament, deleteTournament } = useTournament(namespace, id)
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('bracketTheme')
    return (saved === 'light' || saved === 'dark') ? saved : 'dark'
  })

  useEffect(() => {
    localStorage.setItem('bracketTheme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // Convert player list to Map for easy lookup
  const players = useMemo(() => {
    const playerMap = new Map<string, Player>()
    playerList.forEach(p => playerMap.set(p.id, p))
    return playerMap
  }, [playerList])

  const winnersRounds = useMemo(() => {
    if (!tournament) return new Map()
    return getMatchesByRound(tournament.bracket, 'winners')
  }, [tournament])

  const losersRounds = useMemo(() => {
    if (!tournament) return new Map()
    // Filter out grand-finals and grand-finals-2 from loser's bracket display
    const rounds = getMatchesByRound(tournament.bracket, 'losers')
    rounds.forEach((matches, round) => {
      const filtered = matches.filter(m => m.id !== 'grand-finals' && m.id !== 'grand-finals-2')
      if (filtered.length === 0) {
        rounds.delete(round)
      } else {
        rounds.set(round, filtered)
      }
    })
    return rounds
  }, [tournament])

  const finalsGame1 = useMemo(() => {
    if (!tournament || tournament.format !== 'double_elimination') return null
    return tournament.bracket.find(m => m.id === 'grand-finals') || null
  }, [tournament])

  const finalsGame2 = useMemo(() => {
    if (!tournament || tournament.format !== 'double_elimination') return null
    return tournament.bracket.find(m => m.id === 'grand-finals-2') || null
  }, [tournament])

  // Game 2 is only needed if LB winner won Game 1
  const needsGame2 = finalsGame1?.winnerId && finalsGame1.winnerId === finalsGame1.player2Id

  // Compute game numbers based on playability order using BFS
  // Games are numbered in the order they become playable, so players
  // don't have to play back-to-back and game N is always playable
  // before game N+1
  const gameNumbers = useMemo(() => {
    if (!tournament) return new Map<string, number>()
    const bracket = tournament.bracket
    const numbers = new Map<string, number>()

    // Helper: check if a match is structurally a BYE
    const isStructuralBye = (match: BracketNode) => {
      if (match.isByeMatch) return true
      if (match.round === 1 && match.bracket === 'winners') {
        const hasP1 = !!match.player1Id
        const hasP2 = !!match.player2Id
        return (hasP1 && !hasP2) || (!hasP1 && hasP2)
      }
      return false
    }

    // Build reverse feeder map: matchId → matches that feed into it
    // (via nextMatchId for winners, loserNextMatchId for losers)
    const feedersOf = new Map<string, BracketNode[]>()
    for (const match of bracket) {
      if (match.nextMatchId) {
        const list = feedersOf.get(match.nextMatchId) || []
        list.push(match)
        feedersOf.set(match.nextMatchId, list)
      }
      if (match.loserNextMatchId) {
        const list = feedersOf.get(match.loserNextMatchId) || []
        list.push(match)
        feedersOf.set(match.loserNextMatchId, list)
      }
    }

    // BFS: compute playability waves
    const resolved = new Set<string>()
    const waveOf = new Map<string, number>()
    const byeFeederSet = new Set<string>()

    // Auto-resolve all structural BYEs whose feeders are resolved
    const tryResolveByes = () => {
      let changed = true
      while (changed) {
        changed = false
        for (const match of bracket) {
          if (resolved.has(match.id) || !isStructuralBye(match)) continue
          const f = feedersOf.get(match.id) || []
          if (f.length === 0 || f.every(m => resolved.has(m.id))) {
            resolved.add(match.id)
            changed = true
          }
        }
      }
    }

    // Initially resolve BYEs with no unresolved feeders
    tryResolveByes()

    // BFS: find playable matches in waves
    let wave = 0
    while (true) {
      const waveMatches: BracketNode[] = []

      for (const match of bracket) {
        if (resolved.has(match.id) || isStructuralBye(match)) continue
        if (match.id === 'grand-finals' || match.id === 'grand-finals-2') continue
        const f = feedersOf.get(match.id) || []
        if (f.length === 0 || f.every(m => resolved.has(m.id))) {
          waveMatches.push(match)
          if (f.some(m => isStructuralBye(m))) {
            byeFeederSet.add(match.id)
          }
        }
      }

      if (waveMatches.length === 0) break

      for (const match of waveMatches) {
        waveOf.set(match.id, wave)
        resolved.add(match.id)
      }

      // Auto-resolve BYEs that are now unblocked
      tryResolveByes()
      wave++
    }

    // Apply LB round-ordering constraint: LB round N must come after LB round N-1
    const lbRealMatches = bracket.filter(m => m.bracket === 'losers' && !isStructuralBye(m) && waveOf.has(m.id))
    const lbRounds = [...new Set(lbRealMatches.map(m => m.round))].sort((a, b) => a - b)
    let minLbWave = 0
    for (const round of lbRounds) {
      let maxWaveInRound = 0
      for (const match of lbRealMatches) {
        if (match.round !== round) continue
        const w = Math.max(waveOf.get(match.id)!, minLbWave)
        waveOf.set(match.id, w)
        maxWaveInRound = Math.max(maxWaveInRound, w)
      }
      minLbWave = maxWaveInRound + 1
    }

    // Collect and sort all real matches by wave, then within-wave criteria
    const realMatches = bracket.filter(m =>
      !isStructuralBye(m) && waveOf.has(m.id) &&
      m.id !== 'grand-finals' && m.id !== 'grand-finals-2'
    )

    realMatches.sort((a, b) => {
      const wA = waveOf.get(a.id)!
      const wB = waveOf.get(b.id)!
      if (wA !== wB) return wA - wB

      // In later waves, prioritize matches with BYE feeders (fresh players)
      // In wave 0, use round ordering instead (R1 before R2)
      if (wA > 0) {
        const byeA = byeFeederSet.has(a.id) ? 0 : 1
        const byeB = byeFeederSet.has(b.id) ? 0 : 1
        if (byeA !== byeB) return byeA - byeB
      }

      // Then by round number (lower first)
      if (a.round !== b.round) return a.round - b.round

      // Then WB before LB
      const bracketOrd = (m: BracketNode) => m.bracket === 'winners' ? 0 : 1
      if (bracketOrd(a) !== bracketOrd(b)) return bracketOrd(a) - bracketOrd(b)

      // Then by position
      return a.position - b.position
    })

    let gameNum = 1
    for (const match of realMatches) {
      numbers.set(match.id, gameNum++)
    }

    // Grand Finals
    if (finalsGame1) numbers.set(finalsGame1.id, gameNum++)
    if (finalsGame2) numbers.set(finalsGame2.id, gameNum++)

    return numbers
  }, [tournament, finalsGame1, finalsGame2])

  // Helper to get player IDs from a team ID
  const getTeamPlayerIds = (teamId: string): string[] => {
    if (!tournament?.teams) return []
    const team = tournament.teams.find(t => t.id === teamId)
    return team ? [team.player1Id, team.player2Id] : []
  }

  const handleSelectWinner = async (matchId: string, winnerId: string) => {
    if (!tournament) return

    const isDoubles = tournament.type === 'doubles'

    // Find the match to check previous winner
    const match = tournament.bracket.find(m => m.id === matchId)
    if (!match || !match.player1Id || !match.player2Id) return

    const previousWinnerId = match.winnerId
    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id

    // Case 1: Same winner selected - no DB update needed
    if (previousWinnerId === winnerId) {
      setActiveMatchId(null)
      return
    }

    // Case 2: Winner changed - undo old result, record new result
    if (previousWinnerId) {
      const previousLoserId = match.player1Id === previousWinnerId ? match.player2Id : match.player1Id
      try {
        if (isDoubles) {
          const oldWinnerPlayerIds = getTeamPlayerIds(previousWinnerId)
          const oldLoserPlayerIds = getTeamPlayerIds(previousLoserId)
          if (oldWinnerPlayerIds.length > 0 && oldLoserPlayerIds.length > 0) {
            await undoTeamGameResult(oldWinnerPlayerIds, oldLoserPlayerIds)
          }
        } else {
          await undoTournamentGameResult(previousWinnerId, previousLoserId)
        }
      } catch (err) {
        console.error('Failed to undo game result:', err)
      }
    }

    // Case 3: New winner (or changed winner) - record new result
    try {
      if (isDoubles) {
        const winnerPlayerIds = getTeamPlayerIds(winnerId)
        const loserPlayerIds = getTeamPlayerIds(loserId)
        if (winnerPlayerIds.length > 0 && loserPlayerIds.length > 0) {
          await recordTeamGameResult(winnerPlayerIds, loserPlayerIds)
        }
      } else {
        await recordTournamentGameResult(winnerId, loserId)
      }
    } catch (err) {
      console.error('Failed to record game result:', err)
    }

    const updated = advanceWinner(tournament, matchId, winnerId)

    // Update Firebase with new bracket state
    try {
      await updateTournament({
        bracket: updated.bracket,
        status: updated.status,
        winnerId: updated.winnerId,
      })
    } catch (err) {
      console.error('Failed to update tournament:', err)
    }
    setActiveMatchId(null)

    // Handle finals stats when tournament completes or champion changes
    if (updated.winnerId) {
      const previousTournamentWinnerId = tournament.winnerId

      // Undo previous finals if changing the champion
      if (previousTournamentWinnerId && previousTournamentWinnerId !== updated.winnerId) {
        try {
          // Find the old runner-up (the loser of the finals match before this change)
          const previousLoserId = match.player1Id === previousTournamentWinnerId ? match.player2Id : match.player1Id
          if (isDoubles) {
            const oldWinnerPlayerIds = getTeamPlayerIds(previousTournamentWinnerId)
            const oldLoserPlayerIds = getTeamPlayerIds(previousLoserId)
            if (oldWinnerPlayerIds.length > 0) {
              await undoTeamFinalsWin(oldWinnerPlayerIds)
            }
            if (oldLoserPlayerIds.length > 0) {
              await undoTeamFinalsLoss(oldLoserPlayerIds)
            }
          } else {
            await undoFinalsWin(previousTournamentWinnerId)
            await undoFinalsLoss(previousLoserId)
          }
        } catch (err) {
          console.error('Failed to undo finals result:', err)
        }
      }

      // Record new finals (first completion or changed champion)
      if (!previousTournamentWinnerId || previousTournamentWinnerId !== updated.winnerId) {
        try {
          if (isDoubles) {
            const winnerPlayerIds = getTeamPlayerIds(updated.winnerId)
            const loserPlayerIds = getTeamPlayerIds(loserId)
            if (winnerPlayerIds.length > 0) {
              await recordTeamFinalsWin(winnerPlayerIds)
            }
            if (loserPlayerIds.length > 0) {
              await recordTeamFinalsLoss(loserPlayerIds)
            }
          } else {
            await recordFinalsWin(updated.winnerId)
            await recordFinalsLoss(loserId)
          }
        } catch (err) {
          console.error('Failed to record finals result:', err)
        }
      }
    }
  }

  const handleArchive = async () => {
    const confirmed = await confirm({
      message: 'Archive this tournament? You can still view it later.',
      confirmText: 'Archive'
    })
    if (!confirmed) return
    try {
      await archiveTournament()
      navigate('/tournament/list')
    } catch (err) {
      console.error('Failed to archive tournament:', err)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      message: 'Delete this tournament? This cannot be undone.',
      confirmText: 'Delete',
      danger: true
    })
    if (!confirmed) return
    try {
      await deleteTournament()
      navigate('/tournament')
    } catch (err) {
      console.error('Failed to delete tournament:', err)
    }
  }

  // For singles, get player directly. For doubles, get team name.
  const getChampionName = (): string | null => {
    if (!tournament?.winnerId) return null
    if (tournament.type === 'doubles') {
      const team = tournament.teams?.find(t => t.id === tournament.winnerId)
      if (!team) return null
      const p1 = players.get(team.player1Id)
      const p2 = players.get(team.player2Id)
      if (!p1 || !p2) return null
      return `${p1.name} & ${p2.name}`
    }
    const player = players.get(tournament.winnerId)
    return player?.name || null
  }

  const championName = getChampionName()

  const getRoundLabel = (round: number, bracket: 'winners' | 'losers') => {
    if (bracket === 'winners') {
      return `WB Round ${round}`
    } else {
      return `LB Round ${round}`
    }
  }

  if (loading) {
    return (
      <div className={`bracket-screen ${theme}`}>
        <div className="bracket-header">
          <span className="bracket-title">Tournament</span>
        </div>
        <div className="no-tournament">
          <div className="no-tournament-title">Loading...</div>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className={`bracket-screen ${theme}`}>
        <div className="bracket-header">
          <span className="bracket-title">Tournament</span>
        </div>
        <div className="no-tournament">
          <div className="no-tournament-title">Tournament Not Found</div>
          <div>This tournament may have been deleted</div>
          <button className="create-link" onClick={() => navigate('/tournament/list')}>
            View Tournaments
          </button>
        </div>
        <div className="bracket-footer">
          <button className="back-btn" onClick={() => navigate('/')}>
            Back to Menu
          </button>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  const maxWinnersRound = Math.max(...Array.from(winnersRounds.keys()))

  return (
    <div className={`bracket-screen ${theme}`}>
      {tournament.archived && (
        <div className="archived-banner">This tournament is archived</div>
      )}
      <div className="bracket-header">
        <span className="bracket-title">{tournament.name}</span>
        <div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <span className={`bracket-status ${tournament.status}`}>
            {tournament.status}
          </span>
        </div>
      </div>

      <div className="bracket-content">
        {championName && (
          <div className="champion-display">
            <div className="champion-label">Champion</div>
            <div className="champion-name">{championName}</div>
          </div>
        )}

        <div className="bracket-section">
          <div className="section-title">
            {tournament.format === 'double_elimination' ? "Winner's Bracket" : 'Bracket'}
          </div>
          <div className="bracket-rounds">
            {Array.from(winnersRounds.entries())
              .sort(([a], [b]) => a - b)
              .map(([round, matches]) => (
                <div key={`w-${round}`} className="bracket-round">
                  <div className="round-label">
                    {getRoundLabel(round, 'winners')}
                  </div>
                  <div className="round-matches">
                    {matches.map((match: BracketNode) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        players={players}
                        teams={tournament.teams}
                        tournamentType={tournament.type}
                        onSelectWinner={handleSelectWinner}
                        showModal={activeMatchId === match.id}
                        onOpenModal={() => setActiveMatchId(match.id)}
                        onCloseModal={() => setActiveMatchId(null)}
                        gameNumber={gameNumbers.get(match.id)}
                        showHeader={true}
                        player1Losses={0}
                        player2Losses={0}
                        namespace={namespace}
                        tournamentStartedAt={tournament.createdAt.getTime()}
                        theme={theme}
                      />
                    ))}
                  </div>
                </div>
              ))}
            {finalsGame1 && (
              <div className="bracket-round">
                <div className="round-label">WB Round {maxWinnersRound + 1}</div>
                <div className="round-matches">
                  <MatchCard
                    match={finalsGame1}
                    players={players}
                    teams={tournament.teams}
                    tournamentType={tournament.type}
                    onSelectWinner={handleSelectWinner}
                    showModal={activeMatchId === finalsGame1.id}
                    onOpenModal={() => setActiveMatchId(finalsGame1.id)}
                    onCloseModal={() => setActiveMatchId(null)}
                    gameNumber={gameNumbers.get(finalsGame1.id)}
                    showHeader={true}
                    player1Losses={0}
                    player2Losses={1}
                    namespace={namespace}
                    tournamentStartedAt={tournament.createdAt.getTime()}
                    theme={theme}
                  />
                </div>
              </div>
            )}
            {finalsGame1 && (needsGame2 || finalsGame2?.winnerId) && finalsGame2 && (
              <div className="bracket-round">
                <div className="round-label">WB Round {maxWinnersRound + 2}</div>
                <div className="round-matches">
                  <MatchCard
                    match={finalsGame2}
                    players={players}
                    teams={tournament.teams}
                    tournamentType={tournament.type}
                    onSelectWinner={handleSelectWinner}
                    showModal={activeMatchId === finalsGame2.id}
                    onOpenModal={() => setActiveMatchId(finalsGame2.id)}
                    onCloseModal={() => setActiveMatchId(null)}
                    gameNumber={gameNumbers.get(finalsGame2.id)}
                    showHeader={true}
                    player1Losses={1}
                    player2Losses={1}
                    namespace={namespace}
                    tournamentStartedAt={tournament.createdAt.getTime()}
                    theme={theme}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {tournament.format === 'double_elimination' && losersRounds.size > 0 && (
          <div className="bracket-section">
            <div className="section-title">Loser's Bracket</div>
            <div className="bracket-rounds">
              {Array.from(losersRounds.entries())
                .sort(([a], [b]) => a - b)
                .map(([round, matches]) => (
                  <div key={`l-${round}`} className="bracket-round">
                    <div className="round-label">
                      {getRoundLabel(round, 'losers')}
                    </div>
                    <div className="round-matches">
                      {matches.map((match: BracketNode) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          players={players}
                          teams={tournament.teams}
                          tournamentType={tournament.type}
                          onSelectWinner={handleSelectWinner}
                          showModal={activeMatchId === match.id}
                          onOpenModal={() => setActiveMatchId(match.id)}
                          onCloseModal={() => setActiveMatchId(null)}
                          gameNumber={gameNumbers.get(match.id)}
                          showHeader={true}
                          player1Losses={1}
                          player2Losses={1}
                          namespace={namespace}
                          tournamentStartedAt={tournament.createdAt.getTime()}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="bracket-footer">
        <button className="back-btn" onClick={() => navigate('/tournament')}>
          Back
        </button>
        {!tournament.archived && (
          tournament.status === 'complete' ? (
            <button className="archive-btn" onClick={handleArchive}>
              Archive
            </button>
          ) : (
            <button className="delete-btn" onClick={handleDelete}>
              Delete
            </button>
          )
        )}
      </div>

      <style>{styles}</style>
    </div>
  )
}
