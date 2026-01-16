import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scoreboard } from '../components/Scoreboard'
import { loadSettings, updateGameNumber } from './SettingsScreen'
import { writeGameState } from '../lib/firebase'
import { subscribeToPlayers } from '../lib/firebase-players'
import { checkActiveTournament } from '../lib/firebase-tournaments'
import type { GameSession, Player } from '../types'

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

  .player-picker-overlay {
    position: fixed;
    inset: 0;
    background: #1a1a1a;
    z-index: 100;
    display: flex;
    flex-direction: column;
  }

  .player-picker-header {
    padding: 1.5rem;
    text-align: center;
    font-size: 1.25rem;
    color: #888;
    border-bottom: 1px solid #333;
  }

  .player-picker-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }

  .player-picker-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 85%;
    margin: 0 auto;
    padding: 1rem;
    background: transparent;
    border: none;
    color: white;
    font-size: 1.125rem;
    cursor: pointer;
    border-radius: 0.5rem;
  }

  .player-picker-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .player-picker-item.selected {
    background: rgba(255, 255, 255, 0.05);
  }

  .player-initial {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #d35400;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .player-picker-name {
    flex: 1;
    text-align: left;
  }

  .player-picker-check {
    color: #4caf50;
    font-size: 1.5rem;
  }

  .player-picker-empty {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .player-picker-cancel {
    padding: 1rem;
    text-align: center;
    border-top: 1px solid #333;
  }

  .player-picker-cancel button {
    padding: 0.75rem 2rem;
    background: #333;
    color: #888;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .player-picker-cancel button:hover {
    background: #444;
    color: white;
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

export function KeepScoreScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const [gameNumber, setGameNumber] = useState(settings.gameNumber)
  const [gameNumberInput, setGameNumberInput] = useState(settings.gameNumber.toString())
  const [format, setFormat] = useState(1)
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [showPlayerPicker, setShowPlayerPicker] = useState<1 | 2 | null>(null)
  const [showTournamentWarning, setShowTournamentWarning] = useState(false)

  const baseNamespace = settings.namespace
  const hasNamespace = baseNamespace.trim().length > 0

  const [lastSession, setLastSession] = useState<GameSession | null>(null)
  const [lastColors, setLastColors] = useState<{ p1: string; p2: string }>({ p1: 'ORANGE', p2: 'BLACK' })

  // Subscribe to players
  useEffect(() => {
    if (!hasNamespace) return
    const unsubscribe = subscribeToPlayers(baseNamespace, (playerList) => {
      setPlayers(playerList.filter(p => !p.archived))
    })
    return unsubscribe
  }, [baseNamespace, hasNamespace])

  // Save gameNumber to settings when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameNumber !== settings.gameNumber) {
        updateGameNumber(gameNumber)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [gameNumber, settings.gameNumber])

  // Sync to Firebase when session or format changes
  useEffect(() => {
    if (!hasNamespace) return

    const session = lastSession || {
      player1Score: 0,
      player2Score: 0,
      player1Games: 0,
      player2Games: 0,
      player1Rounds: 0,
      player2Rounds: 0,
    }

    const gameState: Record<string, unknown> = {
      player1Score: session.player1Score,
      player2Score: session.player2Score,
      player1Games: session.player1Games,
      player2Games: session.player2Games,
      player1Rounds: session.player1Rounds,
      player2Rounds: session.player2Rounds,
      player1Color: lastColors.p1,
      player2Color: lastColors.p2,
      format,
    }
    // Only include names if they have a value (Firebase rejects undefined)
    if (player1Name) gameState.player1Name = player1Name
    if (player2Name) gameState.player2Name = player2Name

    writeGameState(baseNamespace, gameNumber, gameState).catch(err => console.error('Failed to write game state:', err))
  }, [lastSession, lastColors, gameNumber, baseNamespace, hasNamespace, player1Name, player2Name, format])

  const handleStateChange = useCallback((session: GameSession, colors: { p1: string; p2: string }) => {
    setLastSession(session)
    setLastColors(colors)
  }, [])

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

            <button className="format-btn" onClick={cycleFormat}>
              Bo{format}
            </button>
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
            onClick={() => setShowPlayerPicker(1)}
          >
            {player1Name || 'Player 1'}
          </span>
          <span
            className={`player-name-label ${!player2Name ? 'empty' : ''}`}
            onClick={() => setShowPlayerPicker(2)}
          >
            {player2Name || 'Player 2'}
          </span>
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

          <button className="format-btn" onClick={cycleFormat}>
            Bo{format}
          </button>
        </div>

        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      {/* Player picker overlay */}
      {showPlayerPicker && (
        <div className="player-picker-overlay">
          <div className="player-picker-header">
            Select Player {showPlayerPicker}
          </div>
          <div className="player-picker-list">
            {players.length === 0 ? (
              <div className="player-picker-empty">
                No players found.<br />
                Add players in the Players screen.
              </div>
            ) : (
              players.map(player => {
                const currentName = showPlayerPicker === 1 ? player1Name : player2Name
                const isSelected = player.name === currentName
                return (
                  <button
                    key={player.id}
                    className={`player-picker-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (showPlayerPicker === 1) {
                        setPlayer1Name(player.name)
                      } else {
                        setPlayer2Name(player.name)
                      }
                      setShowPlayerPicker(null)
                    }}
                  >
                    <span className="player-initial">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="player-picker-name">{player.name}</span>
                    {isSelected && <span className="player-picker-check">✓</span>}
                  </button>
                )
              })
            )}
          </div>
          <div className="player-picker-cancel">
            <button onClick={() => setShowPlayerPicker(null)}>Cancel</button>
          </div>
        </div>
      )}

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
