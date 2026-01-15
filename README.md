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
2. Enable Realtime Database
3. Download `google-services.json` from Firebase Console → Project Settings → Your Apps
4. Copy to `phone/app/google-services.json`
5. Create `phone/secrets.properties` from the example:
   ```bash
   cp phone/secrets.properties.example phone/secrets.properties
   ```
6. Edit `phone/secrets.properties` with your Firebase database URL:
   ```
   FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com
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

### Phase 1: Core Apps
1. [x] Watch App
2. [x] Phone App (MVP)
3. [x] Watch → Phone (Data Layer API)
4. [x] Phone → Firebase (Realtime Database)
5. [ ] Web App enhancements (Firebase read)

### Phase 2: Features
- [ ] Player/Team names
- [ ] Authentication (namespace)
- [ ] Player management
- [ ] Bracket creation
- [ ] Tournament play

---

## Current Task

**✅ Phone → Firebase Integration (Complete)**

### Overview
Phone app sends game state to Firebase Realtime Database. Web mirroring comes later.

### Authentication
- Simple: Phone settings has namespace field (email like `casey@manion.com`)
- No password, honor system for v1

### Namespace Convention
- **Solo game**: `casey@manion.com` or `casey@manion.com/1`
- **Tournament (8 tables)**: `casey@manion.com/1` through `casey@manion.com/8`
- Slashes are sanitized to underscores in Firebase paths

### Data Model

**Live State** `/games/{namespace}/current`:
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

**Round History** `/games/{namespace}/history/{timestamp}`:
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
- [x] Scoreboard UI (clone of Watch)
- [x] Color picker
- [x] Win/bust logic
- [ ] Authentication/login
- [ ] Firebase realtime sync
- [ ] Tournament bracket
- [ ] Live game tiles
- [ ] Player management

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
- Display for Phone App(s)
- More info - tournament
- Knows format (double elim, etc)
- Has current games as tiles with live scores
- Knows players and tournament (bracket)
- Randomizes playing players for tournament
- Specific to login
    
