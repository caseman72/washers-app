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
    border-radius: 0.75rem;
    overflow: hidden;
    padding: 1rem;
  }

  .game-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .games-badge {
    font-size: 1.25rem;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    min-width: 2.5rem;
    text-align: center;
  }

  .games-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .player-names {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
  }

  .player-name {
    flex: 1;
    text-align: center;
    font-size: 0.875rem;
    color: #ccc;
    padding: 0.25rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .scores-container {
    display: flex;
    flex: 1;
    width: 100%;
    gap: 0.25rem;
  }

  .score-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
  }

  .score-value {
    font-size: 4rem;
    font-weight: bold;
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
  showRounds?: boolean
}

export function GameDisplay({
  state,
  loading,
  error,
  gameNumber,
  showRounds = true,
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

  const p1GamesDisplay = showRounds
    ? `${state.player1Rounds}.${state.player1Games}`
    : `${state.player1Games}`
  const p2GamesDisplay = showRounds
    ? `${state.player2Rounds}.${state.player2Games}`
    : `${state.player2Games}`

  return (
    <div className="game-display">
      {/* Games header */}
      <div className="game-header">
        <div
          className="games-badge"
          style={{ background: p1Color.bg, color: p1Color.text }}
        >
          {p1GamesDisplay}
        </div>
        <span className="games-label">Games</span>
        <div
          className="games-badge"
          style={{ background: p2Color.bg, color: p2Color.text }}
        >
          {p2GamesDisplay}
        </div>
      </div>

      {/* Player names */}
      <div className="player-names">
        <div className="player-name">{state.player1Name || 'Player 1'}</div>
        <div className="player-name">{state.player2Name || 'Player 2'}</div>
      </div>

      {/* Score panels */}
      <div className="scores-container">
        <div
          className="score-panel"
          style={{ background: p1Color.bg, color: p1Color.text }}
        >
          <span className="score-value">{state.player1Score}</span>
        </div>
        <div
          className="score-panel"
          style={{ background: p2Color.bg, color: p2Color.text }}
        >
          <span className="score-value">{state.player2Score}</span>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  )
}
