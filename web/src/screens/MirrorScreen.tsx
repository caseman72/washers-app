import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSettings, updateGameNamespace, getBaseNamespace, getGameNumber } from './SettingsScreen'
import { useGameState } from '../hooks/useGameState'
import { GameDisplay } from '../components/GameDisplay'

const styles = `
  .mirror-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .mirror-game-area {
    width: 100%;
    max-width: 475px;
    aspect-ratio: 1;
    margin: 0 auto;
  }

  .mirror-bottom {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: #3a3a3a;
  }

  .status-text {
    text-align: center;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .status-text.connected {
    color: #4caf50;
  }

  .status-text.waiting {
    color: gray;
  }

  .spacer {
    flex: 1;
  }

  .namespace-field {
    margin-bottom: 0.75rem;
  }

  .namespace-label {
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 0.25rem;
  }

  .namespace-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 0.5rem;
    color: white;
  }

  .namespace-input:focus {
    outline: none;
    border-color: #d35400;
  }

  .back-btn {
    width: 100%;
    padding: 0.875rem;
    font-size: 1rem;
    font-weight: 500;
    background: #515151;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .back-btn:hover {
    background: #616161;
  }
`

export function MirrorScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()

  const [gameNamespace, setGameNamespace] = useState(settings.gameNamespace)

  const baseNamespace = getBaseNamespace(gameNamespace)
  const gameNumber = getGameNumber(gameNamespace)

  // Save gameNamespace to settings when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameNamespace !== settings.gameNamespace) {
        updateGameNamespace(gameNamespace)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [gameNamespace, settings.gameNamespace])

  const game = useGameState(baseNamespace, gameNumber)

  const hasData = game.state !== null
  const isConnected = hasData && !game.loading

  return (
    <div className="mirror-screen">
      {/* Square game display area */}
      <div className="mirror-game-area">
        <GameDisplay
          state={game.state}
          loading={game.loading}
          error={game.error}
          gameNumber={gameNumber}
        />
      </div>

      {/* Bottom area - matches Phone layout */}
      <div className="mirror-bottom">
        <div className={`status-text ${isConnected ? 'connected' : 'waiting'}`}>
          {isConnected ? 'Connected' : 'Waiting for data...'}
        </div>

        <div className="spacer" />

        <div className="namespace-field">
          <div className="namespace-label">Namespace</div>
          <input
            type="text"
            className="namespace-input"
            value={gameNamespace}
            onChange={(e) => setGameNamespace(e.target.value)}
            placeholder="casey@manion.com/1"
          />
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
