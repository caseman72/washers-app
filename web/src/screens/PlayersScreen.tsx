import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { loadSettings } from './SettingsScreen'

const styles = `
  .players-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .players-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #111;
  }

  .players-title {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .add-btn {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    background: #d35400;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .add-btn:hover {
    background: #e55d00;
  }

  .players-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .player-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .player-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #2a2a2a;
    border-radius: 0.5rem;
    gap: 1rem;
  }

  .player-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
  }

  .player-name {
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: #888;
  }

  .stat-item {
    display: flex;
    gap: 0.25rem;
    white-space: nowrap;
  }

  .stat-label {
    color: #666;
  }

  .stat-value {
    color: #aaa;
  }

  .stat-value.wins {
    color: #27ae60;
  }

  .stat-value.losses {
    color: #c0392b;
  }

  /* Hide stats on mobile */
  @media (max-width: 600px) {
    .player-stats {
      display: none;
    }
  }

  .delete-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    background: #c0392b;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .delete-btn:hover {
    background: #e74c3c;
  }

  .empty-state {
    text-align: center;
    color: #888;
    padding: 3rem 1rem;
  }

  .empty-state-title {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .players-footer {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background: #111;
  }

  .back-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
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

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: #2a2a2a;
    border-radius: 1rem;
    padding: 1.5rem;
    width: 90%;
    max-width: 400px;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  .modal-input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 0.5rem;
    color: white;
    margin-bottom: 1rem;
    box-sizing: border-box;
  }

  .modal-input:focus {
    outline: none;
    border-color: #d35400;
  }

  .modal-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .modal-cancel-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: #333;
    color: #aaa;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .modal-save-btn {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: #d35400;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .modal-save-btn:disabled {
    background: #666;
    cursor: not-allowed;
  }

  .player-count {
    font-size: 0.875rem;
    color: #888;
  }

  .namespace-display {
    font-size: 0.75rem;
    color: #d35400;
    margin-left: 0.5rem;
  }

  .loading-state {
    text-align: center;
    color: #888;
    padding: 3rem 1rem;
  }

  .error-state {
    text-align: center;
    color: #e74c3c;
    padding: 3rem 1rem;
  }

  .no-namespace {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #888;
    text-align: center;
    padding: 2rem;
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

export function PlayersScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const namespace = settings.namespace
  const { players, loading, error, addPlayer, deletePlayer } = usePlayers(namespace)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return

    try {
      await addPlayer(newPlayerName.trim())
      setNewPlayerName('')
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to add player:', err)
      alert('Failed to add player')
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Delete this player?')) return

    try {
      await deletePlayer(playerId)
    } catch (err) {
      console.error('Failed to delete player:', err)
      alert('Failed to delete player')
    }
  }

  const activePlayers = players.filter(p => !p.archived)
  const hasNamespace = namespace.trim().length > 0

  if (!hasNamespace) {
    return (
      <div className="players-screen">
        <div className="players-header">
          <span className="players-title">Players</span>
        </div>
        <div className="no-namespace">
          <div className="no-namespace-title">No Namespace Configured</div>
          <div>Go to Settings to enter your namespace</div>
          <button className="settings-link" onClick={() => navigate('/settings')}>
            Open Settings
          </button>
        </div>
        <div className="players-footer">
          <button className="back-btn" onClick={() => navigate('/')}>
            Back to Menu
          </button>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  return (
    <div className="players-screen">
      <div className="players-header">
        <div>
          <span className="players-title">Players</span>
          <span className="player-count"> ({activePlayers.length})</span>
        </div>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          + Add
        </button>
      </div>

      <div className="players-content">
        {loading ? (
          <div className="loading-state">Loading players...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : activePlayers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No Players Yet</div>
            <div>Add players to create tournaments</div>
          </div>
        ) : (
          <div className="player-list">
            {activePlayers.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  <div className="player-stats">
                    <span className="stat-item">
                      <span className="stat-label">W:</span>
                      <span className="stat-value wins">{player.wins}</span>
                    </span>
                    <span className="stat-item">
                      <span className="stat-label">L:</span>
                      <span className="stat-value losses">{player.losses}</span>
                    </span>
                    {(player.tournamentWins > 0 || player.tournamentLosses > 0) && (
                      <span className="stat-item">
                        <span className="stat-label">1v1:</span>
                        <span className="stat-value wins">{player.tournamentWins}</span>
                        <span className="stat-value">/</span>
                        <span className="stat-value losses">{player.tournamentLosses}</span>
                      </span>
                    )}
                    {(player.teamWins > 0 || player.teamLosses > 0) && (
                      <span className="stat-item">
                        <span className="stat-label">2v2:</span>
                        <span className="stat-value wins">{player.teamWins}</span>
                        <span className="stat-value">/</span>
                        <span className="stat-value losses">{player.teamLosses}</span>
                      </span>
                    )}
                    {(player.finalsWins + player.teamFinalsWins > 0 || player.finalsLosses + player.teamFinalsLosses > 0) && (
                      <span className="stat-item">
                        <span className="stat-label">Champ:</span>
                        <span className="stat-value wins">{player.finalsWins + player.teamFinalsWins}</span>
                        <span className="stat-value">/</span>
                        <span className="stat-value losses">{player.finalsLosses + player.teamFinalsLosses}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeletePlayer(player.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="players-footer">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Player</div>
            <input
              type="text"
              className="modal-input"
              placeholder="Player name"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-save-btn"
                onClick={handleAddPlayer}
                disabled={!newPlayerName.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </div>
  )
}
