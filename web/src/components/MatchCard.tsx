import { useState, useEffect, useRef } from 'react'
import { BracketNode, Player, Team } from '../types'
import { isMatchReady, isByeMatch } from '../lib/bracket'
import { subscribeToGame, initializeGame, FirebaseGameState } from '../lib/firebase'

const styles = `
  .match-card {
    display: flex;
    flex-direction: column;
    background: #2a2a2a;
    border-radius: 0.375rem;
    overflow: hidden;
    min-width: 180px;
    border: 1px solid #333;
  }

  .match-card.clickable {
    cursor: pointer;
    transition: transform 0.1s, border-color 0.2s;
  }

  .match-card.clickable:hover {
    transform: scale(1.02);
    border-color: #d35400;
  }

  .match-card.completed {
    opacity: 0.8;
  }

  .match-card.bye {
    opacity: 0.6;
  }

  .match-player {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    border-bottom: 1px solid #333;
  }

  .match-player:last-child {
    border-bottom: none;
  }

  .match-player.winner {
    background: #27ae60;
    color: white;
  }

  .match-player.loser {
    opacity: 0.5;
  }

  .match-player.tbd {
    color: #666;
    font-style: italic;
  }

  .match-player.bye-slot {
    color: #444;
    font-style: italic;
  }

  .player-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .loss-count {
    font-size: 0.6rem;
    color: #888;
    vertical-align: sub;
  }

  .loss-count::before {
    content: ' ';
  }

  .match-player.winner .loss-count {
    color: white;
  }

  .game-number {
    font-size: 0.65rem;
    color: #888;
    text-align: center;
    padding: 0.25rem;
    background: #222;
    border-bottom: 1px solid #333;
  }

  .winner-indicator {
    margin-left: 0.5rem;
    font-size: 0.7rem;
  }

  .live-score {
    font-weight: bold;
    font-size: 0.9rem;
    min-width: 1.5rem;
    text-align: right;
  }

  .match-card.live {
    border-color: #27ae60;
    box-shadow: 0 0 8px rgba(39, 174, 96, 0.3);
  }

  .game-number.live {
    background: #27ae60;
    color: white;
  }

  .match-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .match-modal {
    background: #2a2a2a;
    border-radius: 1rem;
    padding: 1.5rem;
    width: 90%;
    max-width: 300px;
  }

  .match-modal-title {
    font-size: 1rem;
    color: #888;
    text-align: center;
    margin-bottom: 1rem;
  }

  .winner-btn {
    display: block;
    width: 100%;
    padding: 1rem;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    background: #333;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .winner-btn:hover {
    background: #27ae60;
  }

  .cancel-winner-btn {
    display: block;
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    background: transparent;
    color: #888;
    border: none;
    cursor: pointer;
  }

  .cancel-winner-btn:hover {
    color: white;
  }
`

interface MatchCardProps {
  match: BracketNode
  players: Map<string, Player>
  teams?: Team[]
  tournamentType?: 'singles' | 'doubles'
  onSelectWinner?: (matchId: string, winnerId: string) => void
  showModal?: boolean
  onCloseModal?: () => void
  onOpenModal?: () => void
  gameNumber?: number
  showHeader?: boolean
  player1Losses?: number
  player2Losses?: number
  namespace?: string
  tournamentStartedAt?: number
}

// Helper to get team name from team ID
function getTeamName(teamId: string, teams: Team[] | undefined, players: Map<string, Player>): string | null {
  if (!teams) return null
  const team = teams.find(t => t.id === teamId)
  if (!team) return null
  const p1 = players.get(team.player1Id)
  const p2 = players.get(team.player2Id)
  if (!p1 || !p2) return null
  return `${p1.name} & ${p2.name}`
}


