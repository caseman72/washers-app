import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'washers-settings'

export interface Settings {
  namespace: string   // Base namespace (e.g., "casey@manion.com")
  gameNumber: number  // Game number (0-64)
}

const defaultSettings: Settings = {
  namespace: '',
  gameNumber: 0,
}

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Migrate from old format if needed
      if ('gameNamespace' in parsed && !('gameNumber' in parsed)) {
        const gameNumber = getGameNumberFromLegacy(parsed.gameNamespace)
        const namespace = getBaseNamespaceFromLegacy(parsed.gameNamespace)
        return { namespace, gameNumber }
      }
      return { ...defaultSettings, ...parsed }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return defaultSettings
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

// Legacy migration helpers
function getBaseNamespaceFromLegacy(ns: string): string {
  const match = ns.match(/^(.+?)\/\d+$/)
  return match ? match[1] : ns
}

function getGameNumberFromLegacy(ns: string): number {
  const match = ns.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : 0
}

// Get full namespace (for Firebase paths)
export function getFullNamespace(settings: Settings): string {
  if (!settings.namespace) return ''
  return `${settings.namespace}/${settings.gameNumber}`
}

// Update base namespace only
export function updateNamespace(newNamespace: string): Settings {
  const settings = loadSettings()
  const newSettings = {
    ...settings,
    namespace: newNamespace,
  }
  saveSettings(newSettings)
  return newSettings
}

// Update game number only
export function updateGameNumber(newGameNumber: number): Settings {
  const settings = loadSettings()
  const newSettings = {
    ...settings,
    gameNumber: Math.max(0, Math.min(64, newGameNumber)),
  }
  saveSettings(newSettings)
  return newSettings
}

const styles = `
  .settings-screen {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .settings-header {
    padding: 1rem;
    background: #111;
  }

  .settings-title {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .settings-content {
    flex: 1;
    padding: 2rem;
  }

  .settings-footer {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background: #111;
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

  const handleNamespaceChange = (value: string) => {
    const newSettings = updateNamespace(value)
    setSettings(newSettings)
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <div className="settings-title">Settings</div>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-label">Namespace</div>
          <input
            type="text"
            className="settings-input"
            placeholder="casey@manion.com"
            value={settings.namespace}
            onChange={(e) => handleNamespaceChange(e.target.value)}
          />
          <div className="settings-hint">Your Firebase namespace (email only)</div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Menu
        </button>
      </div>

      <style>{styles}</style>
    </div>
  )
}
