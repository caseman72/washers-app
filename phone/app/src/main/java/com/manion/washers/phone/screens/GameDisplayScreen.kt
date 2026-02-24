package com.manion.washers.phone.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.draw.clip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manion.washers.phone.FirebasePlayersRepository
import com.manion.washers.phone.FirebaseRepository
import com.manion.washers.phone.GameState
import com.manion.washers.phone.Player
import com.manion.washers.phone.PlayerColor
import com.manion.washers.phone.SettingsRepository
import com.manion.washers.phone.WearableRepository
import com.manion.washers.phone.WearableSender
import com.manion.washers.phone.ui.theme.WatchColors

@Composable
fun GameDisplayScreen(
    mode: AppMode,
    onBackClick: () -> Unit = {}
) {
    // Observe watch state (used when watch is connected)
    val watchGameState by WearableRepository.gameState.collectAsState()
    val isConnected by WearableRepository.isConnected.collectAsState()

    // Local state for Keep Score mode
    var localGameState by remember { mutableStateOf(GameState()) }

    // Observe base namespace and game number separately (split storage)
    // Declared early because they're used in multiple LaunchedEffects
    val baseNamespace by SettingsRepository.baseNamespace.collectAsState()
    val gameNumber by SettingsRepository.gameNumber.collectAsState()
    val fullNamespace = SettingsRepository.getFullNamespace()

    // Track if current tournament game is already complete (declared early for use in LaunchedEffect)
    var isGameComplete by remember { mutableStateOf(false) }

    // Track if initial data has been loaded from Firebase (and for which game)
    var initialDataLoaded by remember { mutableStateOf(false) }
    var loadedForGameNumber by remember { mutableStateOf<Int?>(null) }

    // Track current pager page (0=game, 1=colors)
    var currentPagerPage by remember { mutableStateOf(0) }

    // Track last state received from Firebase to suppress write-back loops
    var lastFirebaseSnapshot by remember { mutableStateOf("") }

    // Sync Keep Score state to Firebase
    LaunchedEffect(localGameState, isGameComplete, initialDataLoaded, loadedForGameNumber, gameNumber) {
        if (mode == AppMode.KEEP_SCORE) {
            // Skip write until initial data is loaded for THIS game number
            // This prevents writing stale data from a previous game after game number changes
            if (!initialDataLoaded || loadedForGameNumber != gameNumber) {
                return@LaunchedEffect
            }

            // Skip write if game is already complete (don't overwrite finished tournament games)
            if (isGameComplete) {
                return@LaunchedEffect
            }

            // Skip write-back if state matches what we just received from Firebase
            val currentSnapshot = "${localGameState.player1Score},${localGameState.player2Score}," +
                "${localGameState.player1Games},${localGameState.player2Games}," +
                "${localGameState.player1Rounds},${localGameState.player2Rounds}," +
                "${localGameState.player1Color},${localGameState.player2Color}," +
                "${SettingsRepository.format.value}"
            if (currentSnapshot == lastFirebaseSnapshot) {
                return@LaunchedEffect
            }

            FirebaseRepository.writeCurrentState(localGameState)
        }
    }

    // Track previous full namespace to detect changes
    var previousNamespace by remember { mutableStateOf(fullNamespace) }

    // Reset game state when namespace changes (prevents stale rounds from triggering false wins)
    LaunchedEffect(fullNamespace) {
        if (fullNamespace != previousNamespace) {
            // Reset local state for Keep Score mode (preserves colors)
            localGameState = localGameState.resetAll()
            // Tell Watch to reset its state (Watch preserves colors)
            WearableSender.sendReset()
            previousNamespace = fullNamespace
        }
    }

    // Read player names from Firebase when entering Keep Score or when namespace changes
    // Debounce to avoid firing on every keystroke
    LaunchedEffect(mode, fullNamespace) {
        if (mode == AppMode.KEEP_SCORE && fullNamespace.isNotBlank()) {
            kotlinx.coroutines.delay(500)
            FirebaseRepository.readAndSyncNames()
        }
    }

    // Tournament warning dialog state
    var showTournamentWarning by remember { mutableStateOf(false) }

    // Subscribe to real-time game state from Firebase
    DisposableEffect(gameNumber, mode, baseNamespace) {
        if (mode == AppMode.KEEP_SCORE && baseNamespace.isNotBlank()) {
            // Reset loaded state when game number changes
            initialDataLoaded = false
            loadedForGameNumber = null

            val loadingGameNumber = gameNumber
            var isFirstUpdate = true
            val unsubscribe = FirebaseRepository.subscribeToGameState { state ->
                if (state != null) {
                    localGameState = state
                    // Track snapshot to prevent write-back
                    lastFirebaseSnapshot = "${state.player1Score},${state.player2Score}," +
                        "${state.player1Games},${state.player2Games}," +
                        "${state.player1Rounds},${state.player2Rounds}," +
                        "${state.player1Color},${state.player2Color}," +
                        "${state.format}"
                } else if (isFirstUpdate) {
                    // No data in Firebase on first load - use defaults and write them
                    val defaultState = GameState()
                    localGameState = defaultState
                    SettingsRepository.setPlayer1Name("")
                    SettingsRepository.setPlayer2Name("")
                    FirebaseRepository.writeCurrentState(defaultState)
                }
                if (isFirstUpdate) {
                    initialDataLoaded = true
                    loadedForGameNumber = loadingGameNumber
                    isFirstUpdate = false
                }
            }

            onDispose { unsubscribe() }
        } else if (mode == AppMode.KEEP_SCORE) {
            initialDataLoaded = true
            loadedForGameNumber = gameNumber
            onDispose { }
        } else {
            onDispose { }
        }
    }

    // Check if tournament game is complete (has winner in bracket)
    LaunchedEffect(gameNumber, mode, baseNamespace) {
        val isTournament = gameNumber in 1..64
        if (mode == AppMode.KEEP_SCORE && isTournament && baseNamespace.isNotBlank()) {
            FirebaseRepository.checkGameComplete(gameNumber) { complete ->
                isGameComplete = complete
                android.util.Log.d("GameDisplayScreen", "Game $gameNumber complete: $complete")
            }
        } else {
            // Non-tournament games are never "complete" in this sense
            isGameComplete = false
        }
    }

    // Track previous rounds to detect series wins when Watch connected (for auto-advance)
    var prevRounds by remember { mutableStateOf<Pair<Int, Int>?>(null) }

    // Auto-advance game number when tournament game is won via Watch
    LaunchedEffect(watchGameState?.player1Rounds, watchGameState?.player2Rounds) {
        if (!isConnected) return@LaunchedEffect
        val state = watchGameState ?: return@LaunchedEffect
        val isTournament = SettingsRepository.isTournamentGame()
        if (!isTournament) return@LaunchedEffect

        val currentRounds = Pair(state.player1Rounds, state.player2Rounds)
        val prev = prevRounds

        if (prev != null) {
            // Detect if either player's rounds increased (series win)
            if ((currentRounds.first > prev.first || currentRounds.second > prev.second) && gameNumber < 64) {
                SettingsRepository.setGameNumber(gameNumber + 1)
            }
        }

        prevRounds = currentRounds
    }

    // Player picker state (for Keep Score mode)
    var showPlayerPicker by remember { mutableStateOf<Int?>(null) }

    // Subscribe to players for Keep Score mode (uses baseNamespace directly)
    val players by FirebasePlayersRepository.players.collectAsState()
    LaunchedEffect(baseNamespace) {
        if (baseNamespace.isNotBlank() && mode == AppMode.KEEP_SCORE) {
            FirebasePlayersRepository.subscribeToPlayers(baseNamespace)
        }
    }
    val activePlayers = players.filter { !it.archived }

    // Tournament check now happens on game number field blur (see below)

    // Use watch state when connected, local state otherwise
    val displayState = if (isConnected) watchGameState ?: GameState() else localGameState

    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp.dp
    val screenHeight = configuration.screenHeightDp.dp
    // Cap game display at 475dp and leave room for bottom controls
    val bottomAreaHeight = 220.dp
    val gameDisplaySize = minOf(screenWidth, screenHeight - bottomAreaHeight, 475.dp)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)

    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Square game display area (capped at 475dp)
            Box(
                modifier = Modifier
                    .size(gameDisplaySize)
                    .background(WatchColors.Background)
            ) {
                when (mode) {
                    AppMode.KEEP_SCORE -> {
                        if (!initialDataLoaded && !isConnected) {
                            // Show loading while reading from Firebase (not needed when Watch connected)
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Loading...",
                                    color = WatchColors.Primary,
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        } else if (isGameComplete && !isConnected) {
                            // Show "Game Complete" message instead of scoreboard
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Game Complete",
                                        color = WatchColors.Primary,
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "This tournament game has already been played.",
                                        color = WatchColors.OnSurfaceDisabled,
                                        fontSize = 14.sp,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(horizontal = 32.dp)
                                    )
                                }
                            }
                        } else if (isConnected) {
                            // Watch connected — show read-only scoreboard (like Mirror)
                            KeepScoreWatchDisplay(
                                gameState = displayState,
                                showTournamentWarning = showTournamentWarning,
                                onDismissTournamentWarning = { showTournamentWarning = false },
                                onFixTournamentWarning = {
                                    SettingsRepository.setGameNumber(0)
                                    showTournamentWarning = false
                                }
                            )
                        } else {
                            KeepScorePager(
                                gameState = localGameState,
                                onGameStateChange = { localGameState = it },
                                onPageChange = { currentPagerPage = it },
                                onSeriesWin = { newState, onAdvance ->
                                    // Write to Firebase first, then advance game number
                                    FirebaseRepository.writeCurrentState(newState) {
                                        // Mark as loading BEFORE advancing (prevents race condition)
                                        initialDataLoaded = false
                                        onAdvance()
                                        // Reset local state for the new game (preserves colors)
                                        // The LaunchedEffect will load the correct state from Firebase
                                        localGameState = localGameState.resetAll()
                                    }
                                    // DON'T update local state here - wait for callback
                                }
                            )
                        }
                    }
                    AppMode.PLAYERS -> { /* Not used */ }
                }
            }

            // Bottom area with back button and status
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(WatchColors.SurfaceDisabled)
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Reset button for Keep Score mode (hidden when Watch connected)
                if (mode == AppMode.KEEP_SCORE && initialDataLoaded && !isGameComplete && !isConnected) {
                    Box(
                        modifier = Modifier
                            .width(170.dp)
                            .height(45.dp)
                            .background(WatchColors.Surface, RoundedCornerShape(8.dp))
                            .clickable {
                                if (currentPagerPage == 1) {
                                    localGameState = localGameState.resetColors()
                                } else {
                                    localGameState = localGameState.resetAll()
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Reset", fontSize = 18.sp, color = WatchColors.OnSurfaceDisabled)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                // Connection status (only shown when connected)
                if (isConnected) {
                    Text(
                        text = "Connected to watch",
                        color = WatchColors.Secondary,
                        fontSize = 16.sp
                    )
                }
                // Player name labels below scoreboard (hidden when Watch connected)
                if (!isConnected) {
                    // Player name labels - clickable, side by side under score cards
                    val player1Name by SettingsRepository.player1Name.collectAsState()
                    val player2Name by SettingsRepository.player2Name.collectAsState()

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // Player 1 name
                        Text(
                            text = player1Name.ifEmpty { "Player 1" },
                            color = if (player1Name.isEmpty()) WatchColors.OnSurfaceDisabled else WatchColors.OnSurface,
                            fontSize = 16.sp,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { showPlayerPicker = 1 }
                                .padding(vertical = 8.dp),
                            textAlign = TextAlign.Center
                        )

                        // Player 2 name
                        Text(
                            text = player2Name.ifEmpty { "Player 2" },
                            color = if (player2Name.isEmpty()) WatchColors.OnSurfaceDisabled else WatchColors.OnSurface,
                            fontSize = 16.sp,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { showPlayerPicker = 2 }
                                .padding(vertical = 8.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Game number and Format fields
                if (mode == AppMode.KEEP_SCORE) {
                    val format by SettingsRepository.format.collectAsState()
                    val isTournament = SettingsRepository.isTournamentGame()

                    // Separate input state - only commit to gameNumber on blur
                    var gameNumberInput by remember { mutableStateOf(gameNumber.toString()) }

                    // Sync input when gameNumber changes externally (e.g., Fix It button)
                    LaunchedEffect(gameNumber) {
                        if (gameNumberInput != gameNumber.toString()) {
                            gameNumberInput = gameNumber.toString()
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Game number field
                        OutlinedTextField(
                            value = gameNumberInput,
                            onValueChange = { value ->
                                // Only update input display while typing
                                gameNumberInput = value.filter { it.isDigit() }
                            },
                            label = { Text("Game #") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Number,
                                imeAction = androidx.compose.ui.text.input.ImeAction.Done
                            ),
                            keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                                onDone = {
                                    // Commit on Done key
                                    val num = gameNumberInput.toIntOrNull() ?: 0
                                    val finalNumber = num.coerceIn(0, 99)
                                    SettingsRepository.setGameNumber(finalNumber)
                                    gameNumberInput = finalNumber.toString()
                                    // Check tournament
                                    if (finalNumber in 1..64 && baseNamespace.isNotBlank()) {
                                        FirebaseRepository.checkActiveTournament { hasActive ->
                                            if (!hasActive) {
                                                showTournamentWarning = true
                                            }
                                        }
                                    }
                                }
                            ),
                            modifier = Modifier
                                .width(100.dp)
                                .onFocusChanged { focusState ->
                                    if (!focusState.isFocused) {
                                        // Commit on blur
                                        val num = gameNumberInput.toIntOrNull() ?: 0
                                        val finalNumber = num.coerceIn(0, 99)
                                        SettingsRepository.setGameNumber(finalNumber)
                                        gameNumberInput = finalNumber.toString()
                                        // Check tournament
                                        if (finalNumber in 1..64 && baseNamespace.isNotBlank()) {
                                            FirebaseRepository.checkActiveTournament { hasActive ->
                                                if (!hasActive) {
                                                    showTournamentWarning = true
                                                }
                                            }
                                        }
                                    }
                                },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = WatchColors.Primary,
                                unfocusedBorderColor = WatchColors.Surface,
                                focusedLabelColor = WatchColors.Primary,
                                unfocusedLabelColor = WatchColors.OnSurfaceDisabled
                            )
                        )

                        Spacer(modifier = Modifier.weight(1f))

                        // Format selector
                        FormatSelector(
                            format = if (isTournament) 1 else format,
                            enabled = !isTournament,
                            onFormatChange = { newFormat ->
                                SettingsRepository.setFormat(newFormat)
                                WearableSender.sendFormat(newFormat)
                                if (!isConnected) {
                                    FirebaseRepository.writeCurrentState(localGameState)
                                }
                            }
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                // Back button
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .background(WatchColors.Background, RoundedCornerShape(8.dp))
                        .clickable { onBackClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Back to Menu",
                        color = WatchColors.OnSurface,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Player picker dialog (when not connected — connected mode has its own picker)
        if (!isConnected) {
            showPlayerPicker?.let { playerNum ->
                val player1Name by SettingsRepository.player1Name.collectAsState()
                val player2Name by SettingsRepository.player2Name.collectAsState()

                PlayerPickerDialog(
                    players = activePlayers,
                    currentName = if (playerNum == 1) player1Name else player2Name,
                    onPlayerSelected = { player ->
                        if (playerNum == 1) {
                            SettingsRepository.setPlayer1Name(player.name)
                        } else {
                            SettingsRepository.setPlayer2Name(player.name)
                        }
                        // Update Firebase with player name
                        if (isConnected) {
                            // Watch connected — write player names only (watch handles game state)
                            FirebaseRepository.writePlayerNamesOnly()
                        } else {
                            FirebaseRepository.writeCurrentState(localGameState)
                        }
                        showPlayerPicker = null
                    },
                    onDismiss = { showPlayerPicker = null }
                )
            }
        }
    }
}

/**
 * Keep Score mode when Watch is connected - read-only scores (no +/- buttons)
 * Player names in the score panels are clickable to change via player picker
 */
@Composable
private fun KeepScoreWatchDisplay(
    gameState: GameState,
    showTournamentWarning: Boolean,
    onDismissTournamentWarning: () -> Unit,
    onFixTournamentWarning: () -> Unit
) {
    val format by SettingsRepository.format.collectAsState()
    val baseNamespace by SettingsRepository.baseNamespace.collectAsState()
    val player1Name by SettingsRepository.player1Name.collectAsState()
    val player2Name by SettingsRepository.player2Name.collectAsState()
    val isTournament = SettingsRepository.isTournamentGame()
    val showRounds = !isTournament && format > 1

    // Player picker state
    var showPlayerPicker by remember { mutableStateOf<Int?>(null) }
    val players by FirebasePlayersRepository.players.collectAsState()

    LaunchedEffect(baseNamespace) {
        if (baseNamespace.isNotBlank() && !isTournament) {
            FirebasePlayersRepository.subscribeToPlayers(baseNamespace)
        }
    }

    val activePlayers = players.filter { !it.archived }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(30.dp))

        GamesCounterWithBadges(
            player1Games = gameState.player1Games,
            player2Games = gameState.player2Games,
            player1Rounds = gameState.player1Rounds,
            player2Rounds = gameState.player2Rounds,
            player1Color = gameState.player1Color,
            player2Color = gameState.player2Color,
            showRounds = showRounds
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            ScorePanelWithPlayerPicker(
                score = gameState.player1Score,
                color = gameState.player1Color,
                name = player1Name,
                placeholder = "Player 1",
                onTap = { if (!isTournament) showPlayerPicker = 1 },
                enabled = !isTournament,
                modifier = Modifier.weight(1f)
            )

            ScorePanelWithPlayerPicker(
                score = gameState.player2Score,
                color = gameState.player2Color,
                name = player2Name,
                placeholder = "Player 2",
                onTap = { if (!isTournament) showPlayerPicker = 2 },
                enabled = !isTournament,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(30.dp))
    }

    if (showTournamentWarning) {
        TournamentWarningDialog(
            onDismiss = onDismissTournamentWarning,
            onFix = onFixTournamentWarning
        )
    }

    // Player picker dialog (only for non-tournament)
    if (!isTournament) {
        showPlayerPicker?.let { playerNum ->
            PlayerPickerDialog(
                players = activePlayers,
                currentName = if (playerNum == 1) player1Name else player2Name,
                onPlayerSelected = { player ->
                    if (playerNum == 1) {
                        SettingsRepository.setPlayer1Name(player.name)
                    } else {
                        SettingsRepository.setPlayer2Name(player.name)
                    }
                    FirebaseRepository.writePlayerNamesOnly()
                    showPlayerPicker = null
                },
                onDismiss = { showPlayerPicker = null }
            )
        }
    }
}

@Composable
private fun ScoreControlPanel(
    score: Int,
    color: PlayerColor,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxHeight(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // + Button
        androidx.compose.material3.Button(
            onClick = onIncrement,
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f),
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = color.darker
            ),
            shape = RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp, bottomStart = 0.dp, bottomEnd = 0.dp)
        ) {
            Text("+", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = color.text)
        }

        // Score display
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1.4f)
                .background(color.background),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "$score",
                color = color.text,
                fontSize = 56.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // - Button
        androidx.compose.material3.Button(
            onClick = onDecrement,
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f),
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = color.darker
            ),
            shape = RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp, bottomStart = 8.dp, bottomEnd = 8.dp)
        ) {
            Text("−", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = color.text)
        }
    }
}

