import { ref, onValue, off, push, set, update } from 'firebase/database'
import { database, ensureAuth, sanitizeEmail } from './firebase'
import { Tournament, BracketNode } from '../types'

// Firebase tournament data structure
export interface FirebaseTournament {
  name: string
  type: 'singles' | 'doubles'
  format: 'single_elimination' | 'double_elimination'
  bestOf: number
  status: 'setup' | 'active' | 'complete'
  playerIds: string[]
  bracket: BracketNode[]
  createdAt: number
  winnerId?: string
  archived: boolean
}

// Subscribe to all tournaments for a namespace
export function subscribeTournaments(
  namespace: string,
  callback: (tournaments: Tournament[]) => void
): () => void {
  const sanitized = sanitizeEmail(namespace)
  const path = `tournaments/${sanitized}`
  const tournamentsRef = ref(database, path)

  console.log(`Subscribing to tournaments: ${path}`)

  onValue(
    tournamentsRef,
    (snapshot) => {
      const data = snapshot.val()
      console.log(`Tournaments data received for ${path}:`, data)

      if (!data) {
        callback([])
        return
      }

      // Convert Firebase object to array with IDs
      const tournaments: Tournament[] = Object.entries(data).map(([id, tournament]) => {
        const t = tournament as FirebaseTournament
        return {
          id,
          name: t.name,
          type: t.type,
          format: t.format,
          bestOf: t.bestOf,
          status: t.status,
          playerIds: t.playerIds || [],
          bracket: t.bracket || [],
          createdAt: new Date(t.createdAt),
          winnerId: t.winnerId,
          archived: t.archived || false,
        }
      })

      // Sort by createdAt descending (newest first)
      tournaments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      callback(tournaments)
    },
    (error) => {
      console.error(`Error reading tournaments ${path}:`, error)
      callback([])
    }
  )

  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribing from tournaments: ${path}`)
    off(tournamentsRef)
  }
}

// Subscribe to a single tournament
export function subscribeTournament(
  namespace: string,
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
): () => void {
  const sanitized = sanitizeEmail(namespace)
  const path = `tournaments/${sanitized}/${tournamentId}`
  const tournamentRef = ref(database, path)

  console.log(`Subscribing to tournament: ${path}`)

  onValue(
    tournamentRef,
    (snapshot) => {
      const data = snapshot.val()
      console.log(`Tournament data received for ${path}:`, data)

      if (!data) {
        callback(null)
        return
      }

      const t = data as FirebaseTournament
      callback({
        id: tournamentId,
        name: t.name,
        type: t.type,
        format: t.format,
        bestOf: t.bestOf,
        status: t.status,
        playerIds: t.playerIds || [],
        bracket: t.bracket || [],
        createdAt: new Date(t.createdAt),
        winnerId: t.winnerId,
        archived: t.archived || false,
      })
    },
    (error) => {
      console.error(`Error reading tournament ${path}:`, error)
      callback(null)
    }
  )

  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribing from tournament: ${path}`)
    off(tournamentRef)
  }
}

// Helper to strip undefined values from an object (Firebase doesn't allow undefined)
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// Create a new tournament
export async function createTournament(namespace: string, tournament: Tournament): Promise<string> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `tournaments/${sanitized}`
  const tournamentsRef = ref(database, path)

  const newTournamentRef = push(tournamentsRef)
  const tournamentData = stripUndefined({
    name: tournament.name,
    type: tournament.type,
    format: tournament.format,
    bestOf: tournament.bestOf,
    status: tournament.status,
    playerIds: tournament.playerIds,
    bracket: tournament.bracket,
    createdAt: tournament.createdAt.getTime(),
    archived: false,
    winnerId: tournament.winnerId,
  })

  await set(newTournamentRef, tournamentData)
  console.log(`Created tournament ${tournament.name} with ID ${newTournamentRef.key}`)

  return newTournamentRef.key!
}

// Update an existing tournament
export async function updateTournament(
  namespace: string,
  tournamentId: string,
  updates: Partial<Tournament>
): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `tournaments/${sanitized}/${tournamentId}`
  const tournamentRef = ref(database, path)

  // Convert Date to timestamp if present
  const firebaseUpdates: Partial<FirebaseTournament> = {}
  if (updates.name !== undefined) firebaseUpdates.name = updates.name
  if (updates.type !== undefined) firebaseUpdates.type = updates.type
  if (updates.format !== undefined) firebaseUpdates.format = updates.format
  if (updates.bestOf !== undefined) firebaseUpdates.bestOf = updates.bestOf
  if (updates.status !== undefined) firebaseUpdates.status = updates.status
  if (updates.playerIds !== undefined) firebaseUpdates.playerIds = updates.playerIds
  if (updates.bracket !== undefined) firebaseUpdates.bracket = updates.bracket
  if (updates.winnerId !== undefined) firebaseUpdates.winnerId = updates.winnerId
  if (updates.archived !== undefined) firebaseUpdates.archived = updates.archived
  if (updates.createdAt !== undefined) firebaseUpdates.createdAt = updates.createdAt.getTime()

  await update(tournamentRef, firebaseUpdates)
  console.log(`Updated tournament ${tournamentId}`)
}

// Archive a tournament
export async function archiveTournament(namespace: string, tournamentId: string): Promise<void> {
  await updateTournament(namespace, tournamentId, { archived: true })
  console.log(`Archived tournament ${tournamentId}`)
}
