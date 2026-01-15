// Player
export interface Player {
  id: string
  name: string
  photoUrl?: string
  createdAt: Date
  archived: boolean
  wins: number
  losses: number
  tournamentWins: number
}

// Game (single match result)
export interface Game {
  id: string
  player1Id: string
  player2Id: string
  player1Score: number  // final score (0-21)
  player2Score: number
  winnerId: string
  tournamentId?: string  // null for casual play
  timestamp: Date
}

// Tournament
export interface Tournament {
  id: string
  name: string
  type: 'singles' | 'doubles'
  format: 'single_elimination' | 'double_elimination'
  bestOf: number
  status: 'setup' | 'active' | 'complete'
  playerIds: string[]
  bracket: BracketNode[]
  createdAt: Date
  winnerId?: string
}

// Bracket node (single match in a tournament)
export interface BracketNode {
  id: string
  round: number
  position: number
  bracket: 'winners' | 'losers'
  player1Id?: string
  player2Id?: string
  winnerId?: string
  gameId?: string
  nextMatchId?: string
  loserNextMatchId?: string  // for double elimination
  isByeMatch?: boolean  // LB match that only receives 1 player (other feeder was a BYE)
}

// Session state (for scoreboard)
export interface GameSession {
  player1Score: number
  player2Score: number
  player1Games: number
  player2Games: number
}
