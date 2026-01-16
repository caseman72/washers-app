import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scoreboard } from '../components/Scoreboard'
import { loadSettings, updateGameNamespace, getBaseNamespace, getGameNumber } from './SettingsScreen'
import { writeGameState } from '../lib/firebase'
import type { GameSession } from '../types'

const styles = `
  .keep-score-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .keep-score-game-area {
    width: 100%;
    max-width: 400px;
    aspect-ratio: 1;
    margin: 0 auto;
  }

  .keep-score-bottom {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: #3a3a3a;
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

  .no-namespace {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #888;
  }

  .no-namespace-title {
    font-size: 1.25rem;
    color: #d35400;
    margin-bottom: 0.5rem;
  }

  .settings-link {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #d35400;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }

  .settings-link:hover {
    background: #e55d00;
  }
`

export function KeepScoreScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const [gameNamespace, setGameNamespace] = useState(settings.gameNamespace)

  const baseNamespace = getBaseNamespace(gameNamespace)
  const gameNumber = getGameNumber(gameNamespace)
  const hasNamespace = baseNamespace.trim().length > 0

  const [lastSession, setLastSession] = useState<GameSession | null>(null)
  const [lastColors, setLastColors] = useState<{ p1: string; p2: string }>({ p1: 'ORANGE', p2: 'BLACK' })

  // Save gameNamespace to settings when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameNamespace !== settings.gameNamespace) {
        updateGameNamespace(gameNamespace)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [gameNamespace, settings.gameNamespace])

  // Sync to Firebase when session changes
  // Don't send player1Name/player2Name - let Firebase preserve existing names
  useEffect(() => {
    if (!hasNamespace || !lastSession) return

    writeGameState(baseNamespace, gameNumber, {
      player1Score: lastSession.player1Score,
      player2Score: lastSession.player2Score,
      player1Games: lastSession.player1Games,
      player2Games: lastSession.player2Games,
      player1Rounds: lastSession.player1Rounds,
      player2Rounds: lastSession.player2Rounds,
      player1Color: lastColors.p1,
      player2Color: lastColors.p2,
      format: 1,
    }).catch(err => console.error('Failed to write game state:', err))
  }, [lastSession, lastColors, gameNumber, baseNamespace, hasNamespace])

  const handleStateChange = useCallback((session: GameSession, colors: { p1: string; p2: string }) => {
    setLastSession(session)
    setLastColors(colors)
  }, [])

  if (!hasNamespace) {
    return (
      <div className="keep-score-screen">
        <div className="keep-score-game-area" style={{ background: '#515151' }}>
          <div className="no-namespace">
            <div className="no-namespace-title">No Namespace Configured</div>
            <div>Enter your namespace below</div>
          </div>
        </div>

        <div className="keep-score-bottom">
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

  return (
    <div className="keep-score-screen">
      {/* Square game area */}
      <div className="keep-score-game-area">
        <Scoreboard onStateChange={handleStateChange} contained />
      </div>

      {/* Bottom area - matches Mirror layout */}
      <div className="keep-score-bottom">
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
