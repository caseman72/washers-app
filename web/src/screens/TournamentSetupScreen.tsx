import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Player, Tournament } from '../types'
import { loadPlayers } from './PlayersScreen'
import { generateTournament } from '../lib/bracket'

const styles = `
  .setup-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .setup-header {
    padding: 1rem;
    background: #111;
  }

  .setup-title {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .setup-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    color: #888;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 0.5rem;
    color: white;
    box-sizing: border-box;
  }

  .form-input:focus {
    outline: none;
    border-color: #d35400;
  }

  .player-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .player-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #2a2a2a;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .player-checkbox:hover {
    background: #333;
  }

  .player-checkbox.selected {
    background: #d35400;
  }

  .player-checkbox input {
    display: none;
  }

  .checkbox-indicator {
    width: 20px;
    height: 20px;
    border: 2px solid #666;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .player-checkbox.selected .checkbox-indicator {
    border-color: white;
    background: white;
  }

  .checkmark {
    color: #d35400;
    font-weight: bold;
  }

  .player-checkbox-name {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .selection-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .select-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    background: #333;
    color: #aaa;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .select-btn:hover {
    background: #444;
    color: white;
  }

  .selection-count {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.5rem;
  }

  .selection-count.error {
    color: #e74c3c;
  }

  .elimination-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .toggle-btn {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    background: #2a2a2a;
    color: #888;
    border: 1px solid #444;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: #d35400;
    color: white;
    border-color: #d35400;
  }

  .no-players {
    text-align: center;
    color: #888;
    padding: 2rem;
  }

  .no-players-link {
    color: #d35400;
    cursor: pointer;
    text-decoration: underline;
  }

  .setup-footer {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: #111;
  }

  .cancel-btn {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    background: #333;
    color: #aaa;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #444;
    color: white;
  }

  .create-btn {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    background: #d35400;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .create-btn:hover {
    background: #e55d00;
  }

  .create-btn:disabled {
    background: #666;
    cursor: not-allowed;
  }
`

const TOURNAMENT_STORAGE_KEY = 'washers-tournament'

export function saveTournament(tournament: Tournament): void {
  try {
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(tournament))
  } catch (e) {
    console.error('Failed to save tournament:', e)
  }
}

export function loadTournament(): Tournament | null {
  try {
    const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load tournament:', e)
  }
  return null
}

export function clearTournament(): void {
  localStorage.removeItem(TOURNAMENT_STORAGE_KEY)
}

export function TournamentSetupScreen() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState<Player[]>([])
  const [tournamentName, setTournamentName] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
  const [elimination, setElimination] = useState<'single_elimination' | 'double_elimination'>('double_elimination')

  useEffect(() => {
    const allPlayers = loadPlayers()
    const activePlayers = allPlayers.filter(p => !p.archived)
    setPlayers(activePlayers)
    // Select all players by default (up to 16)
    const initialSelected = new Set(activePlayers.slice(0, 16).map(p => p.id))
    setSelectedPlayerIds(initialSelected)
  }, [])

  const selectAll = () => {
    const allIds = new Set(players.slice(0, 16).map(p => p.id))
    setSelectedPlayerIds(allIds)
  }

  const deselectAll = () => {
    setSelectedPlayerIds(new Set())
  }

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayerIds)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
    } else {
      if (newSelected.size < 16) {
        newSelected.add(playerId)
      }
    }
    setSelectedPlayerIds(newSelected)
  }

  const canCreate = selectedPlayerIds.size >= 2 && selectedPlayerIds.size <= 16

  const handleCreate = () => {
    if (!canCreate) return

    const name = tournamentName.trim() || `Tournament ${new Date().toLocaleDateString()}`
    const tournament = generateTournament(
      name,
      Array.from(selectedPlayerIds),
      elimination,
      1 // bestOf
    )

    saveTournament(tournament)
    navigate(`/tournament/${tournament.id}`)
  }

  return (
    <div className="setup-screen">
      <div className="setup-header">
        <div className="setup-title">New Tournament</div>
      </div>

      <div className="setup-content">
        <div className="form-section">
          <label className="form-label">Tournament Name (optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., Summer Championship"
            value={tournamentName}
            onChange={e => setTournamentName(e.target.value)}
          />
        </div>

        <div className="form-section">
          <div className="selection-header">
            <label className="form-label">Select Players (2-16)</label>
            {players.length > 0 && (
              <div className="selection-buttons">
                <button className="select-btn" onClick={selectAll}>All</button>
                <button className="select-btn" onClick={deselectAll}>None</button>
              </div>
            )}
          </div>
          {players.length === 0 ? (
            <div className="no-players">
              No players yet.{' '}
              <span className="no-players-link" onClick={() => navigate('/players')}>
                Add some players first
              </span>
            </div>
          ) : (
            <>
              <div className="player-grid">
                {players.map(player => (
                  <label
                    key={player.id}
                    className={`player-checkbox ${selectedPlayerIds.has(player.id) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayerIds.has(player.id)}
                      onChange={() => togglePlayer(player.id)}
                    />
                    <span className="checkbox-indicator">
                      {selectedPlayerIds.has(player.id) && <span className="checkmark">✓</span>}
                    </span>
                    <span className="player-checkbox-name">{player.name}</span>
                  </label>
                ))}
              </div>
              <div className={`selection-count ${selectedPlayerIds.size < 2 ? 'error' : ''}`}>
                {selectedPlayerIds.size} selected
                {selectedPlayerIds.size < 2 && ' (minimum 2)'}
                {selectedPlayerIds.size > 16 && ' (maximum 16)'}
              </div>
            </>
          )}
        </div>

        <div className="form-section">
          <label className="form-label">Elimination Type</label>
          <div className="elimination-toggle">
            <button
              className={`toggle-btn ${elimination === 'single_elimination' ? 'active' : ''}`}
              onClick={() => setElimination('single_elimination')}
            >
              Single
            </button>
            <button
              className={`toggle-btn ${elimination === 'double_elimination' ? 'active' : ''}`}
              onClick={() => setElimination('double_elimination')}
            >
              Double
            </button>
          </div>
        </div>
      </div>

      <div className="setup-footer">
        <button className="cancel-btn" onClick={() => navigate('/')}>
          Cancel
        </button>
        <button
          className="create-btn"
          onClick={handleCreate}
          disabled={!canCreate}
        >
          Create Bracket
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
