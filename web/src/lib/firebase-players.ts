import { ref, onValue, off, push, set, remove } from 'firebase/database'
import { database, ensureAuth, sanitizeEmail } from './firebase'
import { Player } from '../types'

// Firebase player data structure
export interface FirebasePlayer {
  name: string
  createdAt: number
  archived: boolean
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
