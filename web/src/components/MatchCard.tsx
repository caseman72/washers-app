import { BracketNode, Player } from '../types'
import { isMatchReady, isByeMatch } from '../lib/bracket'

const styles = `
  .match-card {
    display: flex;
    flex-direction: column;
    background: #2a2a2a;
    border-radius: 0.375rem;
    overflow: hidden;
    min-width: 120px;
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
    padding: 0.5rem 0.625rem;
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
    margin-left: 0.25rem;
    font-size: 0.7rem;
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
  onSelectWinner?: (matchId: string, winnerId: string) => void
  showModal?: boolean
  onCloseModal?: () => void
  onOpenModal?: () => void
  gameNumber?: number
  player1Losses?: number
  player2Losses?: number
}

export function MatchCard({
  match,
  players,
  onSelectWinner,
  showModal,
  onCloseModal,
  onOpenModal,
  gameNumber,
  player1Losses,
  player2Losses,
}: MatchCardProps) {
  const player1 = match.player1Id ? players.get(match.player1Id) : null
  const player2 = match.player2Id ? players.get(match.player2Id) : null

  const ready = isMatchReady(match)
  const isBye = isByeMatch(match)
  const hasWinner = !!match.winnerId
  const clickable = ready && onSelectWinner

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
        className={`match-card ${clickable ? 'clickable' : ''} ${hasWinner ? 'completed' : ''} ${isBye ? 'bye' : ''}`}
        onClick={handleClick}
      >
        {gameNumber !== undefined && (
          <div className="game-number">Game {gameNumber}</div>
        )}
        <div className={`match-player ${getPlayerClass(match.player1Id)}`}>
          <span className="player-name">
            {player1 ? player1.name : (match.player1Id ? 'Unknown' : 'TBD')}
            {player1 && player1Losses !== undefined && (
              <sub className="loss-count">{player1Losses}</sub>
            )}
          </span>
          {match.winnerId === match.player1Id && (
            <span className="winner-indicator">W</span>
          )}
        </div>
        <div className={`match-player ${getPlayerClass(match.player2Id)} ${!match.player2Id && isBye ? 'bye-slot' : ''}`}>
          <span className="player-name">
            {player2 ? player2.name : (match.player2Id ? 'Unknown' : (isBye ? 'BYE' : 'TBD'))}
            {player2 && player2Losses !== undefined && (
              <sub className="loss-count">{player2Losses}</sub>
            )}
          </span>
          {match.winnerId === match.player2Id && (
            <span className="winner-indicator">W</span>
          )}
        </div>
      </div>

      {showModal && (
        <div className="match-modal-overlay" onClick={onCloseModal}>
          <div className="match-modal" onClick={e => e.stopPropagation()}>
            <div className="match-modal-title">Select Winner</div>
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
