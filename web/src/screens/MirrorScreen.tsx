import { useNavigate } from 'react-router-dom'
import { loadSettings } from './SettingsScreen'

const styles = `
  .mirror-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #515151;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .mirror-container {
    flex: 1;
    display: flex;
    flex-direction: row;
    gap: 1rem;
    padding: 1rem;
  }

  @media (max-width: 768px) {
    .mirror-container {
      flex-direction: column;
    }
  }

  .mirror-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    border-radius: 1rem;
    padding: 2rem;
    min-height: 300px;
  }

  .mirror-game-label {
    font-size: 0.875rem;
    color: #888;
    margin-bottom: 1rem;
  }

  .mirror-placeholder {
    font-size: 1.25rem;
    color: #555;
    text-align: center;
  }

  .no-namespace {
    color: #d35400;
  }

  .mirror-footer {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background: #1a1a1a;
  }

  .back-btn {
    padding: 0.75rem 2rem;
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

export function MirrorScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()

  const hasNamespace = settings.namespace.trim().length > 0

  return (
    <div className="mirror-screen">
      <div className="mirror-container">
        <div className="mirror-panel">
          <div className="mirror-game-label">
            Game {settings.mirror1Game}
          </div>
          {hasNamespace ? (
            <div className="mirror-placeholder">
              Connecting to<br />
              {settings.namespace}/{settings.mirror1Game}
            </div>
          ) : (
            <div className="mirror-placeholder no-namespace">
              No namespace configured<br />
              Go to Settings
            </div>
          )}
        </div>

        <div className="mirror-panel">
          <div className="mirror-game-label">
            Game {settings.mirror2Game}
          </div>
          {hasNamespace ? (
            <div className="mirror-placeholder">
              Connecting to<br />
              {settings.namespace}/{settings.mirror2Game}
            </div>
          ) : (
            <div className="mirror-placeholder no-namespace">
              No namespace configured<br />
              Go to Settings
            </div>
          )}
        </div>
      </div>

      <div className="mirror-footer">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
