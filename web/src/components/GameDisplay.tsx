import { FirebaseGameState } from '../lib/firebase'

// Color mapping from phone app
const COLORS: Record<string, { bg: string; text: string }> = {
  ORANGE: { bg: '#d35400', text: '#ffffff' },
  BLACK: { bg: '#1a1a1a', text: '#ffffff' },
  SILVER: { bg: '#c0c0c0', text: '#000000' },
  RED: { bg: '#c0392b', text: '#ffffff' },
  WHITE: { bg: '#ffffff', text: '#000000' },
  BLUE: { bg: '#2980b9', text: '#ffffff' },
  YELLOW: { bg: '#f1c40f', text: '#000000' },
  PURPLE: { bg: '#8e44ad', text: '#ffffff' },
  GREEN: { bg: '#27ae60', text: '#ffffff' },
  BROWN: { bg: '#795548', text: '#ffffff' },
}

const getColor = (name: string) => COLORS[name] || COLORS.ORANGE

const styles = `
  .game-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #515151;
    overflow: hidden;
    padding: 25px 16px;
    box-sizing: border-box;
  }

  .game-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 50px;
    flex-shrink: 0;
  }

  .games-badge {
    font-size: 1.75rem;
    font-weight: bold;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    min-width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .name-badge {
    font-size: 1rem;
    font-weight: bold;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .names-header .games-label {
    text-transform: none;
  }

  .games-label {
    font-size: 1.125rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 0.25rem;
  }

  .scores-container {
    display: flex;
    flex: 1;
    width: 100%;
    margin-top: 10px;
    gap: 0;
  }

  .score-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .score-panel-top {
    flex: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.25);
  }

  .player-name {
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .score-panel-middle {
    flex: 1.4;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .score-value {
    font-size: 4.5rem;
    font-weight: bold;
  }

  .score-panel-bottom {
    flex: 0.7;
    background: rgba(0, 0, 0, 0.25);
  }

  .game-loading,
  .game-error,
  .game-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
    text-align: center;
    padding: 1rem;
  }

  .game-error {
    color: #e74c3c;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #333;
    border-top-color: #d35400;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

interface GameDisplayProps {
  state: FirebaseGameState | null
  loading: boolean
  error: string | null
  gameNumber: number
}

export function GameDisplay({
  state,
  loading,
  error,
  gameNumber,
}: GameDisplayProps) {
  if (loading) {
    return (
      <div className="game-display">
        <div className="game-loading">
          <div className="spinner" />
          <div>Connecting to Game {gameNumber}...</div>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  if (error && !state) {
    return (
      <div className="game-display">
        <div className="game-error">
          <div>Game {gameNumber}</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</div>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="game-display">
        <div className="game-empty">
          <div>Game {gameNumber}</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Waiting for data...
          </div>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  const p1Color = getColor(state.player1Color)
  const p2Color = getColor(state.player2Color)

  // Infer showRounds from format: format > 1 means best-of series, show rounds
  const format = state.format || 1
  const showRounds = format > 1

  const p1GamesDisplay = showRounds
    ? `${state.player1Rounds}.${state.player1Games}`
    : `${state.player1Games}`
  const p2GamesDisplay = showRounds
    ? `${state.player2Rounds}.${state.player2Games}`
    : `${state.player2Games}`

  return (
    <div className="game-display">
      {/* Header: show player names when format=1, games counter when format>1 */}
      {format === 1 ? (
        <div className="game-header names-header">
          <div
            className="name-badge"
            style={{ background: p1Color.bg, color: p1Color.text }}
          >
            {state.player1Name || 'Player 1'}
          </div>
          <span className="games-label">vs</span>
          <div
            className="name-badge"
            style={{ background: p2Color.bg, color: p2Color.text }}
          >
            {state.player2Name || 'Player 2'}
          </div>
        </div>
      ) : (
        <div className="game-header">
          <div
            className="games-badge"
            style={{ background: p1Color.bg, color: p1Color.text }}
          >
            {p1GamesDisplay}
          </div>
          <span className="games-label">GAMES</span>
          <div
            className="games-badge"
            style={{ background: p2Color.bg, color: p2Color.text }}
          >
            {p2GamesDisplay}
          </div>
        </div>
      )}

      {/* Score panels with names inside */}
      <div className="scores-container">
        <div
          className="score-panel"
          style={{ background: p1Color.bg, color: p1Color.text }}
        >
          <div className="score-panel-top">
            <span className="player-name">{state.player1Name || 'Player 1'}</span>
          </div>
          <div className="score-panel-middle">
            <span className="score-value">{state.player1Score}</span>
          </div>
          <div className="score-panel-bottom" />
        </div>
        <div
          className="score-panel"
          style={{ background: p2Color.bg, color: p2Color.text }}
        >
          <div className="score-panel-top">
            <span className="player-name">{state.player2Name || 'Player 2'}</span>
          </div>
          <div className="score-panel-middle">
            <span className="score-value">{state.player2Score}</span>
          </div>
          <div className="score-panel-bottom" />
        </div>
      </div>

      <style>{styles}</style>
    </div>
  )
}