export function MatchCard({
  match,
  players,
  teams,
  tournamentType = 'singles',
  onSelectWinner,
  showModal,
  onCloseModal,
  onOpenModal,
  gameNumber,
  showHeader,
  player1Losses,
  player2Losses,
  namespace,
  tournamentStartedAt,
}: MatchCardProps) {
  const [liveGame, setLiveGame] = useState<FirebaseGameState | null>(null)
  const isDoubles = tournamentType === 'doubles'

  // For singles: get player directly. For doubles: get team and display both player names
  const player1 = match.player1Id ? players.get(match.player1Id) : null
  const player2 = match.player2Id ? players.get(match.player2Id) : null
  const team1Name = isDoubles && match.player1Id ? getTeamName(match.player1Id, teams, players) : null
  const team2Name = isDoubles && match.player2Id ? getTeamName(match.player2Id, teams, players) : null

  const ready = isMatchReady(match)
  const isBye = isByeMatch(match)
  const hasWinner = !!match.winnerId
  const clickable = ready && onSelectWinner

  // Track which match+players we've initialized to avoid unnecessary re-initializing
  const initializedRef = useRef<string | null>(null)

  // Track which match we've already triggered winner selection for
  const winnerTriggeredRef = useRef<string | null>(null)

  // Get display names for Firebase
  const player1DisplayName = isDoubles ? (team1Name || 'TBD') : (player1?.name || 'TBD')
  const player2DisplayName = isDoubles ? (team2Name || 'TBD') : (player2?.name || 'TBD')

  // Initialize and subscribe to all games with a game number (not just ready matches)
  const shouldSubscribe = gameNumber !== undefined && namespace && !hasWinner
  useEffect(() => {
    if (!namespace || gameNumber === undefined) {
      setLiveGame(null)
      return
    }

    // Initialize game with fresh data when match or players change
    // Re-initialize when players change from TBD to actual names
    const initKey = `${match.id}-${player1DisplayName}-${player2DisplayName}`
    const shouldInit = initializedRef.current !== initKey && !hasWinner
    console.log(`Game ${gameNumber}: initKey=${initKey}, prevKey=${initializedRef.current}, shouldInit=${shouldInit}`)
    if (shouldInit) {
      initializedRef.current = initKey
      console.log(`Initializing game ${gameNumber} with ${player1DisplayName} vs ${player2DisplayName}`)
      initializeGame(namespace, gameNumber, player1DisplayName, player2DisplayName)
        .catch(err => console.error('Failed to initialize game:', err))
    }

    // Subscribe to live updates (even for completed matches to see final state)
    if (!shouldSubscribe) {
      setLiveGame(null)
      return
    }

    const unsubscribe = subscribeToGame(namespace, gameNumber, (state) => {
      setLiveGame(state)
    })

    return unsubscribe
  }, [shouldSubscribe, namespace, gameNumber, match.id, player1DisplayName, player2DisplayName, hasWinner])

  // Auto-detect winner when a round is won (player1Rounds or player2Rounds >= 1)
  // With best of 1, winning a game = winning a round, and everything resets to 0
  // Only trigger if game data is fresh (updated after tournament started)
  useEffect(() => {
    if (!liveGame || hasWinner || !onSelectWinner || !match.player1Id || !match.player2Id) return

    // Ignore stale data from before the tournament started
    if (tournamentStartedAt && liveGame.updatedAt < tournamentStartedAt) return

    // Prevent duplicate triggers (effect can fire multiple times before state updates)
    if (winnerTriggeredRef.current === match.id) return

    // Check if either player has won a round (for tournament, first to 1 round wins)
    if (liveGame.player1Rounds >= 1) {
      winnerTriggeredRef.current = match.id
      onSelectWinner(match.id, match.player1Id)
    } else if (liveGame.player2Rounds >= 1) {
      winnerTriggeredRef.current = match.id
      onSelectWinner(match.id, match.player2Id)
    }
  }, [liveGame?.player1Rounds, liveGame?.player2Rounds, liveGame?.updatedAt, tournamentStartedAt, hasWinner, onSelectWinner, match.id, match.player1Id, match.player2Id])

  // Game is "live" only when scoring has started (not just initialized)
  const isLive = liveGame !== null && (liveGame.player1Score > 0 || liveGame.player2Score > 0)

  const getPlayerClass = (playerId: string | undefined) => {
    if (!playerId) return 'tbd'
    if (!hasWinner) return ''
    if (playerId === match.winnerId) return 'winner'
    return 'loser'
  }

  const handleClick = () => {
    if (clickable && onOpenModal) {
      onOpenModal()
    }
  }

  const handleSelectWinner = (winnerId: string) => {
    if (onSelectWinner) {
      onSelectWinner(match.id, winnerId)
    }
    if (onCloseModal) {
      onCloseModal()
    }
  }

  return (
    <>
      <div
        className={`match-card ${clickable ? 'clickable' : ''} ${hasWinner ? 'completed' : ''} ${isBye ? 'bye' : ''} ${isLive ? 'live' : ''}`}
        onClick={handleClick}
      >
        {(gameNumber !== undefined || showHeader) && (
          <div className={`game-number ${isLive ? 'live' : ''}`}>{gameNumber !== undefined ? `Game ${gameNumber}` : '\u00A0'}</div>
        )}
        <div className={`match-player ${getPlayerClass(match.player1Id)} ${!match.player1Id && match.isByeMatch ? 'bye-slot' : ''}`}>
          <span className="player-name">
            {isDoubles
              ? (team1Name || (match.player1Id ? 'Unknown' : (match.isByeMatch ? 'BYE' : 'TBD')))
              : (player1 ? player1.name : (match.player1Id ? 'Unknown' : (match.isByeMatch ? 'BYE' : 'TBD')))
            }
            {!isDoubles && player1 && player1Losses !== undefined && (
              <sub className="loss-count">{player1Losses}</sub>
            )}
            {isDoubles && team1Name && player1Losses !== undefined && (
              <sub className="loss-count">{player1Losses}</sub>
            )}
          </span>
          {match.winnerId === match.player1Id && (
            <span className="winner-indicator">W</span>
          )}
          {isLive && (
            <span className="live-score">{liveGame?.player1Score ?? 0}</span>
          )}
        </div>
        <div className={`match-player ${getPlayerClass(match.player2Id)} ${!match.player2Id && isBye ? 'bye-slot' : ''}`}>
          <span className="player-name">
            {isDoubles
              ? (team2Name || (match.player2Id ? 'Unknown' : (isBye ? 'BYE' : 'TBD')))
              : (player2 ? player2.name : (match.player2Id ? 'Unknown' : (isBye ? 'BYE' : 'TBD')))
            }
            {!isDoubles && player2 && player2Losses !== undefined && (
              <sub className="loss-count">{player2Losses}</sub>
            )}
            {isDoubles && team2Name && player2Losses !== undefined && (
              <sub className="loss-count">{player2Losses}</sub>
            )}
          </span>
          {match.winnerId === match.player2Id && (
            <span className="winner-indicator">W</span>
          )}
          {isLive && (
            <span className="live-score">{liveGame?.player2Score ?? 0}</span>
          )}
        </div>
      </div>

      {showModal && (
        <div className="match-modal-overlay" onClick={onCloseModal}>
          <div className="match-modal" onClick={e => e.stopPropagation()}>
            <div className="match-modal-title">Select Winner</div>
            {isDoubles ? (
              <>
                {match.player1Id && team1Name && (
                  <button
                    className="winner-btn"
                    onClick={() => handleSelectWinner(match.player1Id!)}
                  >
                    {team1Name}
                  </button>
                )}
                {match.player2Id && team2Name && (
                  <button
                    className="winner-btn"
                    onClick={() => handleSelectWinner(match.player2Id!)}
                  >
                    {team2Name}
                  </button>
                )}
              </>
            ) : (
              <>
                {player1 && (
                  <button
                    className="winner-btn"
                    onClick={() => handleSelectWinner(player1.id)}
                  >
                    {player1.name}
                  </button>
                )}
                {player2 && (
                  <button
                    className="winner-btn"
                    onClick={() => handleSelectWinner(player2.id)}
                  >
                    {player2.name}
                  </button>
                )}
              </>
            )}
            <button className="cancel-winner-btn" onClick={onCloseModal}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </>
  )
}
