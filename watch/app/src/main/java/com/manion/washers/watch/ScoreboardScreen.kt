package com.manion.washers.watch

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
//import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material.*
//import kotlinx.coroutines.launch

/**
 * Main scoreboard app with two pages:
 * - Page 0: Game scoreboard
 * - Page 1: Color picker
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ScoreboardScreen() {
    var gameState by remember { mutableStateOf(GameState()) }
    var showWinDialog by remember { mutableStateOf<Int?>(null) }
    var showSeriesWinDialog by remember { mutableStateOf<Int?>(null) }
    var colorPickerFor by remember { mutableStateOf<Int?>(null) }

    val pagerState = rememberPagerState(pageCount = { 2 })

    // Data Layer communication
    val context = LocalContext.current.applicationContext
    val dataLayerManager = remember { DataLayerManager.getInstance(context) }

    // Send state to phone whenever it changes
    LaunchedEffect(gameState) {
        dataLayerManager.sendGameState(gameState)
    }

    // Observe format from phone and apply it
    val formatFromPhone by DataLayerManager.formatFromPhone.collectAsState()
    LaunchedEffect(formatFromPhone) {
        formatFromPhone?.let { format ->
            if (format != gameState.format) {
                gameState = gameState.setFormat(format)
            }
        }
    }

    // Observe showRounds from phone
    val showRoundsFromPhone by DataLayerManager.showRoundsFromPhone.collectAsState()
    val showRounds = showRoundsFromPhone ?: false

    // Observe pending settings from phone
    val pendingSettings by DataLayerManager.pendingSettings.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF515151))
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
            userScrollEnabled = showWinDialog == null && showSeriesWinDialog == null && colorPickerFor == null && pendingSettings == null
        ) { page ->
            when (page) {
                0 -> GameScreen(
                    gameState = gameState,
                    showRounds = showRounds,
                    enabled = showWinDialog == null && showSeriesWinDialog == null,
                    onIncrement = { player ->
                        gameState = if (player == 1) gameState.incrementPlayer1() else gameState.incrementPlayer2()
                        val atWin = if (player == 1) gameState.player1AtWinningScore else gameState.player2AtWinningScore
                        if (atWin) showWinDialog = player
                    },
                    onDecrement = { player ->
                        gameState = if (player == 1) gameState.decrementPlayer1() else gameState.decrementPlayer2()
                        showWinDialog = null
                    },
                    onResetAll = {
                        gameState = gameState.resetAll()
                        showWinDialog = null
                    }
                )
                1 -> ColorsScreen(
                    gameState = gameState,
                    onColorTap = { player -> colorPickerFor = player },
                    onResetColors = { gameState = gameState.resetColors() }
                )
            }
        }

        // Page indicator dots at bottom (moved down 10px)
        PageIndicator(
            currentPage = pagerState.currentPage,
            pageCount = 2,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 3.dp)
        )

        // Win confirmation dialog
        showWinDialog?.let { winner ->
            WinDialog(
                winner = winner,
                onConfirm = {
                    // Check if this would win the series
                    val playerGames = if (winner == 1) gameState.player1Games else gameState.player2Games
                    val gamesNeeded = (gameState.format / 2) + 1
                    val winsSeriesNow = (playerGames + 1) >= gamesNeeded

                    if (gameState.format > 1 && winsSeriesNow) {
                        // Show series win dialog before confirming
                        showWinDialog = null
                        showSeriesWinDialog = winner
                    } else {
                        gameState = gameState.confirmWin(winner)
                        showWinDialog = null
                    }
                },
                onDismiss = {
                    // Win or bust - reset to 15
                    gameState = if (winner == 1) gameState.bustPlayer1() else gameState.bustPlayer2()
                    showWinDialog = null
                }
            )
        }

        // Series win celebration dialog
        showSeriesWinDialog?.let { winner ->
            SeriesWinDialog(
                winner = winner,
                playerColor = if (winner == 1) gameState.player1Color else gameState.player2Color,
                onOk = {
                    gameState = gameState.confirmWin(winner)
                    showSeriesWinDialog = null
                }
            )
        }

        // Color picker overlay
        colorPickerFor?.let { player ->
            ColorPickerDialog(
                currentColor = if (player == 1) gameState.player1Color else gameState.player2Color,
                otherPlayerColor = if (player == 1) gameState.player2Color else gameState.player1Color,
                onColorSelected = { color ->
                    gameState = if (player == 1) gameState.setPlayer1Color(color) else gameState.setPlayer2Color(color)
                    colorPickerFor = null
                }
            )
        }

        // Pending settings from phone dialog
        pendingSettings?.let { settings ->
            PendingSettingsDialog(
                format = settings.format,
                showRounds = settings.showRounds,
                onApply = { DataLayerManager.acceptPendingSettings() },
                onIgnore = { DataLayerManager.rejectPendingSettings() }
            )
        }
    }
}

/**
 * Page 0: Main game scoreboard with full-width +/- buttons
 */
