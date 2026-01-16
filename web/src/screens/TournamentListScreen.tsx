import { useNavigate } from 'react-router-dom'
import { useTournaments } from '../hooks/useTournaments'
import { loadSettings } from './SettingsScreen'

const styles = `
  .list-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .list-header {
    padding: 1rem;
    background: #111;
  }

  .list-title {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .list-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .tournament-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #2a2a2a;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .tournament-item:hover {
    background: #333;
  }


  .tournament-info {
    flex: 1;
    min-width: 0;
  }

  .tournament-name {
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tournament-meta {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.25rem;
  }

  .tournament-status {
    font-size: 0.625rem;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
    margin-left: 0.75rem;
    flex-shrink: 0;
  }

  .tournament-status.active {
    background: #27ae60;
    color: white;
  }

  .tournament-status.complete {
    background: #d35400;
    color: white;
  }


  .no-tournaments {
    text-align: center;
    color: #666;
    padding: 3rem 1rem;
  }

  .no-tournaments-title {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: #888;
  }

  .create-link {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #d35400;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }

  .list-footer {
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

  .loading {
    text-align: center;
    color: #666;
    padding: 3rem;
  }
`

export function TournamentListScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const { tournaments, loading } = useTournaments(settings.namespace)

  const archivedTournaments = tournaments.filter(t => t.archived)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return (
      <div className="list-screen">
        <div className="list-header">
          <div className="list-title">Archived Tournaments</div>
        </div>
        <div className="list-content">
          <div className="loading">Loading...</div>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  return (
    <div className="list-screen">
      <div className="list-header">
        <div className="list-title">Archived Tournaments</div>
      </div>

      <div className="list-content">
        {archivedTournaments.length === 0 ? (
          <div className="no-tournaments">
            <div className="no-tournaments-title">No Archived Tournaments</div>
            <div>Completed tournaments will appear here after you archive them</div>
          </div>
        ) : (
          archivedTournaments.map(t => (
            <div
              key={t.id}
              className="tournament-item"
              onClick={() => navigate(`/tournament/${t.id}`)}
            >
              <div className="tournament-info">
                <div className="tournament-name">{t.name}</div>
                <div className="tournament-meta">
                  {t.playerIds.length} players · {t.format === 'double_elimination' ? 'Double' : 'Single'} · {formatDate(t.createdAt)}
                </div>
              </div>
              <span className="tournament-status complete">
                {t.status}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="list-footer">
        <button className="back-btn" onClick={() => navigate('/tournament')}>
          Back
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
