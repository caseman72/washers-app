import { useNavigate } from 'react-router-dom'

const styles = `
  .home-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 100vh;
    background: #111;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 50px 1.5rem 1.5rem 1.5rem;
    box-sizing: border-box;
  }

  .home-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #1a1a1a;
    border-radius: 1rem;
    padding: 2rem 2.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  .home-title {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    color: #d35400;
  }

  .mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    min-width: 280px;
  }

  .mode-btn {
    padding: 1rem 1.5rem;
    font-size: 1.125rem;
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
    margin: 0.75rem 0;
  }

  .section-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }

  .rules-link {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #666;
  }

  .rules-link a {
    color: #4a9eff;
    text-decoration: none;
  }

  .rules-link a:hover {
    text-decoration: underline;
  }

  @media (max-width: 600px) {
    .home-screen {
      background: #1a1a1a;
      padding-top: 25px;
    }
    .home-card {
      box-shadow: none;
    }
  }
`

export function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="home-screen">
      <div className="home-card">
        <h1 className="home-title">Washers</h1>

        <div className="mode-buttons">
          <button
            className="mode-btn keep-score"
            onClick={() => navigate('/keep-score')}
          >
            Keep Score
            <div className="mode-description">Score tracking</div>
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
            onClick={() => navigate('/tournament')}
          >
            Tournament
            <div className="mode-description">Create or view brackets</div>
          </button>
        </div>

        <div className="rules-link">
          <a href="/rules" target="_blank" rel="noopener noreferrer">Official Rules</a>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  )
}