@Composable
fun GameScreen(
    gameState: GameState,
    showRounds: Boolean = false,
    enabled: Boolean = true,
    onIncrement: (Int) -> Unit,
    onDecrement: (Int) -> Unit,
    onResetAll: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 30px top padding
        Spacer(modifier = Modifier.height(15.dp))

        // Games counter - 50px tall
        val badgeWidth = if (showRounds) 32.dp else 25.dp
        val badgeFontSize = if (showRounds) 14.sp else 16.sp

        Row(
            modifier = Modifier.height(25.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Player 1 games badge
            Box(
                modifier = Modifier
                    .size(width = badgeWidth, height = 25.dp)
                    .background(gameState.player1Color.background, RoundedCornerShape(4.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (showRounds) "${gameState.player1Rounds}.${gameState.player1Games}" else "${gameState.player1Games}",
                    color = gameState.player1Color.text,
                    fontSize = badgeFontSize,
                    fontWeight = FontWeight.Bold
                )
            }

            Text(
                text = " GAMES ",
                color = Color(0xFF888888),
                fontSize = 11.sp
            )

            // Player 2 games badge
            Box(
                modifier = Modifier
                    .size(width = badgeWidth, height = 25.dp)
                    .background(gameState.player2Color.background, RoundedCornerShape(4.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (showRounds) "${gameState.player2Rounds}.${gameState.player2Games}" else "${gameState.player2Games}",
                    color = gameState.player2Color.text,
                    fontSize = badgeFontSize,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // 15px gap after games
        Spacer(modifier = Modifier.height(8.dp))

        // Score panels - 260px tall
        Row(
            modifier = Modifier.height(130.dp),
            horizontalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // Player 1
            PlayerScoreColumn(
                score = gameState.player1Score,
                color = gameState.player1Color,
                enabled = enabled,
                onIncrement = { onIncrement(1) },
                onDecrement = { onDecrement(1) },
                modifier = Modifier.width(92.dp)
            )

            // Player 2
            PlayerScoreColumn(
                score = gameState.player2Score,
                color = gameState.player2Color,
                enabled = enabled,
                onIncrement = { onIncrement(2) },
                onDecrement = { onDecrement(2) },
                modifier = Modifier.width(92.dp)
            )
        }

        // 15px gap before reset
        Spacer(modifier = Modifier.height(8.dp))

        // Reset button - 170px wide, 45px tall
        Box(
            modifier = Modifier
                .width(85.dp)
                .height(22.dp)
                .background(Color(0xFF444444), RoundedCornerShape(4.dp))
                .clickable(enabled = enabled, onClick = onResetAll),
            contentAlignment = Alignment.Center
        ) {
            Text("Reset", fontSize = 12.sp, color = Color(0xFFAAAAAA))
        }

        // Remaining space before page dots
        Spacer(modifier = Modifier.weight(0.5f))
    }
}

/**
 * Single player column with +, score, and - stacked vertically
 */
@Composable
fun PlayerScoreColumn(
    score: Int,
    color: PlayerColor,
    enabled: Boolean = true,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(8.dp)),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // + button (darker)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f)
                .background(color.darker)
                .clickable(enabled = enabled, onClick = onIncrement),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "+",
                color = color.text,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
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
                fontSize = 44.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // - button (darker)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.7f)
                .background(color.darker)
                .clickable(enabled = enabled, onClick = onDecrement),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "−",
                color = color.text.copy(alpha = 0.7f),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Page 1: Color selection screen - matches Screen 1 layout
 */
@Composable
fun ColorsScreen(
    gameState: GameState,
    onColorTap: (Int) -> Unit,
    onResetColors: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 30px top padding
        Spacer(modifier = Modifier.height(15.dp))

        // Header - 50px tall, same as games counter
        Row(
            modifier = Modifier.height(25.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Placeholder box to match layout
            Box(
                modifier = Modifier
                    .size(width = 32.dp, height = 25.dp)
                    .background(Color.Transparent),
                contentAlignment = Alignment.Center
            ) {}

            Text(
                text = " CHOOSE COLORS ",
                color = Color(0xFF888888),
                fontSize = 11.sp
            )

            Box(
                modifier = Modifier
                    .size(width = 32.dp, height = 25.dp)
                    .background(Color.Transparent),
                contentAlignment = Alignment.Center
            ) {}
        }

        // 15px gap after header
        Spacer(modifier = Modifier.height(8.dp))

        // Color panels - 260px tall
        Row(
            modifier = Modifier.height(130.dp),
            horizontalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // Player 1 color
            Box(
                modifier = Modifier
                    .width(92.dp)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(8.dp))
                    .background(gameState.player1Color.background)
                    .clickable { onColorTap(1) },
                contentAlignment = Alignment.Center
            ) {}

            // Player 2 color
            Box(
                modifier = Modifier
                    .width(92.dp)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(8.dp))
                    .background(gameState.player2Color.background)
                    .clickable { onColorTap(2) },
                contentAlignment = Alignment.Center
            ) {}
        }

        // 15px gap before reset
        Spacer(modifier = Modifier.height(8.dp))

        // Reset Colors button - 170px wide, 45px tall
        Box(
            modifier = Modifier
                .width(85.dp)
                .height(22.dp)
                .background(Color(0xFF444444), RoundedCornerShape(4.dp))
                .clickable(onClick = onResetColors),
            contentAlignment = Alignment.Center
        ) {
            Text("Reset", fontSize = 12.sp, color = Color(0xFFAAAAAA))
        }

        // Remaining space before page dots
        Spacer(modifier = Modifier.weight(0.5f))
    }
}

@Composable
fun PageIndicator(
    currentPage: Int,
    pageCount: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        repeat(pageCount) { index ->
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(
                        if (index == currentPage) Color.White else Color(0xFF555555)
                    )
            )
        }
    }
}

@Composable
fun WinDialog(
    winner: Int,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xDD000000)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Player $winner Won?",
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // No button (smaller)
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.width(50.dp),
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color(0xFF444444)
                    )
                ) {
                    Text("No", fontSize = 14.sp, color = Color(0xFF999999))
                }

                // Yes button (larger, green)
                Button(
                    onClick = onConfirm,
                    modifier = Modifier.width(80.dp),
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color(0xFF4CAF50)
                    )
                ) {
                    Text("Yes", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun ColorPickerDialog(
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
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(PlayerColor.entries.size) { index ->
                val color = PlayerColor.entries[index]
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ColorPickerItem(
    color: PlayerColor,
    isSelected: Boolean,
    isDisabled: Boolean,
    onClick: () -> Unit
) {
    val alpha = if (isDisabled) 0.35f else 1f

    Row(
        modifier = Modifier
            .fillMaxWidth(0.85f)
            .height(40.dp)
            .background(
                if (isSelected) Color(0xFF333333) else Color.Transparent,
                RoundedCornerShape(8.dp)
            )
            .combinedClickable(
                enabled = !isDisabled,
                onClick = onClick,
                onLongClick = {}
            )
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Color swatch
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(CircleShape)
                .background(color.background.copy(alpha = alpha))
                .then(
                    if (color == PlayerColor.WHITE)
                        Modifier.border(1.dp, Color(0xFFCCCCCC), CircleShape)
                    else Modifier
                )
        )

        Spacer(modifier = Modifier.width(12.dp))

        // Color name
        Text(
            text = color.displayName,
            color = Color.White.copy(alpha = alpha),
            fontSize = 14.sp,
            modifier = Modifier.weight(1f)
        )

        // Checkmark if selected
        if (isSelected) {
            Text(
                text = "✓",
                color = Color(0xFF4CAF50),
                fontSize = 16.sp
            )
        }
    }
}

@Composable
fun SeriesWinDialog(
    winner: Int,
    playerColor: PlayerColor,
    onOk: () -> Unit
) {
    // Use white text for dark colors, player color for light colors
    val textColor = if (playerColor == PlayerColor.BLACK || playerColor == PlayerColor.BROWN) {
        Color.White
    } else {
        playerColor.background
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xDD000000)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Player $winner Won!",
                color = textColor,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onOk,
                modifier = Modifier.width(80.dp),
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = Color(0xFF4CAF50)
                )
            ) {
                Text(
                    text = "OK",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}

@Composable
fun PendingSettingsDialog(
    format: Int,
    showRounds: Boolean,
    onApply: () -> Unit,
    onIgnore: () -> Unit
) {
    val formatText = if (format == 1) "Single game" else "Best of $format"
    val roundsText = if (showRounds) "On" else "Off"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xDD000000)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(horizontal = 16.dp)
        ) {
            Text(
                text = "Phone Settings",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = formatText,
                color = Color(0xFFAAAAAA),
                fontSize = 14.sp
            )
            Text(
                text = "Rounds: $roundsText",
                color = Color(0xFFAAAAAA),
                fontSize = 14.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Ignore button
                Button(
                    onClick = onIgnore,
                    modifier = Modifier.width(65.dp),
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color(0xFF444444)
                    )
                ) {
                    Text("Ignore", fontSize = 12.sp, color = Color(0xFF999999))
                }

                // Apply button
                Button(
                    onClick = onApply,
                    modifier = Modifier.width(65.dp),
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color(0xFF4CAF50)
                    )
                ) {
                    Text("Apply", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
