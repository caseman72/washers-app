# iPhone App Plan

## Overview

Port the essential features from the web app to iOS/SwiftUI. The iPhone app is a companion for scoring and player management - no watch pairing, no tournament brackets.

```
┌─────────────────────────────────────────────────────────┐
│                    Feature Matrix                       │
├─────────────┬───────┬───────┬─────────┬────────────────┤
│   Feature   │ Watch │ Phone │   Web   │     iPhone     │
├─────────────┼───────┼───────┼─────────┼────────────────┤
│ Keep Score  │   ✓   │   ✓   │    ✓    │       ✓        │
│ Mirror      │   -   │   ✓   │    ✓    │       ✓        │
│ Players     │   -   │   -   │    ✓    │       ✓        │
│ Settings    │   -   │   ✓   │    ✓    │       ✓        │
│ Tournament  │   -   │   -   │    ✓    │       -        │
│ Bracket     │   -   │   -   │    ✓    │       -        │
│ Watch Sync  │   ✓   │   ✓   │    -    │       -        │
└─────────────┴───────┴───────┴─────────┴────────────────┘
```

## Requirements

### Screens

1. **Home** - Mode picker (Mirror / Keep Score / Players / Settings)
2. **Settings** - Namespace (email), format (1/3/5/7), mirror game selector (1-8)
3. **Mirror** - Display game state from Firebase (read-only scoreboard)
4. **Keep Score** - Standalone scoring with Firebase sync
5. **Players** - List, add, delete players with Firebase sync

### Keep Score Features
- Dual player scoring (tap to increment, long-press to decrement)
- Win detection at 21 points
- Bust handling (reset to 15 on >21)
- Games won counter
- Rounds won counter (when format > 1)
- Color picker (10 colors)
- Win confirmation dialog
- Series win celebration (best of 3/5/7)
- Full reset functionality
- Firebase sync on state changes

### Mirror Features
- Display single game from Firebase
- Configurable game number (1-8)
- Real-time updates
- Player names display

### Players Features
- List all players in namespace
- Add new player
- Delete player (with confirmation)
- Real-time Firebase sync

### Settings Features
- Namespace (email) - persisted locally
- Format selector (Best of 1/3/5/7)
- Mirror game selector (1-8)

## Out of Scope

- Watch pairing/sync (Wear OS only)
- Tournament creation
- Bracket display/management
- Player stats display
- Team management

## Technical Setup

### Prerequisites
- Xcode (installed)
- Apple ID signed into Xcode (free - for device testing)
- iPhone for testing

### Firebase Setup
1. Firebase Console → Project Settings → Add App → iOS
2. Bundle ID: `com.manion.washers` (or similar)
3. Download `GoogleService-Info.plist`
4. Add to Xcode project

### Dependencies (Swift Package Manager)
- firebase-ios-sdk (Auth, Database)

## Project Structure

```
iphone/
├── Washers.xcodeproj
├── Washers/
│   ├── WashersApp.swift          # App entry point
│   ├── GoogleService-Info.plist  # Firebase config (not committed)
│   ├── Models/
│   │   ├── GameState.swift       # Score, games, rounds, colors
│   │   └── Player.swift          # Player model
│   ├── Services/
│   │   ├── FirebaseService.swift # Auth + Database operations
│   │   └── SettingsService.swift # UserDefaults wrapper
│   ├── Views/
│   │   ├── HomeView.swift        # Mode picker
│   │   ├── SettingsView.swift    # Namespace, format, game selector
│   │   ├── MirrorView.swift      # Firebase game display
│   │   ├── KeepScoreView.swift   # Standalone scoring
│   │   ├── PlayersView.swift     # Player management
│   │   └── Components/
│   │       ├── ScoreboardView.swift   # Shared score display
│   │       ├── ColorPickerView.swift  # Color selection
│   │       └── PlayerCardView.swift   # Player list item
│   └── Extensions/
│       └── Color+Washers.swift   # Custom colors
└── README.md
```

## Firebase Paths

Same structure as existing apps:

```
/games/{namespace}/{table}/current
  - player1Score, player2Score
  - player1Games, player2Games
  - player1Rounds, player2Rounds
  - player1Color, player2Color
  - player1Name, player2Name
  - player1Id, player2Id
  - format

/players/{namespace}/{playerId}
  - name
  - wins, losses
  - tournamentWins, tournamentLosses
  - finalsWins, finalsLosses
  - teamWins, teamLosses
  - teamFinalsWins, teamFinalsLosses
```

## Color Palette

Match existing apps (10 colors):
- Red, Orange, Yellow, Green, Teal
- Blue, Indigo, Purple, Pink, Brown

## Development Phases

### Phase 1: Project Setup
- [ ] Create Xcode project
- [ ] Add Firebase SDK
- [ ] Configure Firebase (GoogleService-Info.plist)
- [ ] Anonymous auth on app launch

### Phase 2: Core Screens
- [ ] Home view (mode picker)
- [ ] Settings view (namespace, format)
- [ ] Settings persistence (UserDefaults)

### Phase 3: Keep Score
- [ ] Scoreboard UI
- [ ] Score increment/decrement
- [ ] Win/bust logic
- [ ] Games/rounds tracking
- [ ] Color picker
- [ ] Firebase sync

### Phase 4: Mirror Mode
- [ ] Firebase listener for game state
- [ ] Scoreboard display (read-only)
- [ ] Game selector in settings

### Phase 5: Players
- [ ] Players list view
- [ ] Add player
- [ ] Delete player
- [ ] Firebase sync

## App Store (Future)

Requires Apple Developer Program ($99/year):
- TestFlight beta distribution
- App Store submission
- Bundle ID registration

Not needed for personal device testing.
