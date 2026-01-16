package com.manion.washers.phone.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manion.washers.phone.SettingsRepository
import com.manion.washers.phone.WearableSender
import com.manion.washers.phone.ui.theme.WatchColors

@Composable
fun SettingsScreen(
    onBackClick: () -> Unit
) {
    val format by SettingsRepository.format.collectAsState()
    val showRounds by SettingsRepository.showRounds.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            // Header
            Text(
                text = "Settings",
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Format selector
            SettingSection(title = "Format") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FormatOption(
                        label = "1",
                        selected = format == 1,
                        onClick = {
                            SettingsRepository.setFormat(1)
                            WearableSender.sendFormat(1)
                        },
                        modifier = Modifier.weight(1f)
                    )
                    FormatOption(
                        label = "3",
                        selected = format == 3,
                        onClick = {
                            SettingsRepository.setFormat(3)
                            WearableSender.sendFormat(3)
                        },
                        modifier = Modifier.weight(1f)
                    )
                    FormatOption(
                        label = "5",
                        selected = format == 5,
                        onClick = {
                            SettingsRepository.setFormat(5)
                            WearableSender.sendFormat(5)
                        },
                        modifier = Modifier.weight(1f)
                    )
                    FormatOption(
                        label = "7",
                        selected = format == 7,
                        onClick = {
                            SettingsRepository.setFormat(7)
                            WearableSender.sendFormat(7)
                        },
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (format == 1) "Single game" else "Best of $format",
                    color = WatchColors.OnSurfaceDisabled,
                    fontSize = 14.sp,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Rounds checkbox
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(WatchColors.Surface, RoundedCornerShape(8.dp))
                    .clickable {
                        SettingsRepository.setShowRounds(!showRounds)
                        WearableSender.sendShowRounds(!showRounds)
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = showRounds,
                    onCheckedChange = {
                        SettingsRepository.setShowRounds(it)
                        WearableSender.sendShowRounds(it)
                    },
                    colors = CheckboxDefaults.colors(
                        checkedColor = WatchColors.Primary,
                        uncheckedColor = WatchColors.OnSurfaceDisabled
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Rounds",
                        color = WatchColors.OnSurface,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = if (showRounds) "Display: rounds.games" else "Display: games only",
                        color = WatchColors.OnSurfaceDisabled,
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Info text
            Text(
                text = "Settings sync to watch when changed",
                color = WatchColors.OnSurfaceDisabled,
                fontSize = 12.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Back to Menu button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .background(WatchColors.Surface, RoundedCornerShape(8.dp))
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

@Composable
private fun SettingSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column {
        Text(
            text = title,
            color = WatchColors.OnSurface,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(12.dp))
        content()
    }
}

@Composable
private fun FormatOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(48.dp)
            .background(
                if (selected) WatchColors.Primary else WatchColors.Surface,
                RoundedCornerShape(8.dp)
            )
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = WatchColors.OnSurface,
            fontSize = 14.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
        )
    }
}
