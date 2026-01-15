import { useNavigate } from 'react-router-dom'
import { loadSettings } from './SettingsScreen'
import { useGameState } from '../hooks/useGameState'
import { GameDisplay } from '../components/GameDisplay'

const styles = `
  .mirror-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .mirror-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #111;
  }

  .mirror-title {
    font-size: 1rem;
    color: #888;
  }

  .namespace-display {
    font-size: 0.875rem;
    color: #d35400;
  }

  .mirror-container {
    flex: 1;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.5rem;
    align-items: flex-start;
    justify-content: center;
  }

  @media (max-width: 768px) {
    .mirror-container {
      flex-direction: column;
      align-items: center;
    }
  }

  .mirror-panel {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    width: calc(50% - 0.5rem);
    max-width: 400px;
    aspect-ratio: 1;
  }

  @media (max-width: 768px) {
    .mirror-panel {
      width: 100%;
      max-width: 400px;
    }
  }

  .game-number-label {
    font-size: 0.75rem;
    color: #666;
    text-align: center;
    padding: 0.25rem;
    background: #222;
    border-radius: 0.25rem 0.25rem 0 0;
  }

  .mirror-footer {
    display: flex;
    justify-content: center;
    padding: 0.75rem;
    background: #111;
  }

  .back-btn {
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
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

export function MirrorScreen() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const hasNamespace = settings.namespace.trim().length > 0

  const game1 = useGameState(settings.namespace, settings.mirror1Game)
  const game2 = useGameState(settings.namespace, settings.mirror2Game)

  if (!hasNamespace) {
    return (
      <div className="mirror-screen">
        <div className="mirror-header">
          <span className="mirror-title">Mirror Mode</span>
        </div>
        <div className="no-namespace">
          <div className="no-namespace-title">No Namespace Configured</div>
          <div>Go to Settings to enter your namespace</div>
          <button className="settings-link" onClick={() => navigate('/settings')}>
            Open Settings
          </button>
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

  return (
    <div className="mirror-screen">
      <div className="mirror-header">
        <span className="mirror-title">Mirror Mode</span>
        <span className="namespace-display">{settings.namespace}</span>
      </div>

      <div className="mirror-container">
        <div className="mirror-panel">
          <div className="game-number-label">Game {settings.mirror1Game}</div>
          <GameDisplay
            state={game1.state}
            loading={game1.loading}
            error={game1.error}
            gameNumber={settings.mirror1Game}
          />
        </div>

        <div className="mirror-panel">
          <div className="game-number-label">Game {settings.mirror2Game}</div>
          <GameDisplay
            state={game2.state}
            loading={game2.loading}
            error={game2.error}
            gameNumber={settings.mirror2Game}
          />
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
