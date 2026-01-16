package com.manion.washers.phone.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manion.washers.phone.SettingsRepository
import com.manion.washers.phone.ui.theme.WatchColors

@Composable
fun SettingsScreen(
    onBackClick: () -> Unit
) {
    val namespace by SettingsRepository.namespace.collectAsState()

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

            // Namespace field
            OutlinedTextField(
                value = namespace,
                onValueChange = { SettingsRepository.setNamespace(it) },
                label = { Text("Namespace") },
                placeholder = { Text("e.g., user@example.com or user@example.com/1") },
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

            Spacer(modifier = Modifier.height(16.dp))

            // Help text for namespace
            Text(
                text = "Namespace identifies your games in Firebase.\n" +
                       "Format: email or email/game_number\n" +
                       "Games 1-64 are tournament mode (format locked to 1)",
                color = WatchColors.OnSurfaceDisabled,
                fontSize = 12.sp,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.weight(1f))

            // Info text
            Text(
                text = "Format can be changed from Mirror/Keep Score screens",
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