/**
 * Games counter with colored badges (matches watch layout)
 * When player names are provided (format=1), shows names instead of games counter
 */
@Composable
private fun GamesCounterWithBadges(
    player1Games: Int,
    player2Games: Int,
    player1Rounds: Int = 0,
    player2Rounds: Int = 0,
    player1Color: PlayerColor,
    player2Color: PlayerColor,
    showRounds: Boolean = false,
    player1Name: String? = null,
    player2Name: String? = null
) {
    // When names are provided (format=1), show names header instead of games
    if (player1Name != null && player2Name != null) {
        Row(
            modifier = Modifier.height(50.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Player 1 name badge
            Box(
                modifier = Modifier
                    .widthIn(min = 80.dp)
                    .height(50.dp)
                    .background(player1Color.background, RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = player1Name.ifEmpty { "Player 1" },
                    color = player1Color.text,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1
                )
            }

            Text(
                text = "  vs  ",
                color = WatchColors.OnSurfaceDisabled,
                fontSize = 16.sp
            )

            // Player 2 name badge
            Box(
                modifier = Modifier
                    .widthIn(min = 80.dp)
                    .height(50.dp)
                    .background(player2Color.background, RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = player2Name.ifEmpty { "Player 2" },
                    color = player2Color.text,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1
                )
            }
        }
    } else {
        // Show games counter (rounds.games or just games)
        val badgeWidth = if (showRounds) 64.dp else 50.dp
        val fontSize = if (showRounds) 28.sp else 32.sp

        Row(
            modifier = Modifier.height(50.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Player 1 badge
            Box(
                modifier = Modifier
                    .size(width = badgeWidth, height = 50.dp)
                    .background(player1Color.background, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (showRounds) "$player1Rounds.$player1Games" else "$player1Games",
                    color = player1Color.text,
                    fontSize = fontSize,
                    fontWeight = FontWeight.Bold
                )
            }

            Text(
                text = " GAMES ",
                color = WatchColors.OnSurfaceDisabled,
                fontSize = 18.sp
            )

            // Player 2 badge
            Box(
                modifier = Modifier
                    .size(width = badgeWidth, height = 50.dp)
                    .background(player2Color.background, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (showRounds) "$player2Rounds.$player2Games" else "$player2Games",
                    color = player2Color.text,
                    fontSize = fontSize,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * Keep Score mode with pager (Page 0: Game, Page 1: Colors)
 * @param onSeriesWin Called when a series is won - receives the new state, returns callback to run after Firebase write
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun KeepScorePager(
    gameState: GameState,
    onGameStateChange: (GameState) -> Unit,
    onSeriesWin: ((GameState, () -> Unit) -> Unit)? = null,
    onPageChange: ((Int) -> Unit)? = null
) {
    var colorPickerFor by remember { mutableStateOf<Int?>(null) }
    var winConfirmationFor by remember { mutableStateOf<Int?>(null) }
    var seriesWinFor by remember { mutableStateOf<Int?>(null) }
    var sessionStartTime by remember { mutableStateOf(System.currentTimeMillis()) }
    val format by SettingsRepository.format.collectAsState()
    val player1Name by SettingsRepository.player1Name.collectAsState()
    val player2Name by SettingsRepository.player2Name.collectAsState()
    val pagerState = rememberPagerState(pageCount = { 2 })

    LaunchedEffect(pagerState.currentPage) {
        onPageChange?.invoke(pagerState.currentPage)
    }

    Box(modifier = Modifier.fillMaxSize()) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
            userScrollEnabled = colorPickerFor == null && winConfirmationFor == null && seriesWinFor == null
        ) { page ->
            when (page) {
                0 -> KeepScoreGameScreen(
                    gameState = gameState,
                    onGameStateChange = onGameStateChange,
                    onPlayerWin = { player -> winConfirmationFor = player }
                )
                1 -> KeepScoreColorsScreen(
                    gameState = gameState,
                    onColorTap = { player -> colorPickerFor = player },
                    onResetColors = { onGameStateChange(gameState.resetColors()) }
                )
            }
        }

        // Page indicator dots
        PageIndicator(
            currentPage = pagerState.currentPage,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 8.dp)
        )

        // Win confirmation overlay
        winConfirmationFor?.let { player ->
            val isTournament = SettingsRepository.isTournamentGame()
            val currentGameNumber = SettingsRepository.gameNumber.value

            WinConfirmationDialog(
                player = player,
                playerColor = if (player == 1) gameState.player1Color else gameState.player2Color,
                onConfirm = {
                    // Check if this wins the series (use format from settings, not gameState)
                    val playerGames = if (player == 1) gameState.player1Games else gameState.player2Games
                    val gamesNeeded = (format / 2) + 1
                    val winsSeriesNow = (playerGames + 1) >= gamesNeeded

                    if (format > 1 && winsSeriesNow) {
                        // Show series win celebration before applying state
                        seriesWinFor = player
                    } else {
                        // Apply win directly
                        val newState = gameState.copy(format = format).confirmWin(player)

                        // For tournament games, use onSeriesWin to handle Firebase timing
                        if (isTournament && currentGameNumber < 64 && onSeriesWin != null) {
                            onSeriesWin(newState) {
                                SettingsRepository.setGameNumber(currentGameNumber + 1)
                            }
                        } else {
                            onGameStateChange(newState)
                        }
                    }
                    winConfirmationFor = null
                },
                onDeny = {
                    val newState = if (player == 1) gameState.bustPlayer1() else gameState.bustPlayer2()
                    onGameStateChange(newState)
                    winConfirmationFor = null
                }
            )
        }

        // Series win celebration overlay
        seriesWinFor?.let { player ->
            val isTournament = SettingsRepository.isTournamentGame()
            val currentGameNumber = SettingsRepository.gameNumber.value

            SeriesWinDialog(
                player = player,
                playerColor = if (player == 1) gameState.player1Color else gameState.player2Color,
                onOk = {
                    // Log session history to Firebase before resetting
                    val finalPlayer1Games = if (player == 1) gameState.player1Games + 1 else gameState.player1Games
                    val finalPlayer2Games = if (player == 2) gameState.player2Games + 1 else gameState.player2Games
                    FirebaseRepository.logSessionHistory(
                        player1Games = finalPlayer1Games,
                        player2Games = finalPlayer2Games,
                        winner = player,
                        format = format,
                        player1Color = gameState.player1Color,
                        player2Color = gameState.player2Color,
                        player1Name = player1Name,
                        player2Name = player2Name,
                        startedAt = sessionStartTime
                    )

                    // Get the new state after the win
                    val newState = gameState.copy(format = format).confirmWin(player)

                    // If we have a series win handler, use it (handles Firebase timing)
                    if (onSeriesWin != null && isTournament && currentGameNumber < 64) {
                        onSeriesWin(newState) {
                            // This runs after Firebase write completes
                            SettingsRepository.setGameNumber(currentGameNumber + 1)
                        }
                    } else {
                        // No auto-advance needed, just update state
                        onGameStateChange(newState)
                    }

                    // Reset session start time for next session
                    sessionStartTime = System.currentTimeMillis()
                    seriesWinFor = null
                }
            )
        }

        // Color picker overlay
        colorPickerFor?.let { player ->
            ColorPickerDialog(
                currentColor = if (player == 1) gameState.player1Color else gameState.player2Color,
                onColorSelected = { color ->
                    val otherColor = if (player == 1) gameState.player2Color else gameState.player1Color
                    val currentColor = if (player == 1) gameState.player1Color else gameState.player2Color
                    val newState = if (color == otherColor) {
                        // Swap: picking player gets chosen color, other player gets picking player's old color
                        gameState.setPlayer1Color(if (player == 1) color else currentColor)
                            .setPlayer2Color(if (player == 1) currentColor else color)
                    } else {
                        if (player == 1) gameState.setPlayer1Color(color) else gameState.setPlayer2Color(color)
                    }
                    onGameStateChange(newState)
                    colorPickerFor = null
                }
            )
        }
    }
}

/**
 * Keep Score game screen (Page 0) - matches watch layout exactly
 */
@Composable
private fun KeepScoreGameScreen(
    gameState: GameState,
    onGameStateChange: (GameState) -> Unit,
    onPlayerWin: (Int) -> Unit
) {
    val format by SettingsRepository.format.collectAsState()
    // Derive showRounds reactively from format > 1 (tournament games 1-64 have format locked to 1)
    val isTournament = SettingsRepository.isTournamentGame()
    val showRounds = !isTournament && format > 1

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        GamesCounterWithBadges(
            player1Games = gameState.player1Games,
            player2Games = gameState.player2Games,
            player1Rounds = gameState.player1Rounds,
            player2Rounds = gameState.player2Rounds,
            player1Color = gameState.player1Color,
            player2Color = gameState.player2Color,
            showRounds = showRounds
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            ScoreControlPanel(
                score = gameState.player1Score,
                color = gameState.player1Color,
                onIncrement = {
                    val newState = gameState.incrementPlayer1()
                    onGameStateChange(newState)
                    if (newState.player1Score == GameState.WINNING_SCORE) {
                        onPlayerWin(1)
                    }
                },
                onDecrement = { onGameStateChange(gameState.decrementPlayer1()) },
                modifier = Modifier.weight(1f)
            )

            Spacer(modifier = Modifier.width(16.dp))

            ScoreControlPanel(
                score = gameState.player2Score,
                color = gameState.player2Color,
                onIncrement = {
                    val newState = gameState.incrementPlayer2()
                    onGameStateChange(newState)
                    if (newState.player2Score == GameState.WINNING_SCORE) {
                        onPlayerWin(2)
                    }
                },
                onDecrement = { onGameStateChange(gameState.decrementPlayer2()) },
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

/**
 * Keep Score colors screen (Page 1) - matches watch layout exactly
 */
@Composable
private fun KeepScoreColorsScreen(
    gameState: GameState,
    onColorTap: (Int) -> Unit,
    onResetColors: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(20.dp))

        Box(
            modifier = Modifier.height(50.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "CHOOSE COLORS",
                color = WatchColors.OnSurfaceDisabled,
                fontSize = 18.sp
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(8.dp))
                    .background(gameState.player1Color.background)
                    .clickable { onColorTap(1) }
            )

            Spacer(modifier = Modifier.width(16.dp))

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(8.dp))
                    .background(gameState.player2Color.background)
                    .clickable { onColorTap(2) }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun PageIndicator(
    currentPage: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        repeat(2) { index ->
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(
                        if (index == currentPage) Color.White else Color(0xFF555555)
                    )
            )
        }
    }
}

@Composable
private fun ColorPickerDialog(
    currentColor: PlayerColor,
    onColorSelected: (PlayerColor) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF1A1A1A))
            .statusBarsPadding(),
        contentAlignment = Alignment.Center
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(PlayerColor.entries) { color ->
                val isSelected = color == currentColor

                ColorPickerItem(
                    color = color,
                    isSelected = isSelected,
                    onClick = { onColorSelected(color) }
                )
            }
        }
    }
}

