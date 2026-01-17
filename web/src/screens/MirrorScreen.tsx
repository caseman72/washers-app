import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSettings, updateGameNumber } from './SettingsScreen'
import { useGameState } from '../hooks/useGameState'
import { GameDisplay } from '../components/GameDisplay'
import { checkActiveTournament } from '../lib/firebase-tournaments'

const styles = `
  .mirror-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #3a3a3a;
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
    min-width: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .format-btn.locked {
    opacity: 0.7;
    padding: 0.5rem 1rem;
  }

  .format-locked-label {
    font-size: 0.6rem;
    font-weight: normal;
    color: #888;
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

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: #222;
    padding: 1.5rem;
    border-radius: 1rem;
    text-align: center;
    max-width: 320px;
    margin: 1rem;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #d35400;
    margin-bottom: 1rem;
  }

  .modal-message {
    color: #aaa;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    line-height: 1.4;
  }

  .modal-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .modal-btn {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .modal-btn.dismiss {
    background: #444;
    color: #999;
  }

  .modal-btn.dismiss:hover {
    background: #555;
    color: white;
  }

  .modal-btn.fix {
    background: #d35400;
    color: white;
  }

  .modal-btn.fix:hover {
    background: #e55d00;
  }
`

export function MirrorScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()

  const [gameNumber, setGameNumber] = useState(settings.gameNumber)
  const [gameNumberInput, setGameNumberInput] = useState(settings.gameNumber.toString())
  const [showTournamentWarning, setShowTournamentWarning] = useState(false)
  const baseNamespace = settings.namespace

  const game = useGameState(baseNamespace, gameNumber)
  // Get format from Firebase data (read-only display)
  const firebaseFormat = game.state?.format || 1

  // Tournament games (1-64) have format locked to 1
  const isTournamentGame = gameNumber >= 1 && gameNumber <= 64

  // Save gameNumber to settings when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameNumber !== settings.gameNumber) {
        updateGameNumber(gameNumber)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [gameNumber, settings.gameNumber])

  const hasData = game.state !== null
  const isConnected = hasData && !game.loading

  const handleGameNumberChange = (value: string) => {
    // Only update input display while typing - actual gameNumber updates on blur
    setGameNumberInput(value)
  }

  const handleGameNumberBlur = useCallback(async () => {
    // Parse and clamp the value on blur (0-99 valid)
    const num = parseInt(gameNumberInput, 10)
    let finalNumber: number
    if (!isNaN(num)) {
      finalNumber = Math.max(0, Math.min(99, num))
    } else {
      finalNumber = 0
    }
    setGameNumber(finalNumber)
    setGameNumberInput(finalNumber.toString())

    // Check tournament only for games 1-64 (tournament reserved range)
    if (finalNumber >= 1 && finalNumber <= 64 && baseNamespace) {
      const hasActive = await checkActiveTournament(baseNamespace)
      if (!hasActive) {
        setShowTournamentWarning(true)
      }
    }
  }, [gameNumberInput, baseNamespace])

  const handleFixTournament = () => {
    setGameNumber(0)
    setGameNumberInput('0')
    setShowTournamentWarning(false)
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="game-number-input"
              value={gameNumberInput}
              onChange={(e) => handleGameNumberChange(e.target.value)}
              onBlur={handleGameNumberBlur}
            />
          </div>

          <div className="spacer" />

          <div className={`format-btn ${isTournamentGame ? 'locked' : ''}`} style={{ cursor: 'default' }}>
            <span>Bo{firebaseFormat}</span>
            {isTournamentGame && <span className="format-locked-label">locked</span>}
          </div>
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      {/* Tournament warning modal */}
      {showTournamentWarning && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">No Active Tournament</div>
            <div className="modal-message">
              Games 1-64 are reserved for tournaments. There is no active tournament for this namespace.
            </div>
            <div className="modal-buttons">
              <button className="modal-btn dismiss" onClick={() => setShowTournamentWarning(false)}>
                Dismiss
              </button>
              <button className="modal-btn fix" onClick={handleFixTournament}>
                Fix It
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  )
}
