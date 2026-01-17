import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Player, BracketNode } from '../types'
import { usePlayers } from '../hooks/usePlayers'
import { useTournament } from '../hooks/useTournaments'
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
`

export function BracketScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const settings = loadSettings()
  const namespace = settings.namespace
  const { players: playerList, recordTournamentGameResult, undoTournamentGameResult, recordFinalsWin, recordFinalsLoss, undoFinalsWin, undoFinalsLoss, recordTeamGameResult, undoTeamGameResult, recordTeamFinalsWin, recordTeamFinalsLoss, undoTeamFinalsWin, undoTeamFinalsLoss } = usePlayers(namespace)
  const { tournament, loading, updateTournament, archiveTournament, deleteTournament } = useTournament(namespace, id)
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)

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

  // Compute game numbers based on playability from INITIAL bracket structure
  // Numbers are assigned once and never change as games complete
  const gameNumbers = useMemo(() => {
    if (!tournament) return new Map<string, number>()
    const numbers = new Map<string, number>()
    let gameNum = 1

    // Helper: check if a match is structurally a BYE (only one player slot filled)
    // This is based on bracket structure, not current game state
    const isStructuralBye = (match: BracketNode) => {
      // Check original structure: one player and marked as bye, OR only one player slot
      if (match.isByeMatch) return true
      // For R1 matches, check if only one player was assigned at creation
      if (match.round === 1 && match.bracket === 'winners') {
        // Count how many player slots have IDs (from original seeding)
        const hasP1 = !!match.player1Id
        const hasP2 = !!match.player2Id
        return (hasP1 && !hasP2) || (!hasP1 && hasP2)
      }
      return false
    }

    // Helper: check if match is immediately playable from tournament start
    // (both feeder matches are BYEs, so players are known immediately)
    const isImmediatelyPlayable = (match: BracketNode) => {
      if (isStructuralBye(match)) return false
      // Only WB R1 non-BYE matches are playable first (LB R1 needs WB losers)
      if (match.round === 1 && match.bracket === 'winners') return true

      // For later rounds, check if ALL feeder matches are structural BYEs
      const feeders = tournament.bracket.filter(m => m.nextMatchId === match.id)
      if (feeders.length === 0) return false
      return feeders.every(f => isStructuralBye(f))
    }

    // Get all round numbers from both brackets
    const wbRoundNums = Array.from(winnersRounds.keys()).sort((a, b) => a - b)
    const lbRoundNums = Array.from(losersRounds.keys()).sort((a, b) => a - b)
    const maxRound = Math.max(
      wbRoundNums.length > 0 ? wbRoundNums[wbRoundNums.length - 1] : 0,
      lbRoundNums.length > 0 ? lbRoundNums[lbRoundNums.length - 1] : 0
    )

    // Number games by round, prioritizing immediately-playable matches
    for (let round = 1; round <= maxRound; round++) {
      const wbMatches = winnersRounds.get(round) || []
      const lbMatches = losersRounds.get(round) || []
      const allMatches = [...wbMatches, ...lbMatches]

      // Separate into immediately playable vs waiting, skip structural BYEs
      const immediate: BracketNode[] = []
      const waiting: BracketNode[] = []

      allMatches.forEach((match: BracketNode) => {
        if (isStructuralBye(match)) return
        if (isImmediatelyPlayable(match)) {
          immediate.push(match)
        } else {
          waiting.push(match)
        }
      })

      // Sort each group by position for consistency
      immediate.sort((a, b) => a.position - b.position)
      waiting.sort((a, b) => a.position - b.position)

      // Number immediate matches first, then waiting
      immediate.forEach((match: BracketNode) => {
        numbers.set(match.id, gameNum++)
      })
      waiting.forEach((match: BracketNode) => {
        numbers.set(match.id, gameNum++)
      })

      // Grand Finals G1 comes after last round
      if (round === maxRound && finalsGame1) {
        numbers.set(finalsGame1.id, gameNum++)
      }
    }

    // Grand Finals G2 always gets a number (shown conditionally in UI)
    if (finalsGame2) {
      numbers.set(finalsGame2.id, gameNum++)
    }

    return numbers
  }, [tournament, winnersRounds, losersRounds, finalsGame1, finalsGame2])

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
    if (!confirm('Archive this tournament? You can still view it later.')) return
    try {
      await archiveTournament()
      navigate('/tournament/list')
    } catch (err) {
      console.error('Failed to archive tournament:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this tournament? This cannot be undone.')) return
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
      <div className="bracket-screen">
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
      <div className="bracket-screen">
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
    <div className="bracket-screen">
      {tournament.archived && (
        <div className="archived-banner">This tournament is archived</div>
      )}
      <div className="bracket-header">
        <span className="bracket-title">{tournament.name}</span>
        <span className={`bracket-status ${tournament.status}`}>
          {tournament.status}
        </span>
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