@Composable
private fun ColorPickerItem(
    color: PlayerColor,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth(0.85f)
            .height(56.dp)
            .background(
                if (isSelected) Color(0xFF333333) else Color.Transparent,
                RoundedCornerShape(8.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(color.background)
                .then(
                    if (color == PlayerColor.WHITE)
                        Modifier.border(1.dp, Color(0xFFCCCCCC), CircleShape)
                    else Modifier
                )
        )

        Spacer(modifier = Modifier.width(16.dp))

        Text(
            text = color.displayName,
            color = Color.White,
            fontSize = 18.sp,
            modifier = Modifier.weight(1f)
        )

        if (isSelected) {
            Text(
                text = "✓",
                color = Color(0xFF4CAF50),
                fontSize = 20.sp
            )
        }
    }
}

@Composable
private fun WinConfirmationDialog(
    player: Int,
    playerColor: PlayerColor,
    onConfirm: () -> Unit,
    onDeny: () -> Unit
) {
    // Use white for dark colors (BLACK, BROWN) so text is visible on dark dialog
    val titleColor = if (playerColor == PlayerColor.BLACK || playerColor == PlayerColor.BROWN) {
        Color.White
    } else {
        playerColor.background
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC000000)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .background(WatchColors.Surface, RoundedCornerShape(16.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Player $player Won?",
                color = titleColor,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // No button
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .background(Color(0xFF333333), RoundedCornerShape(8.dp))
                        .clickable { onDeny() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                // Yes button (green background)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .background(Color(0xFF27AE60), RoundedCornerShape(8.dp))
                        .clickable { onConfirm() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Yes",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun SeriesWinDialog(
    player: Int,
    playerColor: PlayerColor,
    onOk: () -> Unit
) {
    // Use white for dark colors (BLACK, BROWN) so text is visible on dark dialog
    val titleColor = if (playerColor == PlayerColor.BLACK || playerColor == PlayerColor.BROWN) {
        Color.White
    } else {
        playerColor.background
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC000000)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .background(WatchColors.Surface, RoundedCornerShape(16.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Player $player Won!",
                color = titleColor,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(24.dp))

            // OK button (green background)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .background(Color(0xFF27AE60), RoundedCornerShape(8.dp))
                    .clickable { onOk() },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "OK",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * Format selector - cycles through format options (1, 3, 5, 7)
 * Disabled for tournament games (1-64)
 */
@Composable
private fun FormatSelector(
    format: Int,
    enabled: Boolean,
    onFormatChange: (Int) -> Unit
) {
    val formats = listOf(1, 3, 5, 7)
    val alpha = if (enabled) 1f else 0.5f

    Box(
        modifier = Modifier
            .width(56.dp)
            .height(56.dp)
            .background(
                color = if (enabled) WatchColors.Surface else WatchColors.SurfaceDisabled,
                shape = RoundedCornerShape(8.dp)
            )
            .clickable(enabled = enabled) {
                val currentIndex = formats.indexOf(format)
                val nextIndex = (currentIndex + 1) % formats.size
                onFormatChange(formats[nextIndex])
            },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Bo$format",
                color = WatchColors.OnSurface.copy(alpha = alpha),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            if (!enabled) {
                Text(
                    text = "locked",
                    color = WatchColors.OnSurfaceDisabled,
                    fontSize = 10.sp
                )
            }
        }
    }
}

/**
 * Score panel with tappable name for player picker
 * When enabled=false (tournament mode), the name area is not tappable
 */
@Composable
private fun ScorePanelWithPlayerPicker(
    score: Int,
    color: PlayerColor,
    name: String,
    placeholder: String,
    onTap: () -> Unit,
    enabled: Boolean = true,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(8.dp)),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top area with tappable name (disabled for tournaments)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f)
                .background(color.darker)
                .then(if (enabled) Modifier.clickable { onTap() } else Modifier),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = name.ifEmpty { placeholder },
                color = if (name.isEmpty()) color.text.copy(alpha = 0.5f) else color.text,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
        }

        // Score (main color)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1.4f)
                .background(color.background),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "$score",
                color = color.text,
                fontSize = 72.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // Bottom area (darker)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f)
                .background(color.darker)
        )
    }
}

