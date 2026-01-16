import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSettings, saveSettings } from './SettingsScreen'
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

  .mirror-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #111;
    font-size: 0.75rem;
    color: #888;
  }

  .namespace-input {
    flex: 1;
    max-width: 250px;
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
    background: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
  }

  .namespace-input:focus {
    outline: none;
    border-color: #d35400;
  }

  .game-number-input {
    width: 4rem;
    padding: 0.4rem 0.5rem;
    font-size: 0.875rem;
    background: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
    text-align: center;
  }

  .game-number-input:focus {
    outline: none;
    border-color: #d35400;
  }

  .mirror-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .mirror-panel {
    width: 100%;
    max-width: 400px;
    aspect-ratio: 1;
  }

  .mirror-footer {
    display: flex;
    justify-content: center;
    padding: 0.75rem;
    background: #111;
  }

  .back-btn {
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
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
`

export function MirrorScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()

  const [namespace, setNamespace] = useState(settings.namespace)
  const [gameNumber, setGameNumber] = useState(1)

  // Save namespace to settings when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (namespace !== settings.namespace) {
        saveSettings({ ...settings, namespace })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [namespace, settings])

  const handleGameNumberChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1) {
      setGameNumber(num)
    }
  }

  const game = useGameState(namespace, gameNumber)

  return (
    <div className="mirror-screen">
      <div className="mirror-header">
        <input
          type="text"
          className="namespace-input"
          value={namespace}
          onChange={(e) => setNamespace(e.target.value)}
          placeholder="namespace (e.g., casey@manion.com/1)"
        />
        <span>/</span>
        <input
          type="number"
          className="game-number-input"
          value={gameNumber}
          onChange={(e) => handleGameNumberChange(e.target.value)}
          min="1"
        />
      </div>

      <div className="mirror-container">
        <div className="mirror-panel">
          <GameDisplay
            state={game.state}
            loading={game.loading}
            error={game.error}
            gameNumber={gameNumber}
          />
        </div>
      </div>

      <div className="mirror-footer">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
