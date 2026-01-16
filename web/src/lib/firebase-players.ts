import { ref, onValue, off, push, set, remove, update, increment } from 'firebase/database'
import { database, ensureAuth, sanitizeEmail } from './firebase'
import { Player } from '../types'

// Firebase player data structure
export interface FirebasePlayer {
  name: string
  createdAt: number
  archived: boolean
  // Per-game stats (any game)
  wins: number
  losses: number
  // Tournament champion stats (won the whole tournament)
  finalsWins: number
  finalsLosses: number
  // Team per-game stats
  teamWins: number
  teamLosses: number
  // Team tournament champion stats
  teamFinalsWins: number
  teamFinalsLosses: number
  // Legacy fields (kept for backwards compatibility)
  tournamentWins?: number
  teamTournamentWins?: number
}

// Subscribe to players for a namespace
export function subscribeToPlayers(
  namespace: string,
  callback: (players: Player[]) => void
): () => void {
  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}`
  const playersRef = ref(database, path)

  console.log(`Subscribing to players: ${path}`)

  onValue(
    playersRef,
    (snapshot) => {
      const data = snapshot.val()
      console.log(`Players data received for ${path}:`, data)

      if (!data) {
        callback([])
        return
      }

      // Convert Firebase object to array with IDs
      const players: Player[] = Object.entries(data).map(([id, player]) => {
        const p = player as FirebasePlayer
        return {
          id,
          name: p.name,
          createdAt: new Date(p.createdAt),
          archived: p.archived || false,
          wins: p.wins || 0,
          losses: p.losses || 0,
          // Use new fields, fall back to legacy fields for backwards compat
          finalsWins: p.finalsWins ?? p.tournamentWins ?? 0,
          finalsLosses: p.finalsLosses || 0,
          teamWins: p.teamWins || 0,
          teamLosses: p.teamLosses || 0,
          teamFinalsWins: p.teamFinalsWins ?? p.teamTournamentWins ?? 0,
          teamFinalsLosses: p.teamFinalsLosses || 0,
        }
      })

      // Sort by name
      players.sort((a, b) => a.name.localeCompare(b.name))
      callback(players)
    },
    (error) => {
      console.error(`Error reading players ${path}:`, error)
      callback([])
    }
  )

  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribing from players: ${path}`)
    off(playersRef)
  }
}

// Add a new player
export async function addPlayer(namespace: string, name: string): Promise<string> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}`
  const playersRef = ref(database, path)

  const newPlayerRef = push(playersRef)
  const playerData: FirebasePlayer = {
    name: name.trim(),
    createdAt: Date.now(),
    archived: false,
    wins: 0,
    losses: 0,
    finalsWins: 0,
    finalsLosses: 0,
    teamWins: 0,
    teamLosses: 0,
    teamFinalsWins: 0,
    teamFinalsLosses: 0,
  }

  await set(newPlayerRef, playerData)
  console.log(`Added player ${name} with ID ${newPlayerRef.key}`)

  return newPlayerRef.key!
}

// Delete a player
export async function deletePlayer(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await remove(playerRef)
  console.log(`Deleted player ${playerId}`)
}

// Archive a player (soft delete)
export async function archivePlayer(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}/archived`
  const archivedRef = ref(database, path)

  await set(archivedRef, true)
  console.log(`Archived player ${playerId}`)
}

// Record a game win for a player
export async function recordWin(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    wins: increment(1)
  })
  console.log(`Recorded win for player ${playerId}`)
}

// Record a game loss for a player
export async function recordLoss(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    losses: increment(1)
  })
  console.log(`Recorded loss for player ${playerId}`)
}

// Record a finals win for a player (tournament champion)
export async function recordFinalsWin(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    finalsWins: increment(1)
  })
  console.log(`Recorded finals win for player ${playerId}`)
}

// Record a finals loss for a player (tournament runner-up)
export async function recordFinalsLoss(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    finalsLosses: increment(1)
  })
  console.log(`Recorded finals loss for player ${playerId}`)
}

// Legacy alias for backwards compatibility
export const recordTournamentWin = recordFinalsWin

// Record game result (win for winner, loss for loser)
export async function recordGameResult(
  namespace: string,
  winnerId: string,
  loserId: string
): Promise<void> {
  await Promise.all([
    recordWin(namespace, winnerId),
    recordLoss(namespace, loserId)
  ])
}

// Undo a game win for a player
export async function undoWin(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    wins: increment(-1)
  })
  console.log(`Undid win for player ${playerId}`)
}

// Undo a game loss for a player
export async function undoLoss(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    losses: increment(-1)
  })
  console.log(`Undid loss for player ${playerId}`)
}

// Undo game result (remove win from old winner, remove loss from old loser)
export async function undoGameResult(
  namespace: string,
  winnerId: string,
  loserId: string
): Promise<void> {
  await Promise.all([
    undoWin(namespace, winnerId),
    undoLoss(namespace, loserId)
  ])
}

// Record a team game win for a player
export async function recordTeamWin(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    teamWins: increment(1)
  })
  console.log(`Recorded team win for player ${playerId}`)
}

// Record a team game loss for a player
export async function recordTeamLoss(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    teamLosses: increment(1)
  })
  console.log(`Recorded team loss for player ${playerId}`)
}

// Record a team finals win for a player (team tournament champion)
export async function recordTeamFinalsWin(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    teamFinalsWins: increment(1)
  })
  console.log(`Recorded team finals win for player ${playerId}`)
}

// Record a team finals loss for a player (team tournament runner-up)
export async function recordTeamFinalsLoss(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    teamFinalsLosses: increment(1)
  })
  console.log(`Recorded team finals loss for player ${playerId}`)
}

// Legacy alias for backwards compatibility
export const recordTeamTournamentWin = recordTeamFinalsWin

// Record team game result (win for winning team players, loss for losing team players)
export async function recordTeamGameResult(
  namespace: string,
  winnerPlayerIds: string[],
  loserPlayerIds: string[]
): Promise<void> {
  await Promise.all([
    ...winnerPlayerIds.map(id => recordTeamWin(namespace, id)),
    ...loserPlayerIds.map(id => recordTeamLoss(namespace, id))
  ])
}

// Undo a team game win for a player
export async function undoTeamWin(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    teamWins: increment(-1)
  })
  console.log(`Undid team win for player ${playerId}`)
}

// Undo a team game loss for a player
export async function undoTeamLoss(namespace: string, playerId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `players/${sanitized}/${playerId}`
  const playerRef = ref(database, path)

  await update(playerRef, {
    teamLosses: increment(-1)
  })
  console.log(`Undid team loss for player ${playerId}`)
}

// Undo team game result
export async function undoTeamGameResult(
  namespace: string,
  winnerPlayerIds: string[],
  loserPlayerIds: string[]
): Promise<void> {
  await Promise.all([
    ...winnerPlayerIds.map(id => undoTeamWin(namespace, id)),
    ...loserPlayerIds.map(id => undoTeamLoss(namespace, id))
  ])
}

// Record team finals win for all players on winning team
export async function recordTeamFinalsWinForTeam(
  namespace: string,
  playerIds: string[]
): Promise<void> {
  await Promise.all(playerIds.map(id => recordTeamFinalsWin(namespace, id)))
}

// Record team finals loss for all players on runner-up team
export async function recordTeamFinalsLossForTeam(
  namespace: string,
  playerIds: string[]
): Promise<void> {
  await Promise.all(playerIds.map(id => recordTeamFinalsLoss(namespace, id)))
}

// Legacy alias for backwards compatibility
export const recordTeamTournamentWinForTeam = recordTeamFinalsWinForTeam
