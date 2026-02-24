package com.manion.washers.phone.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manion.washers.phone.SettingsRepository
import com.manion.washers.phone.ui.theme.WatchColors

enum class AppMode {
    KEEP_SCORE,
    PLAYERS
}

@Composable
fun ModePickerScreen(
    initialMode: AppMode? = null,
    onModeSelected: (AppMode) -> Unit
) {
    val baseNamespace by SettingsRepository.baseNamespace.collectAsState()
    var isEditing by remember { mutableStateOf(false) }
    var editText by remember(baseNamespace) { mutableStateOf(baseNamespace) }

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

            Spacer(modifier = Modifier.height(8.dp))

            // Namespace display/edit
            if (isEditing) {
                OutlinedTextField(
                    value = editText,
                    onValueChange = { editText = it },
                    label = { Text("Namespace") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            SettingsRepository.setBaseNamespace(editText)
                            isEditing = false
                        }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = WatchColors.OnSurface,
                        unfocusedTextColor = WatchColors.OnSurface,
                        focusedBorderColor = WatchColors.Primary,
                        unfocusedBorderColor = WatchColors.OnSurfaceDisabled,
                        focusedLabelColor = WatchColors.Primary,
                        unfocusedLabelColor = WatchColors.OnSurfaceDisabled
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Button(
                        onClick = {
                            SettingsRepository.setBaseNamespace(editText)
                            isEditing = false
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = WatchColors.Primary
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save")
                    }
                    Button(
                        onClick = {
                            editText = baseNamespace
                            isEditing = false
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = WatchColors.Surface
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel", color = WatchColors.OnSurface)
                    }
                }
            } else {
                Text(
                    text = if (baseNamespace.isBlank()) "Tap to set namespace" else baseNamespace,
                    color = WatchColors.OnSurface.copy(alpha = 0.6f),
                    fontSize = 18.sp,
                    modifier = Modifier.clickable {
                        editText = baseNamespace
                        isEditing = true
                    }
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Mode options
            ModeOption(
                title = "Keep Score",
                description = "Score tracking",
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
