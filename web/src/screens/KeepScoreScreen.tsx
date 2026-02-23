import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scoreboard, ColorId } from '../components/Scoreboard'
import { loadSettings, updateGameNumber } from './SettingsScreen'
import { writeGameState, subscribeToGame } from '../lib/firebase'
import { subscribeToPlayers } from '../lib/firebase-players'
import { checkActiveTournament, checkGameComplete } from '../lib/firebase-tournaments'
import type { GameSession, Player } from '../types'

// Initial data loaded from Firebase
interface InitialGameData {
  session: GameSession
  colors: { p1: ColorId; p2: ColorId }
  loaded: boolean  // true once we've read from Firebase (even if no data)
  loadedForGame: number | null  // which game number this data was loaded for
}

const styles = `
  .keep-score-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #3a3a3a;
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
    padding: 0 1rem 1rem;
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

  .player-name-label:hover:not(.locked) {
    color: white;
  }

  .player-name-label.locked {
    cursor: default;
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
    background: #2a2a2a;
    border: 1px solid #333;
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
    background: #2a2a2a;
    border: 1px solid #333;
    border-radius: 0.5rem;
    color: white;
    cursor: pointer;
    min-width: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .format-btn:hover:not(.locked) {
    border-color: #d35400;
  }

  .format-btn.locked {
    cursor: default;
    opacity: 0.7;
    padding: 0.5rem 1rem;
  }

  .format-locked-label {
    font-size: 0.6rem;
    font-weight: normal;
    color: #888;
  }

  .reset-btn {
    width: 170px;
    padding: 0.75rem 0;
    font-size: 1.125rem;
    background: #2a2a2a;
    color: #888;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    align-self: center;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  .reset-btn:hover {
    background: #333;
    color: white;
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

  .game-complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    background: #515151;
  }

  .game-complete-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #d35400;
    margin-bottom: 0.75rem;
  }

  .game-complete-message {
    font-size: 1rem;
    color: #888;
    max-width: 280px;
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
  const [isGameComplete, setIsGameComplete] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [resetColorsKey, setResetColorsKey] = useState(0)
  const [scoreboardScreen, setScoreboardScreen] = useState<'game' | 'colors'>('game')

  const baseNamespace = settings.namespace
  const hasNamespace = baseNamespace.trim().length > 0

  // Tournament games (1-64) have format locked to 1
  const isTournamentGame = gameNumber >= 1 && gameNumber <= 64

  const [lastSession, setLastSession] = useState<GameSession | null>(null)
  const [lastColors, setLastColors] = useState<{ p1: string; p2: string }>({ p1: 'ORANGE', p2: 'BLACK' })

  // Live state from Firebase (pushed to Scoreboard on external changes)
  const [liveSession, setLiveSession] = useState<GameSession | undefined>(undefined)
  const [liveColors, setLiveColors] = useState<{ p1: ColorId; p2: ColorId } | undefined>(undefined)

  // Track pending auto-advance (set when game completes, cleared after Firebase write)
  const pendingAdvanceRef = useRef(false)

  // Track last state received from Firebase to avoid write-back loops
  const lastFirebaseStateRef = useRef<string>('')

  // Initial data loaded from Firebase (used to initialize Scoreboard)
  const [initialData, setInitialData] = useState<InitialGameData>({
    session: { player1Score: 0, player2Score: 0, player1Games: 0, player2Games: 0, player1Rounds: 0, player2Rounds: 0 },
    colors: { p1: 'orange', p2: 'black' },
    loaded: false,
    loadedForGame: null,
  })

  // Helper to convert Firebase color string to ColorId
  const toColorId = (color: string | undefined): ColorId => {
    const valid: ColorId[] = ['orange', 'black', 'silver', 'red', 'white', 'blue', 'yellow', 'purple', 'green', 'brown']
    const lower = (color || '').toLowerCase() as ColorId
    return valid.includes(lower) ? lower : 'orange'
  }

  // Subscribe to Firebase game data — stays live for real-time updates
  const isFirstLoadRef = useRef(true)
  useEffect(() => {
    if (!hasNamespace) {
      setInitialData(prev => ({ ...prev, loaded: true, loadedForGame: gameNumber }))
      return
    }

    // Reset loaded state when game number changes
    setInitialData(prev => ({ ...prev, loaded: false, loadedForGame: null }))
    isFirstLoadRef.current = true

    const unsubscribe = subscribeToGame(baseNamespace, gameNumber, (state) => {
      if (state) {
        const session: GameSession = {
          player1Score: state.player1Score ?? 0,
          player2Score: state.player2Score ?? 0,
          player1Games: state.player1Games ?? 0,
          player2Games: state.player2Games ?? 0,
          player1Rounds: state.player1Rounds ?? 0,
          player2Rounds: state.player2Rounds ?? 0,
        }
        const colors = {
          p1: toColorId(state.player1Color),
          p2: toColorId(state.player2Color),
        }

        if (isFirstLoadRef.current) {
          // First load — set initial data for Scoreboard mount
          setInitialData({ session, colors, loaded: true, loadedForGame: gameNumber })
          isFirstLoadRef.current = false
        } else {
          // Subsequent updates — push live to Scoreboard
          setLiveSession(session)
          setLiveColors(colors)
        }

        // Always sync player names and format
        const name1 = state.player1Name
        const name2 = state.player2Name
        const p1Name = name1 && name1 !== 'TBD' ? name1 : ''
        const p2Name = name2 && name2 !== 'TBD' ? name2 : ''
        setPlayer1Name(p1Name)
        setPlayer2Name(p2Name)
        if (state.format) setFormat(state.format)

        // Track what Firebase sent so we don't write it back
        lastFirebaseStateRef.current = JSON.stringify({
          s: session, c: colors,
          f: state.format, n1: p1Name, n2: p2Name,
        })
      } else if (isFirstLoadRef.current) {
        // No data in Firebase on first load - use defaults and write them
        const defaultSession = { player1Score: 0, player2Score: 0, player1Games: 0, player2Games: 0, player1Rounds: 0, player2Rounds: 0 }
        const defaultColors = { p1: 'orange' as ColorId, p2: 'black' as ColorId }
        setInitialData({
          session: defaultSession,
          colors: defaultColors,
          loaded: true,
          loadedForGame: gameNumber,
        })
        isFirstLoadRef.current = false
        // Write defaults to Firebase (initialize the table)
        writeGameState(baseNamespace, gameNumber, {
          player1Score: 0,
          player2Score: 0,
          player1Games: 0,
          player2Games: 0,
          player1Rounds: 0,
          player2Rounds: 0,
          player1Color: 'ORANGE',
          player2Color: 'BLACK',
          format: isTournamentGame ? 1 : format,
        }).catch(err => console.error('Failed to initialize game:', err))
        // Clear player names
        setPlayer1Name('')
        setPlayer2Name('')
      }
    })

    return unsubscribe
  }, [baseNamespace, hasNamespace, gameNumber, isTournamentGame, format])

  // Subscribe to players
  useEffect(() => {
    if (!hasNamespace) return
    const unsubscribe = subscribeToPlayers(baseNamespace, (playerList) => {
      setPlayers(playerList.filter(p => !p.archived))
    })
    return unsubscribe
  }, [baseNamespace, hasNamespace])

  // For tournament games, keep player names in sync with Firebase (bracket may update them)
  useEffect(() => {
    if (!hasNamespace || !isTournamentGame) {
      return
    }
    const unsubscribe = subscribeToGame(baseNamespace, gameNumber, (state) => {
      if (state) {
        // Set names - clear if blank or TBD
        const name1 = state.player1Name
        const name2 = state.player2Name
        if (name1 && name1 !== 'TBD') {
          setPlayer1Name(name1)
        } else {
          setPlayer1Name('')
        }
        if (name2 && name2 !== 'TBD') {
          setPlayer2Name(name2)
        } else {
          setPlayer2Name('')
        }
      } else {
        // No data - clear names
        setPlayer1Name('')
        setPlayer2Name('')
      }
    })
    return unsubscribe
  }, [baseNamespace, hasNamespace, gameNumber, isTournamentGame])

  // Check if tournament game is complete (has winner in bracket)
  useEffect(() => {
    if (!hasNamespace || !isTournamentGame) {
      setIsGameComplete(false)
      return
    }
    // Check tournament bracket for completion status
    checkGameComplete(baseNamespace, gameNumber).then(setIsGameComplete)
  }, [baseNamespace, hasNamespace, gameNumber, isTournamentGame])

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

    // Don't write until Scoreboard reports actual state
    // This prevents overwriting existing data on mount
    if (!lastSession) return

    const session = lastSession
    const colors = {
      p1: toColorId(lastColors.p1),
      p2: toColorId(lastColors.p2),
    }

    // Skip write if state matches what Firebase last sent us (avoid write-back loop)
    const currentSnapshot = JSON.stringify({
      s: session, c: colors,
      f: format, n1: player1Name, n2: player2Name,
    })
    if (currentSnapshot === lastFirebaseStateRef.current) {
      return
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
    if (player1Name) gameState.player1Name = player1Name
    if (player2Name) gameState.player2Name = player2Name

    // Skip write if game is already complete (don't overwrite finished tournament games)
    if (isGameComplete) {
      return
    }

    // Skip write until initial data is loaded for THIS game number
    // This prevents writing stale data from a previous game after game number changes
    // (React batches setState calls, so loaded might still be true for the old game)
    if (!initialData.loaded || initialData.loadedForGame !== gameNumber) {
      return
    }

    writeGameState(baseNamespace, gameNumber, gameState)
      .then(() => {
        // Auto-advance after successful write if pending
        if (pendingAdvanceRef.current && isTournamentGame && gameNumber < 64) {
          pendingAdvanceRef.current = false
          const nextGame = gameNumber + 1
          setGameNumber(nextGame)
          setGameNumberInput(nextGame.toString())
        }
      })
      .catch(err => console.error('Failed to write game state:', err))
  }, [lastSession, lastColors, gameNumber, baseNamespace, hasNamespace, player1Name, player2Name, format, isTournamentGame, isGameComplete, initialData.loaded])

  const handleStateChange = useCallback((session: GameSession, colors: { p1: string; p2: string }) => {
    setLastSession(session)
    setLastColors(colors)
  }, [])

  // Auto-advance game number when tournament game is won
  // Sets a flag - actual advance happens after Firebase write completes
  const handleGameComplete = useCallback(() => {
    if (isTournamentGame && gameNumber < 64) {
      pendingAdvanceRef.current = true
    }
  }, [isTournamentGame, gameNumber])

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

  // Lock format to 1 for tournament games
  useEffect(() => {
    if (isTournamentGame && format !== 1) {
      setFormat(1)
    }
  }, [isTournamentGame, format])

  const cycleFormat = () => {
    if (isTournamentGame) return // Locked for tournament games
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

            <button
              className={`format-btn ${isTournamentGame ? 'locked' : ''}`}
              onClick={cycleFormat}
            >
              <span>Bo{format}</span>
              {isTournamentGame && <span className="format-locked-label">locked</span>}
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
        {isGameComplete ? (
          <div className="game-complete">
            <div className="game-complete-title">Game Complete</div>
            <div className="game-complete-message">
              This tournament game has already been played.
            </div>
          </div>
        ) : !initialData.loaded ? (
          <div className="game-complete">
            <div className="game-complete-title">Loading...</div>
          </div>
        ) : (
          <Scoreboard
            key={`${gameNumber}-${resetKey}`}
            onStateChange={handleStateChange}
            onGameComplete={handleGameComplete}
            onScreenChange={setScoreboardScreen}
            resetColorsKey={resetColorsKey}
            contained
            format={format}
            initialSession={resetKey > 0 ? undefined : initialData.session}
            initialColors={resetKey > 0 ? undefined : initialData.colors}
            liveSession={liveSession}
            liveColors={liveColors}
          />
        )}
      </div>

      {/* Bottom area - matches Phone layout */}
      <div className="keep-score-bottom">
        {/* Reset button - changes based on active scoreboard screen */}
        {initialData.loaded && !isGameComplete && (
          <button
            className="reset-btn"
            onClick={() => {
              if (scoreboardScreen === 'colors') {
                setResetColorsKey(k => k + 1)
              } else {
                setResetKey(k => k + 1)
              }
            }}
          >
            Reset
          </button>
        )}

        {/* Player name labels */}
        <div className="player-names-row">
          <span
            className={`player-name-label ${!player1Name ? 'empty' : ''} ${isTournamentGame ? 'locked' : ''}`}
            onClick={() => !isTournamentGame && setShowPlayerPicker(1)}
          >
            {player1Name || 'Player 1'}
          </span>
          <span
            className={`player-name-label ${!player2Name ? 'empty' : ''} ${isTournamentGame ? 'locked' : ''}`}
            onClick={() => !isTournamentGame && setShowPlayerPicker(2)}
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

          <button
            className={`format-btn ${isTournamentGame ? 'locked' : ''}`}
            onClick={cycleFormat}
          >
            <span>Bo{format}</span>
            {isTournamentGame && <span className="format-locked-label">locked</span>}
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
