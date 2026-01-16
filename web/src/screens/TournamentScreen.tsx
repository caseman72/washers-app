import { useNavigate } from 'react-router-dom'
import { useTournaments } from '../hooks/useTournaments'
import { loadSettings } from './SettingsScreen'

const styles = `
  .tournament-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .tournament-header {
    padding: 1rem;
    background: #111;
  }

  .tournament-title {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .tournament-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1.5rem;
  }

  .tournament-btn {
    width: 100%;
    max-width: 300px;
    padding: 1.5rem 2rem;
    font-size: 1.25rem;
    font-weight: 500;
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  .tournament-btn:hover {
    transform: scale(1.02);
  }

  .tournament-btn:active {
    transform: scale(0.98);
  }

  .create-btn {
    background: #d35400;
    color: white;
  }

  .create-btn:hover {
    background: #e55d00;
  }

  .view-btn {
    background: #2a2a2a;
    color: white;
    border: 1px solid #444;
  }

  .view-btn:hover {
    background: #333;
  }

  .tournament-footer {
    padding: 1rem;
    background: #111;
  }

  .back-btn {
    width: 100%;
    padding: 0.75rem;
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
`

export function TournamentScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const namespace = settings.namespace
  const { tournaments, loading } = useTournaments(namespace)

  // Find active tournament (not archived, status is active or setup)
  const activeTournament = tournaments.find(t => !t.archived && (t.status === 'active' || t.status === 'setup'))
  const archivedCount = tournaments.filter(t => t.archived).length

  if (loading) {
    return (
      <div className="tournament-screen">
        <div className="tournament-header">
          <div className="tournament-title">Tournaments</div>
        </div>
        <div className="tournament-content">
          <div style={{ color: '#888' }}>Loading...</div>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  return (
    <div className="tournament-screen">
      <div className="tournament-header">
        <div className="tournament-title">Tournaments</div>
      </div>

      <div className="tournament-content">
        {activeTournament ? (
          <button
            className="tournament-btn create-btn"
            onClick={() => navigate(`/tournament/${activeTournament.id}`)}
          >
            View Current
            <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.25rem' }}>
              {activeTournament.name}
            </div>
          </button>
        ) : (
          <button
            className="tournament-btn create-btn"
            onClick={() => navigate('/tournament/new')}
          >
            Create New
          </button>
        )}
        <button
          className="tournament-btn view-btn"
          onClick={() => navigate('/tournament/list')}
        >
          View Archived
          {archivedCount > 0 && (
            <div style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem' }}>
              {archivedCount} tournament{archivedCount !== 1 ? 's' : ''}
            </div>
          )}
        </button>
      </div>

      <div className="tournament-footer">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
