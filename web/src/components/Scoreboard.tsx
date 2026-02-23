import { useState, useCallback, useEffect } from 'react'
import type { GameSession } from '../types'

const WINNING_SCORE = 21

// Color palette - order matters for display
const COLORS = [
  { id: 'orange', name: 'Orange', bg: '#d35400', text: '#ffffff' },
  { id: 'black', name: 'Black', bg: '#1a1a1a', text: '#ffffff' },
  { id: 'silver', name: 'Silver', bg: '#c0c0c0', text: '#000000' },
  { id: 'red', name: 'Red', bg: '#c0392b', text: '#ffffff' },
  { id: 'white', name: 'White', bg: '#ffffff', text: '#000000' },
  { id: 'blue', name: 'Blue', bg: '#2980b9', text: '#ffffff' },
  { id: 'yellow', name: 'Yellow', bg: '#f1c40f', text: '#000000' },
  { id: 'purple', name: 'Purple', bg: '#8e44ad', text: '#ffffff' },
  { id: 'green', name: 'Green', bg: '#27ae60', text: '#ffffff' },
  { id: 'brown', name: 'Brown', bg: '#795548', text: '#ffffff' },
] as const

export type ColorId = typeof COLORS[number]['id']

const getColor = (id: ColorId) => COLORS.find(c => c.id === id)!

// Color picker styles (Samsung-inspired list)
const colorPickerStyles = `
  .color-picker-view {
    background: #1a1a1a;
  }

  .color-picker-header {
    font-size: 1.25rem;
    color: #888;
    text-align: center;
    padding: 1.5rem;
    border-bottom: 1px solid #333;
  }

  .color-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
    max-height: 70vh;
  }

  .color-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .color-item:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  .color-item.disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .color-item.selected {
    background: rgba(255, 255, 255, 0.05);
  }

  .color-swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .color-name {
    flex: 1;
    text-align: left;
  }

  .checkmark {
    color: #4caf50;
    font-size: 1.5rem;
  }

  .page-dots {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
    padding: 1.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #555;
    cursor: pointer;
    transition: background 0.2s;
    padding: 6px;
    background-clip: content-box;
    box-sizing: content-box;
  }

  .dot.active {
    background: #fff;
    background-clip: content-box;
  }

  .dot:hover:not(.active) {
    background: #777;
    background-clip: content-box;
  }
`

