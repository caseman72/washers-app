import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scoreboard } from '../components/Scoreboard'
import { loadSettings, updateGameNumber } from './SettingsScreen'
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
    max-width: 475px;
    aspect-ratio: 1;
    margin: 0 auto;
  }

  .keep-score-bottom {
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

  .player-names-row {
    display: flex;
    justify-content: space-evenly;
    margin-bottom: 0.5rem;
  }

  .player-name-label {
    flex: 1;
    text-align: center;
    padding: 0.5rem;
    font-size: 1rem;
    color: #ccc;
    cursor: pointer;
  }

  .player-name-label.empty {
    color: #666;
  }

  .player-name-label:hover {
    color: white;
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
  const [gameNumber, setGameNumber] = useState(settings.gameNumber)
  const [format, setFormat] = useState(1)
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')

  const baseNamespace = settings.namespace
  const hasNamespace = baseNamespace.trim().length > 0

  const [lastSession, setLastSession] = useState<GameSession | null>(null)
  const [lastColors, setLastColors] = useState<{ p1: string; p2: string }>({ p1: 'ORANGE', p2: 'BLACK' })

  // Save gameNumber to settings when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameNumber !== settings.gameNumber) {
        updateGameNumber(gameNumber)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [gameNumber, settings.gameNumber])

  // Sync to Firebase when session changes
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
      player1Name: player1Name || undefined,
      player2Name: player2Name || undefined,
      format,
    }).catch(err => console.error('Failed to write game state:', err))
  }, [lastSession, lastColors, gameNumber, baseNamespace, hasNamespace, player1Name, player2Name, format])

  const handleStateChange = useCallback((session: GameSession, colors: { p1: string; p2: string }) => {
    setLastSession(session)
    setLastColors(colors)
  }, [])

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

  if (!hasNamespace) {
    return (
      <div className="keep-score-screen">
        <div className="keep-score-game-area" style={{ background: '#515151' }}>
          <div className="no-namespace">
            <div className="no-namespace-title">No Namespace Configured</div>
            <div>Go to Settings to enter your namespace</div>
            <button className="settings-link" onClick={() => navigate('/settings')}>
              Go to Settings
            </button>
          </div>
        </div>

        <div className="keep-score-bottom">
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

  return (
    <div className="keep-score-screen">
      {/* Square game area */}
      <div className="keep-score-game-area">
        <Scoreboard onStateChange={handleStateChange} contained format={format} />
      </div>

      {/* Bottom area - matches Phone layout */}
      <div className="keep-score-bottom">
        {/* Player name labels */}
        <div className="player-names-row">
          <span
            className={`player-name-label ${!player1Name ? 'empty' : ''}`}
            onClick={() => {
              const name = prompt('Player 1 name:', player1Name)
              if (name !== null) setPlayer1Name(name)
            }}
          >
            {player1Name || 'Player 1'}
          </span>
          <span
            className={`player-name-label ${!player2Name ? 'empty' : ''}`}
            onClick={() => {
              const name = prompt('Player 2 name:', player2Name)
              if (name !== null) setPlayer2Name(name)
            }}
          >
            {player2Name || 'Player 2'}
          </span>
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
