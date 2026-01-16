import { useState, useEffect } from 'react'
import { Player } from '../types'
import { ensureAuth } from '../lib/firebase'
import {
  subscribeToPlayers,
  addPlayer as firebaseAddPlayer,
  deletePlayer as firebaseDeletePlayer,
  recordGameResult as firebaseRecordGameResult,
  undoGameResult as firebaseUndoGameResult,
  recordFinalsWin as firebaseRecordFinalsWin,
  recordFinalsLoss as firebaseRecordFinalsLoss,
  recordTeamGameResult as firebaseRecordTeamGameResult,
  undoTeamGameResult as firebaseUndoTeamGameResult,
  recordTeamFinalsWinForTeam as firebaseRecordTeamFinalsWinForTeam,
  recordTeamFinalsLossForTeam as firebaseRecordTeamFinalsLossForTeam,
} from '../lib/firebase-players'

export interface UsePlayersResult {
  players: Player[]
  loading: boolean
  error: string | null
  addPlayer: (name: string) => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
  recordGameResult: (winnerId: string, loserId: string) => Promise<void>
  undoGameResult: (winnerId: string, loserId: string) => Promise<void>
  // Finals (tournament champion) tracking
  recordFinalsWin: (playerId: string) => Promise<void>
  recordFinalsLoss: (playerId: string) => Promise<void>
  recordTeamFinalsWin: (playerIds: string[]) => Promise<void>
  recordTeamFinalsLoss: (playerIds: string[]) => Promise<void>
  // Team game tracking
  recordTeamGameResult: (winnerPlayerIds: string[], loserPlayerIds: string[]) => Promise<void>
  undoTeamGameResult: (winnerPlayerIds: string[], loserPlayerIds: string[]) => Promise<void>
  // Legacy aliases
  recordTournamentWin: (playerId: string) => Promise<void>
  recordTeamTournamentWin: (playerIds: string[]) => Promise<void>
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

  const recordGameResult = async (winnerId: string, loserId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseRecordGameResult(namespace, winnerId, loserId)
  }

  const undoGameResult = async (winnerId: string, loserId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUndoGameResult(namespace, winnerId, loserId)
  }

  const recordFinalsWin = async (playerId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseRecordFinalsWin(namespace, playerId)
  }

  const recordFinalsLoss = async (playerId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseRecordFinalsLoss(namespace, playerId)
  }

  const recordTeamFinalsWin = async (playerIds: string[]) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseRecordTeamFinalsWinForTeam(namespace, playerIds)
  }

  const recordTeamFinalsLoss = async (playerIds: string[]) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseRecordTeamFinalsLossForTeam(namespace, playerIds)
  }

  const recordTeamGameResult = async (winnerPlayerIds: string[], loserPlayerIds: string[]) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseRecordTeamGameResult(namespace, winnerPlayerIds, loserPlayerIds)
  }

  const undoTeamGameResult = async (winnerPlayerIds: string[], loserPlayerIds: string[]) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUndoTeamGameResult(namespace, winnerPlayerIds, loserPlayerIds)
  }

  // Legacy aliases
  const recordTournamentWin = recordFinalsWin
  const recordTeamTournamentWin = recordTeamFinalsWin

  return {
    players,
    loading,
    error,
    addPlayer,
    deletePlayer,
    recordGameResult,
    undoGameResult,
    recordFinalsWin,
    recordFinalsLoss,
    recordTeamFinalsWin,
    recordTeamFinalsLoss,
    recordTeamGameResult,
    undoTeamGameResult,
    recordTournamentWin,
    recordTeamTournamentWin,
  }
}