// Main scoreboard styles - shared across all screens
const mainStyles = `
  .scoreboard {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #515151;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    touch-action: pan-y;
  }

  .scoreboard.contained {
    min-height: unset;
    height: 100%;
    width: 100%;
    padding: 30px 0 0 0;
    box-sizing: border-box;
    justify-content: flex-start;
  }

  .games-counter {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
    height: 68px;
  }

  .contained .games-counter {
    gap: 0.5rem;
    margin-bottom: 0;
    height: 50px;
    flex-shrink: 0;
  }

  .games {
    font-size: 3rem;
    font-weight: bold;
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
  }

  .contained .games {
    font-size: 1.75rem;
    min-width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .games.names {
    font-size: 1rem;
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contained .games.names {
    font-size: 0.875rem;
    max-width: 40%;
  }

  .games-label {
    font-size: 1rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }

  .contained .games-label {
    font-size: 1.125rem;
    color: #888;
    letter-spacing: 0.05em;
    padding: 0 0.25rem;
  }

  .scores {
    display: flex;
    gap: 0;
  }

  .contained .scores {
    flex: 1;
    width: calc(100% - 35px);
    margin-top: 10px;
    gap: 15px;
    margin-left: 15px;
    margin-right: 15px;
  }

  .score-panel {
    width: 45vw;
    height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: stretch;
    overflow: hidden;
    border-radius: 1rem;
  }

  .contained .score-panel {
    width: unset;
    height: unset;
    flex: 1;
    border-radius: 0.5rem;
  }

  .btn-up, .btn-down {
    width: 100%;
    flex: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: background 0.1s;
    background: rgba(0, 0, 0, 0.25);
    color: inherit;
  }

  .contained .btn-up, .contained .btn-down {
    font-size: 1.75rem;
  }

  .btn-up:hover, .btn-down:hover {
    background: rgba(0, 0, 0, 0.35);
  }

  .btn-up:active, .btn-down:active {
    background: rgba(0, 0, 0, 0.45);
  }

  .btn-down {
    opacity: 0.7;
  }

  .score {
    flex: 1.4;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15vw;
    font-weight: bold;
    color: inherit;
    width: 100%;
  }

  .contained .score {
    font-size: 4.5rem;
  }

  .reset-btn {
    margin-top: 2rem;
    width: 120px;
    padding: 0.75rem 0;
    font-size: 1rem;
    background: #333;
    color: #888;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .reset-btn:hover {
    background: #444;
    color: white;
  }

  .contained .reset-btn {
    margin-top: 1rem;
    width: 100px;
    padding: 0.5rem 0;
    font-size: 0.875rem;
  }

  .page-dots {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
    margin-top: 1.5rem;
  }

  .contained .page-dots {
    margin-top: 0.75rem;
    padding-bottom: 0.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #555;
    cursor: pointer;
    transition: background 0.2s;
    padding: 6px;
    background-clip: content-box;
    box-sizing: content-box;
  }

  .dot.active {
    background: #fff;
    background-clip: content-box;
  }

  .dot:hover:not(.active) {
    background: #777;
    background-clip: content-box;
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
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    min-width: 300px;
  }

  .modal-question {
    font-size: 2rem;
    margin: 0 0 1.5rem;
    font-weight: bold;
  }

  .modal-buttons {
    display: flex;
    gap: 0.75rem;
    width: 100%;
  }

  .btn-no {
    flex: 1;
    padding: 1.25rem;
    font-size: 1.25rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: #444;
    color: #999;
  }

  .btn-no:hover {
    background: #555;
    color: white;
  }

  .btn-yes {
    flex: 3;
    padding: 1.25rem;
    font-size: 1.5rem;
    font-weight: bold;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: #4caf50;
    color: white;
  }

  .btn-yes:hover {
    background: #5cbf60;
  }
`

interface ScoreboardProps {
  onGameComplete?: (winner: 1 | 2, session: GameSession) => void
  onStateChange?: (session: GameSession, colors: { p1: string; p2: string }) => void
  contained?: boolean
  format?: number
  player1Name?: string
  player2Name?: string
  initialSession?: GameSession
  initialColors?: { p1: ColorId; p2: ColorId }
  onScreenChange?: (screen: 'game' | 'colors') => void
  resetColorsKey?: number
  liveSession?: GameSession
  liveColors?: { p1: ColorId; p2: ColorId }
}

const defaultSession: GameSession = {
  player1Score: 0,
  player2Score: 0,
  player1Games: 0,
  player2Games: 0,
  player1Rounds: 0,
  player2Rounds: 0,
}

