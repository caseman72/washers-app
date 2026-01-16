# Washers
---

```
      ╔═════════════╗    ╔═════════════╗     ╔═════════════╗
      ║    Watch    ║ -> ║    Phone    ║ <-> ║     Web     ║
      ╚═════════════╝    ╚═════════════╝     ╚═════════════╝
```

## Setup

### Prerequisites
- Android Studio
- Node.js (for web app)
- Firebase project

### Firebase Configuration

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in method → **Anonymous** (enable it)
3. Enable **Realtime Database** and set these rules:
   ```json
   {
     "rules": {
       "games": {
         "$email": {
           "$table": {
             "current": {
               ".read": "auth != null",
               ".write": "auth != null"
             },
             "history": {
               ".read": "auth != null",
               ".write": "auth != null"
             }
           }
         }
       },
       "players": {
         "$namespace": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       },
       "tournaments": {
         "$namespace": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
   }
   ```
4. Download `google-services.json` from Firebase Console → Project Settings → Your Apps
5. Copy to `phone/app/google-services.json`
6. Create `phone/secrets.properties` from the example:
   ```bash
   cp phone/secrets.properties.example phone/secrets.properties
   ```
7. Edit `phone/secrets.properties` with your Firebase database URL:
   ```
   FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com
   ```

8. Create `web/.env.local` from the example:
   ```bash
   cp web/.env.example web/.env.local
   ```
9. Edit `web/.env.local` with your Firebase config (from Firebase Console → Project Settings):
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### Build

```bash
# Phone app
cd phone && ./gradlew assembleDebug

# Watch app
cd watch && ./gradlew assembleDebug

# Web app
cd web && npm install && npm run dev
```

---

## Development Workflow
- Read the README.md file
- Interact via claude-code to do a task
- Update README.md with task and breadcrumbs to restart if needed
- Do task
- Update README.md complete task, remove breadcrumbs
- Commit and push all changes
- Iterate (repeat)
- The overall goal is to reduce session drop and context switching

## Technology Stack
- **Watch**: Kotlin + Jetpack Compose (Wear OS)
- **Phone**: Kotlin + Jetpack Compose (Android)
- **Web**: React + TypeScript + Vite
- **Watch ↔ Phone**: Wear OS Data Layer API (MessageClient + DataClient)
- **Phone ↔ Web**: Firebase Realtime Database

## Development Roadmap

### Phase 1: Core Apps ✅
1. [x] Watch App
2. [x] Phone App (MVP)
3. [x] Watch → Phone (Data Layer API)
4. [x] Phone → Firebase (Realtime Database)
5. [x] Web App (Firebase read - Mirror mode)

### Phase 2: Features ✅
- [x] Player/Team names
- [x] Authentication (namespace)
- [x] Player management (Firebase sync)
- [x] Bracket creation
- [x] Tournament play (Firebase sync)
- [x] Player stats (wins, losses, tournament wins)

### Phase 3: Future
- [ ] Live game tiles view (all 8 games at once)

---

## Current Task

**✅ Tournament System (Complete)**

### Features
- Player management (add/delete, Firebase realtime sync)
- Player stats tracking (wins, losses, tournament wins)
- Team stats tracking (teamWins, teamLosses, teamTournamentWins)
- Tournament setup (name, player selection 2-16, single/double elimination)
- Singles or Teams mode (Teams: randomly pairs players into teams)
- Bracket generation algorithm (BYE handling, proper seeding)
- Bracket display (winner's bracket, loser's bracket columns)
- Match cards with tap-to-select winner modal
- Team names displayed as "Player1 & Player2" in brackets
- Grand Finals handling (Game 1, conditional Game 2 if LB winner wins)
- Champion display on tournament completion (shows team name for doubles)
- Correct loser bracket routing (WB dropdowns → player2, LB winners → player1)
- LB crossover rounds handle mismatched counts (more WB losers than LB winners)
- Fair BYE distribution: teams that played real WB matches get LB BYEs
- BYE match auto-advance for both LB R1 and crossover rounds
- Game numbering by round (WB + LB together per round)
- Round labels for all finals columns
- Full Firebase sync for tournaments (`/tournaments/{namespace}/`)
- Archive completed tournaments (view history)

### Tournament Navigation
- `/tournament` - Landing page (Create New or View Current + View Archived)
- `/tournament/new` - Create tournament form
- `/tournament/list` - Archived tournaments list
- `/tournament/:id` - Bracket view

