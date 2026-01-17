import { ref, onValue, off, push, set, update, remove } from 'firebase/database'
import { database, ensureAuth, sanitizeEmail, clearTournamentGames } from './firebase'
import { Tournament, BracketNode, Team } from '../types'

// Firebase tournament data structure
export interface FirebaseTournament {
  name: string
  type: 'singles' | 'doubles'
  format: 'single_elimination' | 'double_elimination'
  bestOf: number
  status: 'setup' | 'active' | 'complete'
  playerIds: string[]
  teams?: Team[]
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
          teams: t.teams,
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
        teams: t.teams,
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

  // Clear all 64 tournament game slots first to wipe stale data from previous tournaments
  await clearTournamentGames(namespace)

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
    teams: tournament.teams,
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

// Delete a tournament permanently
export async function deleteTournament(namespace: string, tournamentId: string): Promise<void> {
  await ensureAuth()

  const sanitized = sanitizeEmail(namespace)
  const path = `tournaments/${sanitized}/${tournamentId}`
  const tournamentRef = ref(database, path)

  await remove(tournamentRef)
  console.log(`Deleted tournament ${tournamentId}`)
}

// Compute game numbers from bracket structure (same algorithm as BracketScreen)
// Returns a Map from matchId to gameNumber
function computeGameNumbers(bracket: BracketNode[]): Map<string, number> {
  const numbers = new Map<string, number>()
  let gameNum = 1

  // Helper: check if a match is structurally a BYE
  const isStructuralBye = (match: BracketNode) => {
    if (match.isByeMatch) return true
    if (match.round === 1 && match.bracket === 'winners') {
      const hasP1 = !!match.player1Id
      const hasP2 = !!match.player2Id
      return (hasP1 && !hasP2) || (!hasP1 && hasP2)
    }
    return false
  }

  // Helper: check if match is immediately playable
  const isImmediatelyPlayable = (match: BracketNode) => {
    if (isStructuralBye(match)) return false
    if (match.round === 1 && match.bracket === 'winners') return true
    const feeders = bracket.filter(m => m.nextMatchId === match.id)
    if (feeders.length === 0) return false
    return feeders.every(f => isStructuralBye(f))
  }

  // Get matches by round and bracket type
  const getMatchesByRound = (bracketType: 'winners' | 'losers') => {
    const rounds = new Map<number, BracketNode[]>()
    bracket
      .filter(m => m.bracket === bracketType && m.id !== 'grand-finals' && m.id !== 'grand-finals-2')
      .forEach(match => {
        const round = match.round
        if (!rounds.has(round)) rounds.set(round, [])
        rounds.get(round)!.push(match)
      })
    return rounds
  }

  const winnersRounds = getMatchesByRound('winners')
  const losersRounds = getMatchesByRound('losers')

  const wbRoundNums = Array.from(winnersRounds.keys()).sort((a, b) => a - b)
  const lbRoundNums = Array.from(losersRounds.keys()).sort((a, b) => a - b)
  const maxRound = Math.max(
    wbRoundNums.length > 0 ? wbRoundNums[wbRoundNums.length - 1] : 0,
    lbRoundNums.length > 0 ? lbRoundNums[lbRoundNums.length - 1] : 0
  )

  const finalsGame1 = bracket.find(m => m.id === 'grand-finals')
  const finalsGame2 = bracket.find(m => m.id === 'grand-finals-2')

  // Number games by round
  for (let round = 1; round <= maxRound; round++) {
    const wbMatches = winnersRounds.get(round) || []
    const lbMatches = losersRounds.get(round) || []
    const allMatches = [...wbMatches, ...lbMatches]

    const immediate: BracketNode[] = []
    const waiting: BracketNode[] = []

    allMatches.forEach(match => {
      if (isStructuralBye(match)) return
      if (isImmediatelyPlayable(match)) {
        immediate.push(match)
      } else {
        waiting.push(match)
      }
    })

    immediate.sort((a, b) => a.position - b.position)
    waiting.sort((a, b) => a.position - b.position)

    immediate.forEach(match => numbers.set(match.id, gameNum++))
    waiting.forEach(match => numbers.set(match.id, gameNum++))

    if (round === maxRound && finalsGame1) {
      numbers.set(finalsGame1.id, gameNum++)
    }
  }

  if (finalsGame2) {
    numbers.set(finalsGame2.id, gameNum++)
  }

  return numbers
}

// Check if a specific game number is complete in the active tournament
// Returns true if the game has a winner set in the bracket
export async function checkGameComplete(namespace: string, gameNumber: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sanitized = sanitizeEmail(namespace)
    const path = `tournaments/${sanitized}`
    const tournamentsRef = ref(database, path)

    onValue(
      tournamentsRef,
      (snapshot) => {
        const data = snapshot.val()
        off(tournamentsRef)

        if (!data) {
          resolve(false)
          return
        }

        // Find the active tournament
        const activeTournament = Object.values(data).find((tournament: any) => {
          const archived = tournament.archived || false
          const status = tournament.status || ''
          return !archived && (status === 'active' || status === 'setup')
        }) as any

        if (!activeTournament || !activeTournament.bracket) {
          resolve(false)
          return
        }

        // Compute game numbers from bracket structure
        const gameNumbers = computeGameNumbers(activeTournament.bracket)

        // Find the match with this game number
        let matchId: string | null = null
        for (const [id, num] of gameNumbers) {
          if (num === gameNumber) {
            matchId = id
            break
          }
        }

        if (!matchId) {
          resolve(false)
          return
        }

        // Find the match and check if it has a winner
        const match = activeTournament.bracket.find((node: any) => node.id === matchId)
        resolve(match?.winnerId ? true : false)
      },
      (error) => {
        console.error(`Error checking game complete: ${error}`)
        off(tournamentsRef)
        resolve(false)
      },
      { onlyOnce: true }
    )
  })
}

// Check if there's an active tournament for a namespace
export async function checkActiveTournament(namespace: string): Promise<boolean> {
  return new Promise((resolve) => {
    const sanitized = sanitizeEmail(namespace)
    const path = `tournaments/${sanitized}`
    const tournamentsRef = ref(database, path)

    onValue(
      tournamentsRef,
      (snapshot) => {
        const data = snapshot.val()
        off(tournamentsRef)

        if (!data) {
          resolve(false)
          return
        }

        // Check each tournament for an active one
        const hasActive = Object.values(data).some((tournament: any) => {
          const archived = tournament.archived || false
          const status = tournament.status || ''
          return !archived && (status === 'active' || status === 'setup')
        })

        resolve(hasActive)
      },
      (error) => {
        console.error(`Error checking tournaments: ${error}`)
        off(tournamentsRef)
        resolve(false)
      },
      { onlyOnce: true }
    )
  })
}
