import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tournament, Player } from '../types'
import { loadPlayers } from './PlayersScreen'
import { loadTournament, saveTournament, clearTournament } from './TournamentSetupScreen'
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

  .reset-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: #c0392b;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .reset-btn:hover {
    background: #e74c3c;
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
`

export function BracketScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<Map<string, Player>>(new Map())
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)

  useEffect(() => {
    const t = loadTournament()
    if (t && (id === t.id || id === 'current')) {
      setTournament(t)
    }

    const playerList = loadPlayers()
    const playerMap = new Map<string, Player>()
    playerList.forEach(p => playerMap.set(p.id, p))
    setPlayers(playerMap)
  }, [id])

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

  // Compute game numbers for all matches - numbered by round (WB + LB together)
  const gameNumbers = useMemo(() => {
    if (!tournament) return new Map<string, number>()
    const numbers = new Map<string, number>()
    let gameNum = 1

    // Get all round numbers from both brackets
    const wbRoundNums = Array.from(winnersRounds.keys()).sort((a, b) => a - b)
    const lbRoundNums = Array.from(losersRounds.keys()).sort((a, b) => a - b)
    const maxRound = Math.max(
      wbRoundNums.length > 0 ? wbRoundNums[wbRoundNums.length - 1] : 0,
      lbRoundNums.length > 0 ? lbRoundNums[lbRoundNums.length - 1] : 0
    )

    // Number games by round (WB round N, then LB round N)
    for (let round = 1; round <= maxRound; round++) {
      // WB matches for this round
      const wbMatches = winnersRounds.get(round) || []
      wbMatches.forEach(match => {
        numbers.set(match.id, gameNum++)
      })

      // LB matches for this round
      const lbMatches = losersRounds.get(round) || []
      lbMatches.forEach(match => {
        numbers.set(match.id, gameNum++)
      })

      // Grand Finals G1 comes after last LB round (same "round" as LB finals)
      if (round === maxRound && finalsGame1) {
        numbers.set(finalsGame1.id, gameNum++)
      }
    }

    // Grand Finals G2 is its own final round
    if (finalsGame2) {
      numbers.set(finalsGame2.id, gameNum++)
    }

    return numbers
  }, [tournament, winnersRounds, losersRounds, finalsGame1, finalsGame2])

  const handleSelectWinner = (matchId: string, winnerId: string) => {
    if (!tournament) return

    const updated = advanceWinner(tournament, matchId, winnerId)
    setTournament(updated)
    saveTournament(updated)
    setActiveMatchId(null)
  }

  const handleReset = () => {
    if (!confirm('Delete this tournament? This cannot be undone.')) return
    clearTournament()
    navigate('/')
  }

  const champion = tournament?.winnerId ? players.get(tournament.winnerId) : null

  const getRoundLabel = (round: number, totalRounds: number, bracket: 'winners' | 'losers') => {
    if (bracket === 'winners') {
      return `WB Round ${round}`
    } else {
      return `LB Round ${round}`
    }
  }

  if (!tournament) {
    return (
      <div className="bracket-screen">
        <div className="bracket-header">
          <span className="bracket-title">Tournament</span>
        </div>
        <div className="no-tournament">
          <div className="no-tournament-title">No Active Tournament</div>
          <div>Create a new tournament to get started</div>
          <button className="create-link" onClick={() => navigate('/tournament/setup')}>
            Create Tournament
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
  const maxLosersRound = losersRounds.size > 0 ? Math.max(...Array.from(losersRounds.keys())) : 0

  return (
    <div className="bracket-screen">
      <div className="bracket-header">
        <span className="bracket-title">{tournament.name}</span>
        <span className={`bracket-status ${tournament.status}`}>
          {tournament.status}
        </span>
      </div>

      <div className="bracket-content">
        {champion && (
          <div className="champion-display">
            <div className="champion-label">Champion</div>
            <div className="champion-name">{champion.name}</div>
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
                    {getRoundLabel(round, maxWinnersRound, 'winners')}
                  </div>
                  <div className="round-matches">
                    {matches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        players={players}
                        onSelectWinner={handleSelectWinner}
                        showModal={activeMatchId === match.id}
                        onOpenModal={() => setActiveMatchId(match.id)}
                        onCloseModal={() => setActiveMatchId(null)}
                        gameNumber={gameNumbers.get(match.id)}
                        player1Losses={0}
                        player2Losses={0}
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
                    onSelectWinner={handleSelectWinner}
                    showModal={activeMatchId === finalsGame1.id}
                    onOpenModal={() => setActiveMatchId(finalsGame1.id)}
                    onCloseModal={() => setActiveMatchId(null)}
                    gameNumber={gameNumbers.get(finalsGame1.id)}
                    player1Losses={0}
                    player2Losses={1}
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
                    onSelectWinner={handleSelectWinner}
                    showModal={activeMatchId === finalsGame2.id}
                    onOpenModal={() => setActiveMatchId(finalsGame2.id)}
                    onCloseModal={() => setActiveMatchId(null)}
                    gameNumber={gameNumbers.get(finalsGame2.id)}
                    player1Losses={1}
                    player2Losses={1}
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
                      {getRoundLabel(round, maxLosersRound, 'losers')}
                    </div>
                    <div className="round-matches">
                      {matches.map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          players={players}
                          onSelectWinner={handleSelectWinner}
                          showModal={activeMatchId === match.id}
                          onOpenModal={() => setActiveMatchId(match.id)}
                          onCloseModal={() => setActiveMatchId(null)}
                          gameNumber={gameNumbers.get(match.id)}
                          player1Losses={1}
                          player2Losses={1}
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
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
        <button className="reset-btn" onClick={handleReset}>
          Delete
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