export function Scoreboard({ onGameComplete, onStateChange, contained = false, format = 1, player1Name: _player1Name, player2Name: _player2Name, initialSession, initialColors, onScreenChange, resetColorsKey, liveSession, liveColors }: ScoreboardProps) {
  const [session, setSession] = useState<GameSession>(initialSession ?? defaultSession)
  const [showDonePrompt, setShowDonePrompt] = useState<1 | 2 | null>(null)
  const [player1Color, setPlayer1Color] = useState<ColorId>(initialColors?.p1 ?? 'orange')
  const [player2Color, setPlayer2Color] = useState<ColorId>(initialColors?.p2 ?? 'black')

  // Accept live updates from Firebase
  useEffect(() => {
    if (liveSession) setSession(liveSession)
  }, [liveSession])

  useEffect(() => {
    if (liveColors) {
      setPlayer1Color(liveColors.p1)
      setPlayer2Color(liveColors.p2)
    }
  }, [liveColors])
  const [screen, setScreen] = useState<'game' | 'colors'>('game')
  const [colorPicker, setColorPicker] = useState<1 | 2 | null>(null)

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (colorPicker) {
      // In color picker - swipe right to go back to colors screen
      if (isRightSwipe) {
        setColorPicker(null)
      }
    } else if (screen === 'game') {
      // On game screen - swipe left to go to colors
      if (isLeftSwipe) {
        setScreen('colors')
      }
    } else {
      // On colors screen - swipe right to go back to game, left to... nothing
      if (isRightSwipe) {
        setScreen('game')
      }
    }
  }, [touchStart, touchEnd, colorPicker, screen])

  // Handle escape key to close color picker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && colorPicker) {
        setColorPicker(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [colorPicker])

  // Handle browser back button
  useEffect(() => {
    if (colorPicker) {
      window.history.pushState({ colorPicker: true }, '')
    }
    const handlePopState = () => {
      if (colorPicker) {
        setColorPicker(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [colorPicker])

  // Notify parent of state changes for Firebase sync
  useEffect(() => {
    onStateChange?.(session, { p1: player1Color.toUpperCase(), p2: player2Color.toUpperCase() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, player1Color, player2Color])

  // Notify parent of screen changes
  useEffect(() => {
    onScreenChange?.(screen)
  }, [screen, onScreenChange])

  const selectColor = useCallback((player: 1 | 2, color: ColorId) => {
    if (player === 1) {
      setPlayer1Color(color)
    } else {
      setPlayer2Color(color)
    }
    setColorPicker(null)
    // Stay on colors screen after selection so user can pick the other color too
  }, [])

  const incrementScore = useCallback((player: 1 | 2) => {
    setSession(prev => {
      const key = player === 1 ? 'player1Score' : 'player2Score'
      const newScore = prev[key] + 1

      // Check for win
      if (newScore === WINNING_SCORE) {
        setShowDonePrompt(player)
      }

      return { ...prev, [key]: newScore > WINNING_SCORE ? 15 : newScore }
    })
  }, [])

  const decrementScore = useCallback((player: 1 | 2) => {
    setSession(prev => {
      const key = player === 1 ? 'player1Score' : 'player2Score'
      const newScore = Math.max(0, prev[key] - 1)
      return { ...prev, [key]: newScore }
    })
    setShowDonePrompt(null)
  }, [])

  const confirmWin = useCallback((winner: 1 | 2) => {
    setSession(prev => {
      const gamesNeeded = Math.floor(format / 2) + 1
      const newPlayer1Games = winner === 1 ? prev.player1Games + 1 : prev.player1Games
      const newPlayer2Games = winner === 2 ? prev.player2Games + 1 : prev.player2Games
      const player1WinsSession = newPlayer1Games >= gamesNeeded
      const player2WinsSession = newPlayer2Games >= gamesNeeded

      let newSession: GameSession
      if (player1WinsSession) {
        newSession = {
          player1Score: 0,
          player2Score: 0,
          player1Games: 0,
          player2Games: 0,
          player1Rounds: prev.player1Rounds + 1,
          player2Rounds: prev.player2Rounds,
        }
      } else if (player2WinsSession) {
        newSession = {
          player1Score: 0,
          player2Score: 0,
          player1Games: 0,
          player2Games: 0,
          player1Rounds: prev.player1Rounds,
          player2Rounds: prev.player2Rounds + 1,
        }
      } else {
        newSession = {
          player1Score: 0,
          player2Score: 0,
          player1Games: newPlayer1Games,
          player2Games: newPlayer2Games,
          player1Rounds: prev.player1Rounds,
          player2Rounds: prev.player2Rounds,
        }
      }
      onGameComplete?.(winner, newSession)
      return newSession
    })
    setShowDonePrompt(null)
  }, [onGameComplete, format])

  const cancelWin = useCallback((player: 1 | 2) => {
    incrementScore(player) // reset to 15 ... because you win or bust
    setShowDonePrompt(null)
  }, [])

  const resetColors = useCallback(() => {
    setPlayer1Color('orange')
    setPlayer2Color('black')
  }, [])

  // Reset colors when parent triggers via key change
  useEffect(() => {
    if (resetColorsKey && resetColorsKey > 0) {
      resetColors()
    }
  }, [resetColorsKey, resetColors])

  const p1 = getColor(player1Color)
  const p2 = getColor(player2Color)
  const otherColor = colorPicker === 1 ? player2Color : player1Color
  const baseClass = contained ? 'scoreboard contained' : 'scoreboard'

  // Color picker view (sub-screen of colors screen)
  if (colorPicker) {
    return (
      <div
        className={`${baseClass} color-picker-view`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="color-picker-header">
          <span>Player {colorPicker} Color</span>
        </div>
        <div className="color-list">
          {COLORS.map((color, index) => {
            const isDisabled = color.id === otherColor
            const isSelected = color.id === (colorPicker === 1 ? player1Color : player2Color)
            return (
              <button
                key={color.id}
                className={`color-item ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => !isDisabled && selectColor(colorPicker, color.id)}
                disabled={isDisabled}
                style={{
                  '--item-index': index,
                } as React.CSSProperties}
              >
                <span
                  className="color-swatch"
                  style={{
                    background: color.bg,
                    border: color.id === 'white' ? '2px solid #ccc' : 'none',
                  }}
                />
                <span className="color-name">{color.name}</span>
                {isSelected && <span className="checkmark">✓</span>}
              </button>
            )
          })}
        </div>
        {/* Page dots - show as page 2 (colors screen) */}
        <div className="page-dots">
          <span className="dot" onClick={() => { setColorPicker(null); setScreen('game'); }} />
          <span className="dot active" />
        </div>
        <style>{colorPickerStyles}</style>
      </div>
    )
  }

  // Colors screen (Screen 2) - uses SAME layout structure as Screen 1
  if (screen === 'colors') {
    return (
      <div
        className={baseClass}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header - same structure as games-counter, with invisible badges for spacing */}
        <div className="games-counter">
          <span className="games" style={{ visibility: 'hidden', border: '2px solid transparent' }}>0</span>
          <span className="games-label">CHOOSE COLORS</span>
          <span className="games" style={{ visibility: 'hidden', border: '2px solid transparent' }}>0</span>
        </div>

        {/* Color panels - same structure as scores, tap to change */}
        <div className="scores">
          <div
            className="score-panel"
            style={{ background: p1.bg, color: p1.text, cursor: 'pointer' }}
            onClick={() => setColorPicker(1)}
          />
          <div
            className="score-panel"
            style={{ background: p2.bg, color: p2.text, cursor: 'pointer' }}
            onClick={() => setColorPicker(2)}
          />
        </div>

        {/* Page dots */}
        <div className="page-dots">
          <span className="dot" onClick={() => setScreen('game')} />
          <span className="dot active" />
        </div>

        <style>{mainStyles}</style>
      </div>
    )
  }

  return (
    <div
      className={baseClass}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header: show rounds.games when format > 1, otherwise just games */}
      <div className="games-counter">
        <span className="games" style={{ background: p1.bg, color: p1.text }}>
          {format > 1 ? `${session.player1Rounds}.${session.player1Games}` : session.player1Games}
        </span>
        <span className="games-label">Games</span>
        <span className="games" style={{ background: p2.bg, color: p2.text, border: player2Color === 'white' ? '2px solid #ccc' : player2Color === 'black' ? '2px solid #333' : 'none' }}>
          {format > 1 ? `${session.player2Rounds}.${session.player2Games}` : session.player2Games}
        </span>
      </div>

      {/* Main scores - NO onClick on panels, only on buttons */}
      <div className="scores">
        <div
          className="score-panel"
          style={{ background: p1.bg, color: p1.text }}
        >
          <button className="btn-up" onClick={() => incrementScore(1)}>+</button>
          <span className="score">{session.player1Score}</span>
          <button className="btn-down" onClick={() => decrementScore(1)}>−</button>
        </div>

        <div
          className="score-panel"
          style={{ background: p2.bg, color: p2.text }}
        >
          <button className="btn-up" onClick={() => incrementScore(2)}>+</button>
          <span className="score">{session.player2Score}</span>
          <button className="btn-down" onClick={() => decrementScore(2)}>−</button>
        </div>
      </div>

      {/* Page dots - click to go to colors screen */}
      <div className="page-dots">
        <span className="dot active" />
        <span className="dot" onClick={() => setScreen('colors')} />
      </div>

      {/* Done prompt modal */}
      {showDonePrompt && (
        <div className="modal-overlay">
          <div className="modal">
            <p className="modal-question">Player {showDonePrompt} Won?</p>
            <div className="modal-buttons">
              <button className="btn-no" onClick={() => cancelWin(showDonePrompt)}>No</button>
              <button className="btn-yes" onClick={() => confirmWin(showDonePrompt)}>Yes</button>
            </div>
          </div>
        </div>
      )}

      <style>{mainStyles}</style>
    </div>
  )
}
