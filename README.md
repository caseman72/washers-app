# Washers
---

```
      ╔═════════════╗    ╔═════════════╗     ╔═════════════╗      ╔═════════════╗
      ║    Watch    ║ -> ║    Phone    ║ <-> ║     Web     ║  <-> ║   iPhone    ║
      ╚═════════════╝    ╚═════════════╝     ╚═════════════╝      ╚═════════════╝
```

## Setup

### Prerequisites
- Android Studio (for Watch/Phone apps)
- Xcode (for iPhone app)
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

10. For iPhone app: Firebase Console → Project Settings → Add App → iOS
11. Bundle ID: `com.manion.washers.iphone`
12. Download `GoogleService-Info.plist` and add to `iphone/washers/`

### Build

```bash
# Phone app (Android)
cd phone && ./gradlew assembleDebug

# Watch app (Wear OS)
cd watch && ./gradlew assembleDebug

# Web app
cd web && npm install && npm run dev

# iPhone app (open in Xcode, build with Cmd+B)
open iphone/iphone.xcodeproj
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

### Context Compaction
When context reaches ~10% remaining, STOP and update README.md before compaction:
- Document current task progress in "Breadcrumbs" section
- Note which files were being edited and what changes remain
- List any decisions made or approaches chosen
- This allows quick recovery after compaction or new session

## Technology Stack
- **Watch**: Kotlin + Jetpack Compose (Wear OS)
- **Phone**: Kotlin + Jetpack Compose (Android)
- **iPhone**: Swift + SwiftUI (iOS)
- **Web**: React + TypeScript + Vite
- **Watch ↔ Phone**: Wear OS Data Layer API (MessageClient + DataClient)
- **Phone/iPhone ↔ Web**: Firebase Realtime Database

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
- [x] Player stats (wins/losses, tournament match stats, championship stats)

### Phase 3: iPhone App ✅
- [x] iPhone app (SwiftUI)
- [x] Mirror mode with Firebase sync
- [x] Keep Score mode with Firebase sync
- [x] Player management
- [x] Settings (namespace, format, game selector)

### Phase 4: Future
- [ ] iPad app (tournament bracket display)
- (No other pending features)

---

## Current Task

**✅ iPhone App - Complete**

Added iPhone app with Firebase integration:
- SwiftUI app with Mirror, Keep Score, Players, Settings screens
- Firebase Auth (anonymous) and Realtime Database sync
- Game # picker (0-99) and format picker (Bo1/3/5/7) in Keep Score
- Real-time player management
- Matches existing web/phone functionality

Ready for next feature.

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
- [x] Infer showRounds from format > 1 (no separate setting)
- [x] Receive reset from Phone via MessageClient (preserves colors)
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
- [x] Firebase read player names on namespace change (Mirror mode)
- [x] Reset Watch state on namespace change (preserves colors, prevents stale rounds)
- [x] Improved back button contrast for visibility
- [x] Keep Score loads game state from Firebase on mount (persists between sessions)
- [x] Keep Score game switching fix (prevents stale data writes)
- [x] Firebase writes preserve player names/IDs (updateChildren vs setValue)
- [x] Mirror mode safe writes (only player names, not stale game state)

### Web App (React/TypeScript)
- [x] Home screen (mode picker - Mirror / Keep Score / Settings)
- [x] Settings screen (namespace, mirror game selector 1-8)
- [x] Mirror mode - single game display matching Phone layout exactly
- [x] Keep Score mode - standalone scoring (clone of Watch) with Firebase sync
- [x] Keep Score rounds tracking matches Phone (format 1: win → rounds+1, games=0)
- [x] Color picker
- [x] Win/bust logic
- [x] Firebase realtime sync (anonymous auth)
- [x] Player management (add/delete players, Firebase realtime sync)
- [x] Player stats (wins/losses, tournamentWins/Losses, finalsWins/Losses - auto-tracked)
- [x] Team stats (teamWins/Losses, teamFinalsWins/Losses - auto-tracked)
- [x] Tournament setup (name, player selection, single/double elimination)
- [x] Singles/Teams mode (random team pairing for doubles)
- [x] Bracket generation (single & double elimination, BYE handling)
- [x] Bracket display (winner's bracket, loser's bracket, grand finals)
- [x] Match cards with winner selection modal (shows team names for doubles)
- [x] Tournament Firebase sync (create, update, archive)
- [x] Tournament navigation (current/archived views)
- [x] Live scores on bracket cards (Firebase realtime sync)
- [x] Auto-detect winners from Firebase (detects rounds INCREASE, not absolute value)
- [x] Initialize game tables with player names from bracket
- [x] Stable game numbering (based on structural playability, not dynamic state)
- [x] 60-second edit window for match winners (fix accidental selections)
- [x] Wins/losses undo when changing match winners
- [x] React modal dialogs (replaced browser confirm/alert)
- [x] Bracket light theme toggle (for TV display)
- [x] Format locked indicator for tournament games (1-64)
- [x] Keep Score reads player names from Firebase for tournament games
- [x] Player name selection locked for tournament games (1-64)
- [x] 404 page for unknown routes
- [x] Keep Score loads game state from Firebase on mount (persists between sessions)
- [x] Keep Score game switching fix (prevents stale data writes)
- [x] Game Complete detection uses computed game numbers from bracket

### iPhone App (Swift/SwiftUI)
- [x] Project setup with Firebase SDK
- [x] Home screen (mode picker - Mirror / Keep Score / Players / Settings)
- [x] Settings screen (namespace, format, mirror game selector 0-99)
- [x] Mirror mode - Firebase real-time game display
- [x] Keep Score mode - standalone scoring with Firebase sync
- [x] Game # picker (0-99) and format picker (Bo1/3/5/7)
- [x] Color picker (10 colors)
- [x] Win/bust logic (21 to win, >21 resets to 15)
- [x] Player management (add/delete with Firebase sync)
- [x] Anonymous Firebase authentication

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
- Player stats tracking:
  - `wins/losses` - non-tournament games
  - `tournamentWins/Losses` - singles tournament matches
  - `finalsWins/Losses` - singles championships
- Team stats tracking:
  - `teamWins/Losses` - doubles tournament matches
  - `teamFinalsWins/Losses` - doubles championships
- Tournament setup (2-16 players, single/double elimination)
- Singles or Teams mode (random pairing for doubles)
- Bracket generation with smart BYE handling
- Fair BYE distribution (teams that fought get LB BYEs)
- Interactive bracket display with winner selection
- Team names displayed as "Player1 & Player2"
- Grand Finals with conditional Game 2
- 60-second edit window for match winners (fix mistakes)
- Wins/losses undo when changing winner selection
- Full Firebase sync for tournaments
- Archive completed tournaments
- Light/dark theme toggle for TV display (persists in localStorage)

### iPhone App

**Layout**:
- Home screen with mode picker buttons
- Square game display (matches Watch/Phone feel)
- Dark theme matching other apps

**Screens**:
1. Home (mode picker - Mirror / Keep Score / Players / Settings)
2. Mirror - read-only game display from Firebase
3. Keep Score - standalone scoring with game #/format pickers
4. Players - add/delete player roster
5. Settings - namespace (email), format, mirror game selector

**Firebase Integration**:
- Anonymous authentication (auto sign-in)
- Reads/writes to `/games/{namespace}/{table}/current`
- Reads/writes to `/players/{namespace}`
- Real-time updates via Firebase listeners

