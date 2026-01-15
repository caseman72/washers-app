import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'washers-settings'

export interface Settings {
  namespace: string
  mirror1Game: number
  mirror2Game: number
}

const defaultSettings: Settings = {
  namespace: '',
  mirror1Game: 1,
  mirror2Game: 2,
}

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return defaultSettings
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

const styles = `
  .settings-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 2rem;
  }

  .settings-header {
    font-size: 1.75rem;
    font-weight: bold;
    margin-bottom: 2rem;
  }

  .settings-section {
    margin-bottom: 2rem;
  }

  .settings-label {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #ccc;
  }

  .settings-input {
    width: 100%;
    max-width: 400px;
    padding: 1rem;
    font-size: 1rem;
    background: #333;
    border: 1px solid #555;
    border-radius: 0.5rem;
    color: white;
    outline: none;
  }

  .settings-input:focus {
    border-color: #d35400;
  }

  .settings-input::placeholder {
    color: #777;
  }

  .game-selector {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .game-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .game-label {
    min-width: 80px;
    color: #aaa;
  }

  .game-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .game-btn {
    width: 44px;
    height: 44px;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: #333;
    color: #888;
    transition: background 0.15s, color 0.15s;
  }

  .game-btn:hover {
    background: #444;
    color: #ccc;
  }

  .game-btn.selected {
    background: #d35400;
    color: white;
  }

  .back-btn {
    margin-top: auto;
    padding: 1rem 2rem;
    font-size: 1rem;
    background: #333;
    color: #aaa;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    max-width: 200px;
  }

  .back-btn:hover {
    background: #444;
    color: white;
  }

  .settings-hint {
    font-size: 0.875rem;
    color: #666;
    margin-top: 0.5rem;
  }
`

export function SettingsScreen() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  return (
    <div className="settings-screen">
      <h1 className="settings-header">Settings</h1>

      <div className="settings-section">
        <div className="settings-label">Namespace</div>
        <input
          type="text"
          className="settings-input"
          placeholder="casey@manion.com"
          value={settings.namespace}
          onChange={(e) => updateSetting('namespace', e.target.value)}
        />
        <div className="settings-hint">Your Firebase namespace (email)</div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Mirror Games</div>
        <div className="game-selector">
          <div className="game-row">
            <span className="game-label">Mirror 1</span>
            <div className="game-buttons">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  className={`game-btn ${settings.mirror1Game === n ? 'selected' : ''}`}
                  onClick={() => updateSetting('mirror1Game', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="game-row">
            <span className="game-label">Mirror 2</span>
            <div className="game-buttons">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  className={`game-btn ${settings.mirror2Game === n ? 'selected' : ''}`}
                  onClick={() => updateSetting('mirror2Game', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="settings-hint">Which games to display in Mirror mode</div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        Back to Menu
      </button>

      <style>{styles}</style>
    </div>
  )
}
