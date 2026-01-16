import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scoreboard } from '../components/Scoreboard'
import { loadSettings } from './SettingsScreen'
import { writeGameState } from '../lib/firebase'
import type { GameSession } from '../types'

const styles = `
  .keep-score-screen {
    position: relative;
    min-height: 100vh;
  }

  .keep-score-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 50;
    font-size: 0.75rem;
    color: #888;
  }

  .game-number-input {
    width: 4rem;
    padding: 0.25rem 0.5rem;
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

  .namespace-display {
    color: #d35400;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .back-btn-overlay {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.6);
    color: #aaa;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    z-index: 50;
    backdrop-filter: blur(4px);
  }

  .back-btn-overlay:hover {
    background: rgba(0, 0, 0, 0.8);
    color: white;
  }

  .no-namespace {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
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
  const hasNamespace = settings.namespace.trim().length > 0

  const [gameNumber, setGameNumber] = useState(1)
  const [lastSession, setLastSession] = useState<GameSession | null>(null)
  const [lastColors, setLastColors] = useState<{ p1: string; p2: string }>({ p1: 'ORANGE', p2: 'BLACK' })

  const handleGameNumberChange = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1) {
      setGameNumber(num)
    }
  }

  // Sync to Firebase when session changes
  useEffect(() => {
    if (!hasNamespace || !lastSession) return

    writeGameState(settings.namespace, gameNumber, {
      player1Score: lastSession.player1Score,
      player2Score: lastSession.player2Score,
      player1Games: lastSession.player1Games,
      player2Games: lastSession.player2Games,
      player1Rounds: 0,
      player2Rounds: 0,
      player1Color: lastColors.p1,
      player2Color: lastColors.p2,
      player1Name: 'Player 1',
      player2Name: 'Player 2',
      format: 1,
    }).catch(err => console.error('Failed to write game state:', err))
  }, [lastSession, lastColors, gameNumber, settings.namespace, hasNamespace])

  const handleStateChange = useCallback((session: GameSession, colors: { p1: string; p2: string }) => {
    setLastSession(session)
    setLastColors(colors)
  }, [])

  if (!hasNamespace) {
    return (
      <div className="keep-score-screen" style={{ background: '#1a1a1a', minHeight: '100vh' }}>
        <div className="no-namespace">
          <div className="no-namespace-title">No Namespace Configured</div>
          <div>Go to Settings to enter your namespace</div>
          <button className="settings-link" onClick={() => navigate('/settings')}>
            Open Settings
          </button>
        </div>
        <div className="back-btn-overlay" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <button
            style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Back to Menu
          </button>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  return (
    <div className="keep-score-screen">
      <div className="keep-score-header">
        <span className="namespace-display">{settings.namespace}</span>
        <span>/</span>
        <span>Game</span>
        <input
          type="number"
          className="game-number-input"
          value={gameNumber}
          onChange={(e) => handleGameNumberChange(e.target.value)}
          min="1"
        />
      </div>
      <Scoreboard onStateChange={handleStateChange} />
      <button
        className="back-btn-overlay"
        onClick={() => navigate('/')}
      >
        Back to Menu
      </button>
      <style>{styles}</style>
    </div>
  )
}
