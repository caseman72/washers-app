import { useState, useEffect } from 'react'
import { Player } from '../types'
import { ensureAuth } from '../lib/firebase'
import {
  subscribeToPlayers,
  addPlayer as firebaseAddPlayer,
  deletePlayer as firebaseDeletePlayer,
  recordGameResult as firebaseRecordGameResult,
  undoGameResult as firebaseUndoGameResult,
  recordTournamentGameResult as firebaseRecordTournamentGameResult,
  undoTournamentGameResult as firebaseUndoTournamentGameResult,
  recordFinalsWin as firebaseRecordFinalsWin,
  recordFinalsLoss as firebaseRecordFinalsLoss,
  undoFinalsWin as firebaseUndoFinalsWin,
  undoFinalsLoss as firebaseUndoFinalsLoss,
  recordTeamGameResult as firebaseRecordTeamGameResult,
  undoTeamGameResult as firebaseUndoTeamGameResult,
  recordTeamFinalsWinForTeam as firebaseRecordTeamFinalsWinForTeam,
  recordTeamFinalsLossForTeam as firebaseRecordTeamFinalsLossForTeam,
  undoTeamFinalsWinForTeam as firebaseUndoTeamFinalsWinForTeam,
  undoTeamFinalsLossForTeam as firebaseUndoTeamFinalsLossForTeam,
} from '../lib/firebase-players'

export interface UsePlayersResult {
  players: Player[]
  loading: boolean
  error: string | null
  addPlayer: (name: string) => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
  // Non-tournament game tracking (game 0, 65-99)
  recordGameResult: (winnerId: string, loserId: string) => Promise<void>
  undoGameResult: (winnerId: string, loserId: string) => Promise<void>
  // Singles tournament match tracking
  recordTournamentGameResult: (winnerId: string, loserId: string) => Promise<void>
  undoTournamentGameResult: (winnerId: string, loserId: string) => Promise<void>
  // Doubles tournament match tracking
  recordTeamGameResult: (winnerPlayerIds: string[], loserPlayerIds: string[]) => Promise<void>
  undoTeamGameResult: (winnerPlayerIds: string[], loserPlayerIds: string[]) => Promise<void>
  // Singles finals (tournament champion) tracking
  recordFinalsWin: (playerId: string) => Promise<void>
  recordFinalsLoss: (playerId: string) => Promise<void>
  undoFinalsWin: (playerId: string) => Promise<void>
  undoFinalsLoss: (playerId: string) => Promise<void>
  // Doubles finals (tournament champion) tracking
  recordTeamFinalsWin: (playerIds: string[]) => Promise<void>
  recordTeamFinalsLoss: (playerIds: string[]) => Promise<void>
  undoTeamFinalsWin: (playerIds: string[]) => Promise<void>
  undoTeamFinalsLoss: (playerIds: string[]) => Promise<void>
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

  const recordTournamentGameResult = async (winnerId: string, loserId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseRecordTournamentGameResult(namespace, winnerId, loserId)
  }

  const undoTournamentGameResult = async (winnerId: string, loserId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUndoTournamentGameResult(namespace, winnerId, loserId)
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

  const undoFinalsWin = async (playerId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUndoFinalsWin(namespace, playerId)
  }

  const undoFinalsLoss = async (playerId: string) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUndoFinalsLoss(namespace, playerId)
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

  const undoTeamFinalsWin = async (playerIds: string[]) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUndoTeamFinalsWinForTeam(namespace, playerIds)
  }

  const undoTeamFinalsLoss = async (playerIds: string[]) => {
    if (!namespace.trim()) {
      throw new Error('No namespace configured')
    }
    await firebaseUndoTeamFinalsLossForTeam(namespace, playerIds)
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
    recordTournamentGameResult,
    undoTournamentGameResult,
    recordTeamGameResult,
    undoTeamGameResult,
    recordFinalsWin,
    recordFinalsLoss,
    undoFinalsWin,
    undoFinalsLoss,
    recordTeamFinalsWin,
    recordTeamFinalsLoss,
    undoTeamFinalsWin,
    undoTeamFinalsLoss,
    recordTournamentWin,
    recordTeamTournamentWin,
  }
}
