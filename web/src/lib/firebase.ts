import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'

// Firebase configuration
// For production, these should come from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
export const auth = getAuth(app)

// Sign in anonymously (required for database access with our rules)
let authPromise: Promise<void> | null = null

export async function ensureAuth(): Promise<void> {
  if (!authPromise) {
    authPromise = signInAnonymously(auth)
      .then(() => {
        console.log('Signed in anonymously')
      })
      .catch((error) => {
        console.error('Anonymous auth failed:', error)
        authPromise = null
        throw error
      })
  }
  return authPromise
}

// Helper to sanitize email for Firebase path
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .replace(/\./g, '_')
    .replace(/\$/g, '_')
    .replace(/#/g, '_')
    .replace(/\[/g, '_')
    .replace(/\]/g, '_')
    .replace(/\//g, '_')
}

// Game state from Firebase
export interface FirebaseGameState {
  player1Score: number
  player2Score: number
  player1Games: number
  player2Games: number
  player1Rounds: number
  player2Rounds: number
  player1Color: string
  player2Color: string
  player1Name: string
  player2Name: string
  format: number
  updatedAt: number
}

// Subscribe to game state
export function subscribeToGame(
  namespace: string,
  table: number,
  callback: (state: FirebaseGameState | null) => void
): () => void {
  const sanitized = sanitizeEmail(namespace)
  const path = `games/${sanitized}/${table}/current`
  const gameRef = ref(database, path)

  console.log(`Subscribing to: ${path}`)

  onValue(
    gameRef,
    (snapshot) => {
      const data = snapshot.val()
      console.log(`Data received for ${path}:`, data)
      callback(data)
    },
    (error) => {
      console.error(`Error reading ${path}:`, error)
      callback(null)
    }
  )

  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribing from: ${path}`)
    off(gameRef)
  }
}
