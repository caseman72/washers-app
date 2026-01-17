package com.manion.washers.phone.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.res.Configuration
import com.manion.washers.phone.FirebasePlayersRepository
import com.manion.washers.phone.Player
import com.manion.washers.phone.SettingsRepository
import com.manion.washers.phone.ui.theme.WatchColors

@Composable
fun PlayersScreen(
    onBackClick: () -> Unit = {}
) {
    val baseNamespace by SettingsRepository.baseNamespace.collectAsState()
    val players by FirebasePlayersRepository.players.collectAsState()
    val loading by FirebasePlayersRepository.loading.collectAsState()
    val error by FirebasePlayersRepository.error.collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf<Player?>(null) }

    // Subscribe to players when base namespace changes
    LaunchedEffect(baseNamespace) {
        if (baseNamespace.isNotBlank()) {
            FirebasePlayersRepository.subscribeToPlayers(baseNamespace)
        }
    }

    // Filter out archived players
    val activePlayers = players.filter { !it.archived }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(WatchColors.Background)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(WatchColors.Surface)
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Players",
                        color = WatchColors.OnSurface,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "(${activePlayers.size})",
                        color = WatchColors.OnSurfaceDisabled,
                        fontSize = 14.sp
                    )
                }

                // Add button
                Box(
                    modifier = Modifier
                        .background(WatchColors.Primary, RoundedCornerShape(8.dp))
                        .clickable { showAddDialog = true }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "+ Add",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Content
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when {
                    baseNamespace.isBlank() -> {
                        // No namespace configured
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "No Namespace",
                                    color = WatchColors.Primary,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Go to Settings to enter your namespace",
                                    color = WatchColors.OnSurfaceDisabled,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                    loading -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Loading players...",
                                color = WatchColors.OnSurfaceDisabled,
                                fontSize = 16.sp
                            )
                        }
                    }
                    error != null -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = error ?: "Error loading players",
                                color = Color(0xFFE74C3C),
                                fontSize = 16.sp
                            )
                        }
                    }
                    activePlayers.isEmpty() -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "No Players Yet",
                                    color = WatchColors.OnSurface,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Add players to create tournaments",
                                    color = WatchColors.OnSurfaceDisabled,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                    else -> {
                        // Player list
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(activePlayers, key = { it.id }) { player ->
                                PlayerCard(
                                    player = player,
                                    onDeleteClick = { showDeleteDialog = player }
                                )
                            }
                        }
                    }
                }
            }

            // Footer with back button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(WatchColors.Surface)
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
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

        // Add player dialog
        if (showAddDialog) {
            AddPlayerDialog(
                onDismiss = { showAddDialog = false },
                onAdd = { name ->
                    FirebasePlayersRepository.addPlayer(baseNamespace, name)
                    showAddDialog = false
                }
            )
        }

        // Delete confirmation dialog
        showDeleteDialog?.let { player ->
            DeletePlayerDialog(
                playerName = player.name,
                onDismiss = { showDeleteDialog = null },
                onConfirm = {
                    FirebasePlayersRepository.deletePlayer(baseNamespace, player.id)
                    showDeleteDialog = null
                }
            )
        }
    }
}

@Composable
private fun PlayerCard(
    player: Player,
    onDeleteClick: () -> Unit
) {
    val configuration = LocalConfiguration.current
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(WatchColors.Surface, RoundedCornerShape(8.dp))
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = player.name,
                color = WatchColors.OnSurface,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )

            // Stats row - only show in landscape mode
            if (isLandscape) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatText(label = "W:", value = player.wins, isWin = true)
                    StatText(label = "L:", value = player.losses, isWin = false)
                    if (player.tournamentWins > 0 || player.tournamentLosses > 0) {
                        StatPair(label = "1v1:", wins = player.tournamentWins, losses = player.tournamentLosses)
                    }
                    if (player.teamWins > 0 || player.teamLosses > 0) {
                        StatPair(label = "2v2:", wins = player.teamWins, losses = player.teamLosses)
                    }
                    val totalChampWins = player.finalsWins + player.teamFinalsWins
                    val totalChampLosses = player.finalsLosses + player.teamFinalsLosses
                    if (totalChampWins > 0 || totalChampLosses > 0) {
                        StatPair(label = "Champ:", wins = totalChampWins, losses = totalChampLosses)
                    }
                }
            }
        }

        // Delete button
        Box(
            modifier = Modifier
                .background(Color(0xFFC0392B), RoundedCornerShape(4.dp))
                .clickable { onDeleteClick() }
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Text(
                text = "Delete",
                color = Color.White,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
private fun StatText(label: String, value: Int, isWin: Boolean) {
    Row {
        Text(
            text = label,
            color = WatchColors.OnSurfaceDisabled,
            fontSize = 12.sp
        )
        Text(
            text = "$value",
            color = if (isWin) Color(0xFF27AE60) else Color(0xFFC0392B),
            fontSize = 12.sp
        )
    }
}

@Composable
private fun StatPair(label: String, wins: Int, losses: Int) {
    Row {
        Text(
            text = label,
            color = WatchColors.OnSurfaceDisabled,
            fontSize = 12.sp
        )
        Text(
            text = "$wins",
            color = Color(0xFF27AE60),
            fontSize = 12.sp
        )
        Text(
            text = "/",
            color = WatchColors.OnSurfaceDisabled,
            fontSize = 12.sp
        )
        Text(
            text = "$losses",
            color = Color(0xFFC0392B),
            fontSize = 12.sp
        )
    }
}

@Composable
private fun AddPlayerDialog(
    onDismiss: () -> Unit,
    onAdd: (String) -> Unit
) {
    var playerName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = WatchColors.Surface,
        title = {
            Text(
                text = "Add Player",
                color = WatchColors.OnSurface,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            OutlinedTextField(
                value = playerName,
                onValueChange = { playerName = it },
                label = { Text("Player name") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = WatchColors.Primary,
                    unfocusedBorderColor = WatchColors.SurfaceDisabled,
                    focusedLabelColor = WatchColors.Primary,
                    unfocusedLabelColor = WatchColors.OnSurfaceDisabled
                )
            )
        },
        confirmButton = {
            TextButton(
                onClick = { onAdd(playerName) },
                enabled = playerName.trim().isNotEmpty()
            ) {
                Text(
                    text = "Add",
                    color = if (playerName.trim().isNotEmpty()) WatchColors.Primary else WatchColors.OnSurfaceDisabled
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "Cancel", color = WatchColors.OnSurfaceDisabled)
            }
        }
    )
}

@Composable
private fun DeletePlayerDialog(
    playerName: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = WatchColors.Surface,
        title = {
            Text(
                text = "Delete Player?",
                color = WatchColors.OnSurface,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Text(
                text = "Are you sure you want to delete \"$playerName\"?",
                color = WatchColors.OnSurfaceDisabled
            )
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(text = "Delete", color = Color(0xFFC0392B))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "Cancel", color = WatchColors.OnSurfaceDisabled)
            }
        }
    )
}
