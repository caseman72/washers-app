import { useNavigate } from 'react-router-dom'

const styles = `
  .home-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 2rem;
  }

  .home-title {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 3rem;
    color: #d35400;
  }

  .mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 300px;
  }

  .mode-btn {
    padding: 1.5rem 2rem;
    font-size: 1.25rem;
    font-weight: 500;
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  .mode-btn:hover {
    transform: scale(1.02);
  }

  .mode-btn:active {
    transform: scale(0.98);
  }

  .mode-btn.mirror {
    background: #2980b9;
    color: white;
  }

  .mode-btn.mirror:hover {
    background: #3498db;
  }

  .mode-btn.keep-score {
    background: #27ae60;
    color: white;
  }

  .mode-btn.keep-score:hover {
    background: #2ecc71;
  }

  .mode-btn.settings {
    background: #444;
    color: #ccc;
  }

  .mode-btn.settings:hover {
    background: #555;
    color: white;
  }

  .mode-btn.players {
    background: #8e44ad;
    color: white;
  }

  .mode-btn.players:hover {
    background: #9b59b6;
  }

  .mode-btn.tournament {
    background: #d35400;
    color: white;
  }

  .mode-btn.tournament:hover {
    background: #e67e22;
  }

  .mode-description {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-top: 0.25rem;
  }

  .section-divider {
    width: 100%;
    max-width: 300px;
    border-top: 1px solid #333;
    margin: 1rem 0;
  }

  .section-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }
`

export function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="home-screen">
      <h1 className="home-title">Washers</h1>

      <div className="mode-buttons">
        <button
          className="mode-btn mirror"
          onClick={() => navigate('/mirror')}
        >
          Mirror
          <div className="mode-description">Watch live games</div>
        </button>

        <button
          className="mode-btn keep-score"
          onClick={() => navigate('/keep-score')}
        >
          Keep Score
          <div className="mode-description">Standalone scoring</div>
        </button>

        <button
          className="mode-btn settings"
          onClick={() => navigate('/settings')}
        >
          Settings
          <div className="mode-description">Namespace & game config</div>
        </button>

        <div className="section-divider" />
        <div className="section-label">Tournament</div>

        <button
          className="mode-btn players"
          onClick={() => navigate('/players')}
        >
          Players
          <div className="mode-description">Manage player list</div>
        </button>

        <button
          className="mode-btn tournament"
          onClick={() => navigate('/tournament/current')}
        >
          Bracket
          <div className="mode-description">View or create tournament</div>
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
