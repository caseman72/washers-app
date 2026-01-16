import { useState, useEffect } from 'react'
import { Tournament } from '../types'
import { ensureAuth } from '../lib/firebase'
import {
  subscribeTournaments,
  subscribeTournament,
  createTournament as firebaseCreateTournament,
  updateTournament as firebaseUpdateTournament,
  archiveTournament as firebaseArchiveTournament,
  deleteTournament as firebaseDeleteTournament,
} from '../lib/firebase-tournaments'

export interface UseTournamentsResult {
  tournaments: Tournament[]
  loading: boolean
  error: string | null
  createTournament: (tournament: Tournament) => Promise<string>
  updateTournament: (tournamentId: string, updates: Partial<Tournament>) => Promise<void>
  archiveTournament: (tournamentId: string) => Promise<void>
}

export function useTournaments(namespace: string): UseTournamentsResult {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!namespace.trim()) {
      setLoading(false)
      setError('No namespace configured')
      setTournaments([])
      return
    }

    setLoading(true)
    setError(null)

    let unsubscribe: (() => void) | null = null

    // Ensure we're authenticated before subscribing
    ensureAuth()
      .then(() => {
        unsubscribe = subscribeTournaments(namespace, (data) => {
          setTournaments(data)
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

  const createTournament = async (tournament: Tournament) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    return await firebaseCreateTournament(namespace, tournament)
  }

  const updateTournament = async (tournamentId: string, updates: Partial<Tournament>) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUpdateTournament(namespace, tournamentId, updates)
  }

  const archiveTournament = async (tournamentId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseArchiveTournament(namespace, tournamentId)
  }

  return { tournaments, loading, error, createTournament, updateTournament, archiveTournament }
}

// Hook for subscribing to a single tournament
export interface UseTournamentResult {
  tournament: Tournament | null
  loading: boolean
  error: string | null
  updateTournament: (updates: Partial<Tournament>) => Promise<void>
  archiveTournament: () => Promise<void>
  deleteTournament: () => Promise<void>
}

export function useTournament(namespace: string, tournamentId: string | undefined): UseTournamentResult {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!namespace.trim() || !tournamentId) {
      setLoading(false)
      setError(!namespace.trim() ? 'No namespace configured' : null)
      setTournament(null)
      return
    }

    setLoading(true)
    setError(null)

    let unsubscribe: (() => void) | null = null

    // Ensure we're authenticated before subscribing
    ensureAuth()
      .then(() => {
        unsubscribe = subscribeTournament(namespace, tournamentId, (data) => {
          setTournament(data)
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
  }, [namespace, tournamentId])

  const updateTournament = async (updates: Partial<Tournament>) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    if (!tournamentId) {
      throw new Error('No tournament ID')
    }
    await firebaseUpdateTournament(namespace, tournamentId, updates)
  }

  const archiveTournament = async () => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    if (!tournamentId) {
      throw new Error('No tournament ID')
    }
    await firebaseArchiveTournament(namespace, tournamentId)
  }

  const deleteTournament = async () => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    if (!tournamentId) {
      throw new Error('No tournament ID')
    }
    await firebaseDeleteTournament(namespace, tournamentId)
  }

  return { tournament, loading, error, updateTournament, archiveTournament, deleteTournament }
}
