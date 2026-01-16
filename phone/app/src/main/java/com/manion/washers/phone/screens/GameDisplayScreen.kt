package com.manion.washers.phone.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manion.washers.phone.FirebaseRepository
import com.manion.washers.phone.GameState
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
    // For Mirror mode: observe state from watch via WearableRepository
    // For Keep Score mode: use local state
    val watchGameState by WearableRepository.gameState.collectAsState()
    val isConnected by WearableRepository.isConnected.collectAsState()

    // Local state for Keep Score mode
    var localGameState by remember { mutableStateOf(GameState()) }

    // Sync Keep Score state to Firebase
    LaunchedEffect(localGameState) {
        if (mode == AppMode.KEEP_SCORE) {
            FirebaseRepository.writeCurrentState(localGameState)
        }
    }

    // Observe namespace for Mirror mode
    val namespace by SettingsRepository.namespace.collectAsState()

    // Track previous namespace to detect changes
    var previousNamespace by remember { mutableStateOf(namespace) }

    // Reset game state when namespace changes (prevents stale rounds from triggering false wins)
    LaunchedEffect(namespace) {
        if (namespace != previousNamespace) {
            // Reset local state for Keep Score mode (preserves colors)
            localGameState = localGameState.resetAll()
            // Tell Watch to reset its state (Watch preserves colors)
            WearableSender.sendReset()
            previousNamespace = namespace
        }
    }

    // Read player names from Firebase when entering Mirror mode or when namespace changes
    // Debounce to avoid firing on every keystroke
    LaunchedEffect(mode, namespace) {
        if (mode == AppMode.MIRROR && namespace.isNotBlank()) {
            kotlinx.coroutines.delay(500) // Wait 500ms after typing stops
            FirebaseRepository.readAndSyncNames()
        }
    }

    // Use watch state for Mirror, local state for Keep Score
    val displayState = when (mode) {
        AppMode.MIRROR -> watchGameState ?: GameState()
        AppMode.KEEP_SCORE -> localGameState
        AppMode.SETTINGS -> GameState()
    }

    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp.dp

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Square game display area (width x width)
            Box(
                modifier = Modifier
                    .size(screenWidth)
                    .background(WatchColors.Background)
            ) {
                when (mode) {
                    AppMode.MIRROR -> MirrorDisplay(displayState)
                    AppMode.KEEP_SCORE -> KeepScorePager(
                        gameState = localGameState,
                        onGameStateChange = { localGameState = it }
                    )
                    AppMode.SETTINGS -> { /* Not used */ }
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
                // Status text
                val statusText = when {
                    mode != AppMode.MIRROR -> ""
                    isConnected -> "Connected to watch"
                    else -> "Waiting for watch..."
                }
                Text(
                    text = statusText,
                    color = if (isConnected) WatchColors.Secondary else WatchColors.OnSurfaceDisabled,
                    fontSize = 16.sp
                )

                Spacer(modifier = Modifier.weight(1f))

                // Namespace field (Mirror and Keep Score modes)
                if (mode == AppMode.MIRROR || mode == AppMode.KEEP_SCORE) {
                    OutlinedTextField(
                        value = namespace,
                        onValueChange = { SettingsRepository.setNamespace(it) },
                        label = { Text("Namespace") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = WatchColors.Primary,
                            unfocusedBorderColor = WatchColors.Surface,
                            focusedLabelColor = WatchColors.Primary,
                            unfocusedLabelColor = WatchColors.OnSurfaceDisabled
                        )
                    )
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
    }
}

/**
 * Mirror mode - display only, matches watch layout exactly
 */
@Composable
private fun MirrorDisplay(gameState: GameState) {
    val showRounds by SettingsRepository.showRounds.collectAsState()
    val player1Name by SettingsRepository.player1Name.collectAsState()
    val player2Name by SettingsRepository.player2Name.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top padding
        Spacer(modifier = Modifier.height(30.dp))

        // Games counter with colored badges
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

        // Score panels with editable names in the top area
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            ScorePanelWithName(
                score = gameState.player1Score,
                color = gameState.player1Color,
                name = player1Name,
                placeholder = "Player 1",
                onNameChange = { SettingsRepository.setPlayer1Name(it) },
                modifier = Modifier.weight(1f)
            )

            ScorePanelWithName(
                score = gameState.player2Score,
                color = gameState.player2Color,
                name = player2Name,
                placeholder = "Player 2",
                onNameChange = { SettingsRepository.setPlayer2Name(it) },
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(30.dp))
    }
}

@Composable
private fun GamesCounter(
    player1Games: Int,
    player2Games: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(40.dp)
            .background(WatchColors.Surface, RoundedCornerShape(8.dp))
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "$player1Games",
            color = WatchColors.OnSurface,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "GAMES",
            color = WatchColors.OnSurfaceDisabled,
            fontSize = 16.sp
        )
        Text(
            text = "$player2Games",
            color = WatchColors.OnSurface,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun ScorePanel(
    score: Int,
    color: PlayerColor,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxHeight()
            .background(color.background, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "$score",
            color = color.text,
            fontSize = 72.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
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
 */
@Composable
private fun GamesCounterWithBadges(
    player1Games: Int,
    player2Games: Int,
    player1Rounds: Int = 0,
    player2Rounds: Int = 0,
    player1Color: PlayerColor,
    player2Color: PlayerColor,
    showRounds: Boolean = false
) {
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

/**
 * Score panel with darker top/bottom areas (display only, matches watch visual)
 */
@Composable
private fun ScorePanelWithButtons(
    score: Int,
    color: PlayerColor,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(8.dp)),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top area (darker, no button)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f)
                .background(color.darker)
        )

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

        // Bottom area (darker, no button)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f)
                .background(color.darker)
        )
    }
}

