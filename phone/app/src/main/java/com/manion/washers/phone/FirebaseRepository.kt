package com.manion.washers.phone

import android.util.Log
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ServerValue

/**
 * Repository for syncing game state to Firebase Realtime Database.
 *
 * Data structure:
 * /games/{namespace}/current - Live game state
 * /games/{namespace}/history/{timestamp} - Session history
 */
object FirebaseRepository {

    private const val TAG = "FirebaseRepository"
    private val database: FirebaseDatabase by lazy {
        val url = BuildConfig.FIREBASE_DATABASE_URL
        if (url.isBlank()) {
            Log.w(TAG, "FIREBASE_DATABASE_URL not configured in secrets.properties")
            FirebaseDatabase.getInstance()
        } else {
            FirebaseDatabase.getInstance(url)
        }
    }

    /**
     * Write current game state to Firebase.
     * Only writes if namespace is configured.
     */
    fun writeCurrentState(gameState: GameState) {
        val namespace = SettingsRepository.namespace.value
        Log.d(TAG, "writeCurrentState called, namespace='$namespace'")
        if (namespace.isBlank()) {
            Log.d(TAG, "No namespace configured, skipping Firebase write")
            return
        }

        val sanitizedNamespace = sanitizeEmail(namespace)
        val path = "games/$sanitizedNamespace/current"
        Log.d(TAG, "Writing to path: $path")
        val ref = database.getReference(path)

        val data = mapOf(
            "player1Score" to gameState.player1Score,
            "player2Score" to gameState.player2Score,
            "player1Games" to gameState.player1Games,
            "player2Games" to gameState.player2Games,
            "player1Rounds" to gameState.player1Rounds,
            "player2Rounds" to gameState.player2Rounds,
            "player1Color" to gameState.player1Color.name,
            "player2Color" to gameState.player2Color.name,
            "player1Name" to gameState.player1Name,
            "player2Name" to gameState.player2Name,
            "format" to gameState.format,
            "updatedAt" to ServerValue.TIMESTAMP
        )

        ref.setValue(data)
            .addOnSuccessListener {
                Log.i(TAG, "SUCCESS: Wrote current state to Firebase path: $path")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "FAILED to write current state to $path: ${e.message}", e)
            }
    }

    /**
     * Log a completed session to history.
     * Called when a player wins the series (best of X).
     */
    fun logSessionHistory(
        player1Games: Int,
        player2Games: Int,
        winner: Int,
        format: Int,
        player1Color: PlayerColor,
        player2Color: PlayerColor,
        player1Name: String,
        player2Name: String,
        startedAt: Long
    ) {
        val namespace = SettingsRepository.namespace.value
        if (namespace.isBlank()) {
            Log.d(TAG, "No namespace configured, skipping history write")
            return
        }

        val sanitizedNamespace = sanitizeEmail(namespace)
        val timestamp = System.currentTimeMillis()
        val ref = database.getReference("games/$sanitizedNamespace/history/$timestamp")

        val data = mapOf(
            "startedAt" to startedAt,
            "endedAt" to ServerValue.TIMESTAMP,
            "player1Games" to player1Games,
            "player2Games" to player2Games,
            "winner" to winner,
            "format" to format,
            "player1Color" to player1Color.name,
            "player2Color" to player2Color.name,
            "player1Name" to player1Name,
            "player2Name" to player2Name
        )

        ref.setValue(data)
            .addOnSuccessListener {
                Log.d(TAG, "Logged session history: winner=$winner, format=$format")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to log session history", e)
            }
    }

    /**
     * Sanitize email for use as Firebase path.
     * Firebase paths cannot contain: . $ # [ ] /
     */
    private fun sanitizeEmail(email: String): String {
        return email.lowercase()
            .replace(".", "_")
            .replace("$", "_")
            .replace("#", "_")
            .replace("[", "_")
            .replace("]", "_")
            .replace("/", "_")
    }
}