/**
 * Player picker dialog - full screen scrollable list (matches ColorPickerDialog style)
 */
@Composable
private fun PlayerPickerDialog(
    players: List<Player>,
    currentName: String,
    onPlayerSelected: (Player) -> Unit,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF1A1A1A))
            .statusBarsPadding(),
        contentAlignment = Alignment.Center
    ) {
        if (players.isEmpty()) {
            // Empty state
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "No Players",
                    color = WatchColors.OnSurfaceDisabled,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Add players from the Players screen",
                    color = WatchColors.OnSurfaceDisabled,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(32.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .height(56.dp)
                        .background(Color(0xFF333333), RoundedCornerShape(8.dp))
                        .clickable { onDismiss() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Back",
                        color = Color.White,
                        fontSize = 18.sp
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(vertical = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(players, key = { it.id }) { player ->
                    val isSelected = player.name == currentName

                    PlayerPickerItem(
                        name = player.name,
                        isSelected = isSelected,
                        onClick = { onPlayerSelected(player) }
                    )
                }

                // Back button at the end
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.85f)
                            .height(56.dp)
                            .background(Color(0xFF333333), RoundedCornerShape(8.dp))
                            .clickable { onDismiss() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Back",
                            color = Color.White,
                            fontSize = 18.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerPickerItem(
    name: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth(0.85f)
            .height(56.dp)
            .background(
                if (isSelected) Color(0xFF333333) else Color.Transparent,
                RoundedCornerShape(8.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Player icon circle
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(WatchColors.Primary),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = name.take(1).uppercase(),
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        Text(
            text = name,
            color = Color.White,
            fontSize = 18.sp,
            modifier = Modifier.weight(1f)
        )

        if (isSelected) {
            Text(
                text = "✓",
                color = Color(0xFF4CAF50),
                fontSize = 20.sp
            )
        }
    }
}

/**
 * Warning dialog shown when user enters a tournament game number (1-64)
 * without an active tournament. Offers to fix by removing the game number.
 */
@Composable
private fun TournamentWarningDialog(
    onDismiss: () -> Unit,
    onFix: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC000000)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .background(WatchColors.Surface, RoundedCornerShape(16.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No Active Tournament",
                color = Color(0xFFFF9800),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Game numbers 1-64 are reserved for tournaments. There is no active tournament.",
                color = WatchColors.OnSurface,
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Dismiss button
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .background(Color(0xFF333333), RoundedCornerShape(8.dp))
                        .clickable { onDismiss() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Dismiss",
                        color = Color.White,
                        fontSize = 16.sp
                    )
                }

                // Fix button (removes game number)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .background(Color(0xFF27AE60), RoundedCornerShape(8.dp))
                        .clickable { onFix() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Fix It",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
