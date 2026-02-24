
const STORAGE_KEY = 'washers-settings'

export interface Settings {
  namespace: string   // Base namespace (e.g., "casey@manion.com")
  gameNumber: number  // Game number (0-99)
}

function getDefaultNamespace(): string {
  return `gobeavs.${Date.now()}`
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
      const settings = { ...defaultSettings, ...parsed }
      // Generate default namespace if empty
      if (!settings.namespace) {
        settings.namespace = getDefaultNamespace()
        saveSettings(settings)
      }
      return settings
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  // No stored settings - generate default namespace and save
  const settings = { ...defaultSettings, namespace: getDefaultNamespace() }
  saveSettings(settings)
  return settings
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
    gameNumber: Math.max(0, Math.min(99, newGameNumber)),
  }
  saveSettings(newSettings)
  return newSettings
}

