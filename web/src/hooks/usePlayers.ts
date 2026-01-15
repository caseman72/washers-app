import { useState, useEffect } from 'react'
import { Player } from '../types'
import { ensureAuth } from '../lib/firebase'
import {
  subscribeToPlayers,
  addPlayer as firebaseAddPlayer,
  deletePlayer as firebaseDeletePlayer,
} from '../lib/firebase-players'

export interface UsePlayersResult {
  players: Player[]
  loading: boolean
  error: string | null
  addPlayer: (name: string) => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
}

export function usePlayers(namespace: string): UsePlayersResult {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!namespace.trim()) {
      setLoading(false)
      setError('No namespace configured')
      setPlayers([])
      return
    }

    setLoading(true)
    setError(null)

    let unsubscribe: (() => void) | null = null

    // Ensure we're authenticated before subscribing
    ensureAuth()
      .then(() => {
        unsubscribe = subscribeToPlayers(namespace, (data) => {
          setPlayers(data)
          setLoading(false)
          setError(null)
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
  }, [namespace])

  const addPlayer = async (name: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseAddPlayer(namespace, name)
  }

  const deletePlayer = async (playerId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseDeletePlayer(namespace, playerId)
  }

  return { players, loading, error, addPlayer, deletePlayer }
}