---

**✅ Phone → Firebase Integration (Complete)**

### Overview
Phone app sends game state to Firebase Realtime Database. Web mirroring comes later.

### Authentication
- Phone app uses Firebase Anonymous Auth (auto sign-in, no user action required)
- Namespace field in settings (email like `casey@manion.com`) identifies the game owner
- Database rules require authentication but don't verify identity (prevents casual abuse)

### Namespace Convention
- **Solo game**: `casey@manion.com` or `casey@manion.com/1`
- **Tournament (8 tables)**: `casey@manion.com/1` through `casey@manion.com/8`
- Firebase path: `/games/{email}/{table}/current` (e.g., `/games/casey@manion_com/1/current`)

### Data Model

**Live State** `/games/{email}/{table}/current`:
```
player1Score: 0
player1Rounds: 1
player1Games: 2
player1Color: "ORANGE"
player1Name: "Casey"
player2Score: 15
player2Rounds: 0
player2Games: 3
player2Color: "BLACK"
player2Name: "Ryan"
format: 3
updatedAt: timestamp
```

**Round History** `/games/{email}/{table}/history/{timestamp}`:
```
startedAt: timestamp
endedAt: timestamp
player1Games: 2
player2Games: 1
winner: 1
format: 3
player1Color: "ORANGE"
player2Color: "BLACK"
player1Name: "Casey"
player2Name: "Ryan"
```

### Game Logic
- **Score change** → Write to `/current`
- **Win (21 points)** → Increment games, reset score to 0
- **Round win** (half+1, e.g., 2 in best of 3) → Log to `/history`, increment rounds, reset games to 0
- **Reset** → Create new round (zeros all values), leave old round in history as-is

### Phone UI Updates Needed
1. **Settings screen**: Namespace (email), Format (best of 1/3/5/7, default: 1), Rounds checkbox
2. **Game display**:
   - Rounds unchecked: `[ 2 ] GAMES [ 1 ]` (games only)
   - Rounds checked: `[ 1.2 ] GAMES [ 0.3 ]` (rounds.games)
3. **Name fields**: Editable inline in Mirror mode (placeholders: "Player 1", "Player 2")
4. **Series win**: "Player X Won!" celebration dialog when winning best of 3/5/7

### Display Format
```
Rounds unchecked (default):
┌─────────────────────────┐
│     [ 2 ] GAMES [ 1 ]   │  ← games only
├─────────────────────────┤
│  [  Casey  ] [  Ryan  ] │  ← names (Mirror mode)
├─────────────────────────┤
│     (scoreboard)        │
└─────────────────────────┘

Rounds checked:
┌─────────────────────────┐
│   [ 1.2 ] GAMES [ 0.3 ] │  ← rounds.games
├─────────────────────────┤
│  [  Casey  ] [  Ryan  ] │  ← names (Mirror mode)
├─────────────────────────┤
│     (scoreboard)        │
└─────────────────────────┘
```

### Implementation Order
1. [x] Add Firebase SDK to Phone app
2. [x] Create Settings screen (namespace, format, rounds)
3. [x] Update GameState to include rounds, names
4. [x] Update UI for rounds.games display (controlled by Rounds checkbox)
5. [x] Add name input fields (inline in Mirror mode)
6. [x] Add series win celebration dialog
7. [x] Sync showRounds setting to Watch
8. [x] Implement Firebase write on state changes
9. [x] Implement round history logging on round win
10. [x] Watch settings sync prompt (Apply/Ignore when Phone reconnects)

---

## Development Status

### Watch App (Android/Kotlin)
- [x] Scoreboard UI with dual-player tracking
- [x] Score increment/decrement (+/-)
- [x] Win detection at 21 points
- [x] Bust handling (reset to 15)
- [x] Games won counter
- [x] Color picker (10 colors)
- [x] Win confirmation dialog
- [x] Full reset functionality
- [x] Data Layer messaging to Phone (MessageClient + DataClient)
- [x] Respond to state requests from Phone
- [x] Format support (best of 1/3/5/7, default: 1)
- [x] Receive format from Phone via MessageClient
- [x] Receive showRounds from Phone via MessageClient
- [x] Series win celebration dialog ("Player X Won!")
- [x] Settings sync prompt (Apply/Ignore when Phone sends different settings)

