package com.manion.washers.phone.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manion.washers.phone.ui.theme.WatchColors

enum class AppMode {
    MIRROR,
    KEEP_SCORE,
    PLAYERS,
    SETTINGS
}

@Composable
fun ModePickerScreen(
    initialMode: AppMode? = null,
    onModeSelected: (AppMode) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Washers",
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Mode options - navigate directly on click
            ModeOption(
                title = "Mirror",
                description = "Display watch game",
                selected = initialMode == AppMode.MIRROR,
                onClick = { onModeSelected(AppMode.MIRROR) }
            )

            Spacer(modifier = Modifier.height(16.dp))

            ModeOption(
                title = "Keep Score",
                description = "Standalone scoring",
                selected = initialMode == AppMode.KEEP_SCORE,
                onClick = { onModeSelected(AppMode.KEEP_SCORE) }
            )

            Spacer(modifier = Modifier.height(16.dp))

            ModeOption(
                title = "Players",
                description = "Manage player roster",
                selected = initialMode == AppMode.PLAYERS,
                onClick = { onModeSelected(AppMode.PLAYERS) }
            )

            Spacer(modifier = Modifier.height(16.dp))

            ModeOption(
                title = "Settings",
                description = "Namespace config",
                selected = initialMode == AppMode.SETTINGS,
                onClick = { onModeSelected(AppMode.SETTINGS) }
            )
        }
    }
}

@Composable
private fun ModeOption(
    title: String,
    description: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (selected) WatchColors.SurfaceSelected else WatchColors.Surface

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(backgroundColor, RoundedCornerShape(8.dp))
            .selectable(
                selected = selected,
                role = Role.RadioButton,
                onClick = onClick
            )
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(
            selected = selected,
            onClick = null,
            colors = RadioButtonDefaults.colors(
                selectedColor = WatchColors.Primary,
                unselectedColor = WatchColors.OnSurfaceDisabled
            )
        )

        Spacer(modifier = Modifier.width(16.dp))

        Column {
            Text(
                text = title,
                color = WatchColors.OnSurface,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = description,
                color = WatchColors.OnSurface.copy(alpha = 0.7f),
                fontSize = 14.sp
            )
        }
    }
}
