import { useState, useEffect } from 'react'
import { ensureAuth, subscribeToGame, FirebaseGameState } from '../lib/firebase'

export interface UseGameStateResult {
  state: FirebaseGameState | null
  loading: boolean
  error: string | null
}

export function useGameState(namespace: string, table: number): UseGameStateResult {
  const [state, setState] = useState<FirebaseGameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!namespace.trim()) {
      setLoading(false)
      setError('No namespace configured')
      return
    }

    setLoading(true)
    setError(null)

    let unsubscribe: (() => void) | null = null

    // Ensure we're authenticated before subscribing
    ensureAuth()
      .then(() => {
        unsubscribe = subscribeToGame(namespace, table, (data) => {
          setState(data)
          setLoading(false)
          if (!data) {
            setError('No game data found')
          } else {
            setError(null)
          }
        })
      })
      .catch((err) => {
        setError(`Auth failed: ${err.message}`)
        setLoading(false)
      })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [namespace, table])

  return { state, loading, error }
}