### Phone App (Android/Kotlin)
- [x] Project setup
- [x] Loading screen
- [x] Mode picker (Mirror / Keep Score / Settings) - direct navigation on tap
- [x] Square game display (width x width)
- [x] Keep screen alive
- [x] Mirror mode - display with inline editable player names
- [x] Back button with mode selection persistence
- [x] Request state on startup (ping watch for immediate connection)
- [x] Keep Score mode - standalone scoring (100% clone of Watch)
- [x] Data Layer messaging from Watch (MessageClient + DataClient listener)
- [x] Settings screen (namespace, format, rounds checkbox) with Back to Menu button
- [x] Format support (best of 1/3/5/7, default: 1)
- [x] Send format to Watch via MessageClient
- [x] Send showRounds to Watch via MessageClient
- [x] Series win celebration dialog ("Player X Won!")
- [x] Firebase write on state changes (Mirror + Keep Score modes)
- [x] Firebase round history logging on round win

### Web App (React/TypeScript)
- [x] Home screen (mode picker - Mirror / Keep Score / Settings)
- [x] Settings screen (namespace, mirror game selector 1-8)
- [x] Mirror mode - dual game display with Firebase realtime sync
- [x] Keep Score mode - standalone scoring (clone of Watch)
- [x] Color picker
- [x] Win/bust logic
- [x] Firebase realtime sync (anonymous auth)
- [x] Player management (add/delete players, Firebase realtime sync)
- [x] Player stats (wins, losses, tournament wins - auto-tracked)
- [x] Team stats (teamWins, teamLosses, teamTournamentWins - auto-tracked)
- [x] Tournament setup (name, player selection, single/double elimination)
- [x] Singles/Teams mode (random team pairing for doubles)
- [x] Bracket generation (single & double elimination, BYE handling)
- [x] Bracket display (winner's bracket, loser's bracket, grand finals)
- [x] Match cards with winner selection modal (shows team names for doubles)
- [x] Tournament Firebase sync (create, update, archive)
- [x] Tournament navigation (current/archived views)
- [ ] Live game tiles (all 8 games at once)

---

## Component Details

### Watch App
- Wear OS application for scorekeeping
- Tracks score, games won, rounds won
- Syncs state to Phone via Data Layer API
- Receives settings (format, showRounds) from Phone
- Settings sync prompt when Phone reconnects with different settings

### Phone App

**Layout**:
- Square game display using phone width as dimensions (matches watch feel)
- Bottom area has status and Back to Menu button
- Keep screen alive (like watch app)

**Screens**:
1. Loading screen
2. Mode picker (direct tap navigation):
   - Mirror - display watch game with editable player names
   - Keep Score - standalone scoring (100% clone of Watch)
   - Settings - namespace, format, rounds checkbox
3. Settings - namespace (email), format (1/3/5/7), rounds display toggle

**Firebase Integration**:
- Writes to `/games/{namespace}/current` on every state change
- Logs to `/games/{namespace}/history/{timestamp}` on round win
- Works in both Mirror and Keep Score modes

### Web App

**Layout**:
- Mimics Phone app structure (Home → Mirror / Keep Score / Settings)
- Square game displays (aspect-ratio 1:1)
- Responsive (side-by-side on desktop, stacked on mobile)

**Screens**:
1. Home screen (mode picker)
2. Mirror mode - displays 2 games from Firebase (configurable game numbers 1-8)
3. Keep Score mode - standalone scoring (clone of Watch)
4. Settings - namespace (email), mirror game selectors
5. Players - add/delete player roster
6. Tournament Setup - create new bracket (name, players, elimination type)
7. Bracket - interactive tournament bracket display

**Firebase Integration**:
- Reads from `/games/{namespace}/{table}/current`
- Anonymous authentication (auto sign-in)
- Real-time updates via Firebase subscriptions

**Tournament Features**:
- Player management (add/delete, Firebase realtime sync)
- Player stats tracking (wins, losses, tournament wins)
- Team stats tracking (teamWins, teamLosses, teamTournamentWins)
- Tournament setup (2-16 players, single/double elimination)
- Singles or Teams mode (random pairing for doubles)
- Bracket generation with smart BYE handling
- Fair BYE distribution (teams that fought get LB BYEs)
- Interactive bracket display with winner selection
- Team names displayed as "Player1 & Player2"
- Grand Finals with conditional Game 2
- Full Firebase sync for tournaments
- Archive completed tournaments

**Future**:
- Live game tiles (all 8 games at once)
    
