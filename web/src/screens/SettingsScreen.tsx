import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'washers-settings'

export interface Settings {
  namespace: string      // Base namespace (e.g., "casey@manion.com")
  gameNamespace: string  // Full namespace with game (e.g., "casey@manion.com/2")
}

const defaultSettings: Settings = {
  namespace: '',
  gameNamespace: '',
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

// Extract base namespace (strip /game suffix if present)
// e.g., "casey@manion.com/2" -> "casey@manion.com"
export function getBaseNamespace(ns: string): string {
  const match = ns.match(/^(.+?)\/\d+$/)
  return match ? match[1] : ns
}

// Extract game number from namespace
// e.g., "casey@manion.com/2" -> 2
export function getGameNumber(ns: string): number {
  const match = ns.match(/\/(\d+)$/)
  return match ? parseInt(match[1], 10) : 1
}

// Update namespace and sync to gameNamespace (preserving game number)
export function updateNamespace(newNamespace: string): Settings {
  const settings = loadSettings()
  const gameNumber = getGameNumber(settings.gameNamespace)
  const newGameNamespace = newNamespace ? `${newNamespace}/${gameNumber}` : ''
  const newSettings = {
    namespace: newNamespace,
    gameNamespace: newGameNamespace,
  }
  saveSettings(newSettings)
  return newSettings
}

// Update gameNamespace and sync to namespace (extracting base)
export function updateGameNamespace(newGameNamespace: string): Settings {
  const newNamespace = getBaseNamespace(newGameNamespace)
  const newSettings = {
    namespace: newNamespace,
    gameNamespace: newGameNamespace,
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

  const handleNamespaceChange = (value: string) => {
    const newSettings = updateNamespace(value)
    setSettings(newSettings)
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
          onChange={(e) => handleNamespaceChange(e.target.value)}
        />
        <div className="settings-hint">Your Firebase namespace (email only)</div>
      </div>

      <button className="back-btn" onClick={() => navigate('/')}>
        Back to Menu
      </button>

      <style>{styles}</style>
    </div>
  )
}
