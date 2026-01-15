package com.manion.washers.phone.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * Watch app color palette - shared across phone app for consistency
 */
object WatchColors {
    val Background = Color(0xFF515151)       // Mid-gray
    val Surface = Color(0xFF444444)          // Darker gray (UI elements)
    val SurfaceSelected = Color(0xFF5A5A5A)  // Slightly lighter when selected
    val SurfaceDisabled = Color(0xFF3A3A3A)  // Darker when disabled
    val Primary = Color(0xFFD35400)          // Orange accent
    val Secondary = Color(0xFF4CAF50)        // Green (confirm buttons)
    val OnSurface = Color.White
    val OnSurfaceDisabled = Color.Gray
    val DialogOverlay = Color(0xDD000000)    // Semi-transparent black
}

private val DarkColorScheme = darkColorScheme(
    primary = WatchColors.Primary,
    secondary = WatchColors.Secondary,
    background = WatchColors.Background,
    surface = WatchColors.Surface,
    surfaceVariant = WatchColors.SurfaceSelected,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun WashersPhoneTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
