import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSettings, updateGameNumber } from './SettingsScreen'
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
    width: 100%;
    max-width: 475px;
    margin: 0 auto;
    box-sizing: border-box;
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

  .bottom-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    align-items: flex-end;
  }

  .game-number-field {
    width: 100px;
  }

  .game-number-label {
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 0.25rem;
  }

  .game-number-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 0.5rem;
    color: white;
    text-align: center;
  }

  .game-number-input:focus {
    outline: none;
    border-color: #d35400;
  }

  .format-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: bold;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    min-width: 60px;
  }

  .format-btn:hover {
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

  const [gameNumber, setGameNumber] = useState(settings.gameNumber)
  const [format, setFormat] = useState(1)
  const baseNamespace = settings.namespace

  // Save gameNumber to settings when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameNumber !== settings.gameNumber) {
        updateGameNumber(gameNumber)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [gameNumber, settings.gameNumber])

  const game = useGameState(baseNamespace, gameNumber)

  const hasData = game.state !== null
  const isConnected = hasData && !game.loading

  const handleGameNumberChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num)) {
      setGameNumber(Math.max(0, Math.min(64, num)))
    } else if (value === '') {
      setGameNumber(0)
    }
  }

  const cycleFormat = () => {
    const formats = [1, 3, 5, 7]
    const currentIndex = formats.indexOf(format)
    const nextIndex = (currentIndex + 1) % formats.length
    setFormat(formats[nextIndex])
  }

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

        <div className="bottom-row">
          <div className="game-number-field">
            <div className="game-number-label">Game #</div>
            <input
              type="number"
              className="game-number-input"
              value={gameNumber}
              onChange={(e) => handleGameNumberChange(e.target.value)}
              min={0}
              max={64}
            />
          </div>

          <div className="spacer" />

          <button className="format-btn" onClick={cycleFormat}>
            Bo{format}
          </button>
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