/**
 * Score panel with editable name in top area (for Mirror mode)
 */
@Composable
private fun ScorePanelWithName(
    score: Int,
    color: PlayerColor,
    name: String,
    placeholder: String,
    onNameChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(8.dp)),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top area with editable name
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f)
                .background(color.darker),
            contentAlignment = Alignment.Center
        ) {
            BasicTextField(
                value = name,
                onValueChange = onNameChange,
                textStyle = TextStyle(
                    color = color.text,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                ),
                singleLine = true,
                cursorBrush = SolidColor(color.text),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp),
                decorationBox = { innerTextField ->
                    Box(contentAlignment = Alignment.Center) {
                        if (name.isEmpty()) {
                            Text(
                                text = placeholder,
                                color = color.text.copy(alpha = 0.5f),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        }
                        innerTextField()
                    }
                }
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
 * Keep Score mode with pager (Page 0: Game, Page 1: Colors)
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun KeepScorePager(
    gameState: GameState,
    onGameStateChange: (GameState) -> Unit
) {
    var colorPickerFor by remember { mutableStateOf<Int?>(null) }
    var winConfirmationFor by remember { mutableStateOf<Int?>(null) }
    var seriesWinFor by remember { mutableStateOf<Int?>(null) }
    var sessionStartTime by remember { mutableStateOf(System.currentTimeMillis()) }
    val format by SettingsRepository.format.collectAsState()
    val showRounds by SettingsRepository.showRounds.collectAsState()
    val player1Name by SettingsRepository.player1Name.collectAsState()
    val player2Name by SettingsRepository.player2Name.collectAsState()
    val pagerState = rememberPagerState(pageCount = { 2 })

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
            pageCount = 2,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 8.dp)
        )

        // Win confirmation overlay
        winConfirmationFor?.let { player ->
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
                        // Apply win directly (need to pass format to ensure correct session tracking)
                        onGameStateChange(gameState.copy(format = format).confirmWin(player))
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

                    // Use format from settings to ensure correct session tracking
                    onGameStateChange(gameState.copy(format = format).confirmWin(player))

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
                otherPlayerColor = if (player == 1) gameState.player2Color else gameState.player1Color,
                onColorSelected = { color ->
                    val newState = if (player == 1) gameState.setPlayer1Color(color) else gameState.setPlayer2Color(color)
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
    val showRounds by SettingsRepository.showRounds.collectAsState()

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

        Box(
            modifier = Modifier
                .width(170.dp)
                .height(45.dp)
                .background(WatchColors.Surface, RoundedCornerShape(8.dp))
                .clickable { onGameStateChange(gameState.resetAll()) },
            contentAlignment = Alignment.Center
        ) {
            Text("Reset", fontSize = 18.sp, color = WatchColors.OnSurfaceDisabled)
        }

        Spacer(modifier = Modifier.height(30.dp))
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

        Box(
            modifier = Modifier
                .width(170.dp)
                .height(45.dp)
                .background(WatchColors.Surface, RoundedCornerShape(8.dp))
                .clickable { onResetColors() },
            contentAlignment = Alignment.Center
        ) {
            Text("Reset", fontSize = 18.sp, color = WatchColors.OnSurfaceDisabled)
        }

        Spacer(modifier = Modifier.height(30.dp))
    }
}

@Composable
private fun PageIndicator(
    currentPage: Int,
    pageCount: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        repeat(pageCount) { index ->
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
    otherPlayerColor: PlayerColor,
    onColorSelected: (PlayerColor) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF1A1A1A)),
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
                val isDisabled = color == otherPlayerColor
                val isSelected = color == currentColor

                ColorPickerItem(
                    color = color,
                    isSelected = isSelected,
                    isDisabled = isDisabled,
                    onClick = {
                        if (!isDisabled) {
                            onColorSelected(color)
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun ColorPickerItem(
    color: PlayerColor,
    isSelected: Boolean,
    isDisabled: Boolean,
    onClick: () -> Unit
) {
    val alpha = if (isDisabled) 0.35f else 1f

    Row(
        modifier = Modifier
            .fillMaxWidth(0.85f)
            .height(56.dp)
            .background(
                if (isSelected) Color(0xFF333333) else Color.Transparent,
                RoundedCornerShape(8.dp)
            )
            .clickable(enabled = !isDisabled, onClick = onClick)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(color.background.copy(alpha = alpha))
                .then(
                    if (color == PlayerColor.WHITE)
                        Modifier.border(1.dp, Color(0xFFCCCCCC), CircleShape)
                    else Modifier
                )
        )

        Spacer(modifier = Modifier.width(16.dp))

        Text(
            text = color.displayName,
            color = Color.White.copy(alpha = alpha),
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
