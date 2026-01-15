package com.manion.washers.phone

import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Repository that holds the current GameState received from the Watch.
 * Exposes state as a StateFlow for Compose UI to observe.
 */
object WearableRepository {

    private const val TAG = "WearableRepository"

    private val _gameState = MutableStateFlow<GameState?>(null)
    val gameState: StateFlow<GameState?> = _gameState.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    // Track session start time for history logging
    private var sessionStartTime = System.currentTimeMillis()

    /**
     * Update game state from JSON received from watch.
     * Also syncs to Firebase if namespace is configured.
     * Detects round wins and logs session history.
     */
    fun updateFromJson(json: String) {
        try {
            val previousState = _gameState.value
            val newState = parseGameStateJson(json)

            // Detect if a round was won (rounds increased)
            if (previousState != null) {
                val p1RoundWon = newState.player1Rounds > previousState.player1Rounds
                val p2RoundWon = newState.player2Rounds > previousState.player2Rounds

                if (p1RoundWon || p2RoundWon) {
                    val winner = if (p1RoundWon) 1 else 2
                    // Use the previous state's games (before reset) for the final count
                    val gamesNeeded = (previousState.format / 2) + 1
                    val finalP1Games = if (p1RoundWon) gamesNeeded else previousState.player1Games
                    val finalP2Games = if (p2RoundWon) gamesNeeded else previousState.player2Games

                    Log.d(TAG, "Round won by player $winner, logging history")
                    FirebaseRepository.logSessionHistory(
                        player1Games = finalP1Games,
                        player2Games = finalP2Games,
                        winner = winner,
                        format = previousState.format,
                        player1Color = previousState.player1Color,
                        player2Color = previousState.player2Color,
                        player1Name = SettingsRepository.player1Name.value,
                        player2Name = SettingsRepository.player2Name.value,
                        startedAt = sessionStartTime
                    )
                    // Reset session start time for next round
                    sessionStartTime = System.currentTimeMillis()
                }
            }

            _gameState.value = newState
            _isConnected.value = true
            Log.d(TAG, "Updated state: $newState")

            // Sync to Firebase
            FirebaseRepository.writeCurrentState(newState)
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing JSON: $json", e)
        }
    }

    /**
     * Parse JSON to GameState.
     * Format: {"p1s":0,"p2s":0,"p1g":0,"p2g":0,"p1r":0,"p2r":0,"p1c":"ORANGE","p2c":"BLACK","p1n":"","p2n":"","fmt":7}
     */
    private fun parseGameStateJson(json: String): GameState {
        val cleanJson = json.trim()

        fun extractInt(key: String, default: Int = 0): Int {
            val pattern = "\"$key\":(\\d+)".toRegex()
            return pattern.find(cleanJson)?.groupValues?.get(1)?.toIntOrNull() ?: default
        }

        fun extractString(key: String): String {
            val pattern = "\"$key\":\"([^\"]*)\"".toRegex()
            return pattern.find(cleanJson)?.groupValues?.get(1) ?: ""
        }

        val p1Score = extractInt("p1s")
        val p2Score = extractInt("p2s")
        val p1Games = extractInt("p1g")
        val p2Games = extractInt("p2g")
        val p1Rounds = extractInt("p1r")
        val p2Rounds = extractInt("p2r")
        val format = extractInt("fmt", 7)
        val p1ColorName = extractString("p1c")
        val p2ColorName = extractString("p2c")
        val p1Name = extractString("p1n")
        val p2Name = extractString("p2n")

        val p1Color = try {
            PlayerColor.valueOf(p1ColorName)
        } catch (e: Exception) {
            PlayerColor.DEFAULT_PLAYER1
        }

        val p2Color = try {
            PlayerColor.valueOf(p2ColorName)
        } catch (e: Exception) {
            PlayerColor.DEFAULT_PLAYER2
        }

        return GameState(
            player1Score = p1Score,
            player2Score = p2Score,
            player1Games = p1Games,
            player2Games = p2Games,
            player1Rounds = p1Rounds,
            player2Rounds = p2Rounds,
            player1Color = p1Color,
            player2Color = p2Color,
            player1Name = p1Name,
            player2Name = p2Name,
            format = format
        )
    }

    /**
     * Reset connection state (for testing).
     */
    fun reset() {
        _gameState.value = null
        _isConnected.value = false
        sessionStartTime = System.currentTimeMillis()
    }
}
