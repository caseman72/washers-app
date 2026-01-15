package com.manion.washers.phone

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp

/**
 * Player color options matching the watch app.
 * Order matters for display in the color picker.
 */
enum class PlayerColor(
    val displayName: String,
    val background: Color,
    val text: Color
) {
    ORANGE("Orange", Color(0xFFD35400), Color.White),
    BLACK("Black", Color(0xFF1A1A1A), Color.White),
    SILVER("Silver", Color(0xFFC0C0C0), Color.Black),
    RED("Red", Color(0xFFC0392B), Color.White),
    WHITE("White", Color(0xFFFFFFFF), Color.Black),
    BLUE("Blue", Color(0xFF2980B9), Color.White),
    YELLOW("Yellow", Color(0xFFF1C40F), Color.Black),
    PURPLE("Purple", Color(0xFF8E44AD), Color.White),
    GREEN("Green", Color(0xFF27AE60), Color.White),
    BROWN("Brown", Color(0xFF795548), Color.White);

    /** Darker variant for +/- buttons */
    val darker: Color get() = lerp(background, Color.Black, 0.25f)

    companion object {
        val DEFAULT_PLAYER1 = ORANGE
        val DEFAULT_PLAYER2 = BLACK
    }
}
