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
        val namespace = SettingsRepository.getFullNamespace()
        Log.d(TAG, "writeCurrentState called, namespace='$namespace'")
        if (namespace.isBlank()) {
            Log.d(TAG, "No namespace configured, skipping Firebase write")
            return
        }

        val (email, table) = parseNamespace(namespace)
        val path = "games/$email/$table/current"
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
            "player1Name" to SettingsRepository.player1Name.value,
            "player2Name" to SettingsRepository.player2Name.value,
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
        val namespace = SettingsRepository.getFullNamespace()
        if (namespace.isBlank()) {
            Log.d(TAG, "No namespace configured, skipping history write")
            return
        }

        val (email, table) = parseNamespace(namespace)
        val timestamp = System.currentTimeMillis()
        val ref = database.getReference("games/$email/$table/history/$timestamp")

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
     * Read current game state from Firebase and sync player names.
     * Called when entering Mirror mode to get names set by web tournament.
     */
    fun readAndSyncNames() {
        val namespace = SettingsRepository.getFullNamespace()
        Log.d(TAG, "readAndSyncNames called, namespace='$namespace'")
        if (namespace.isBlank()) {
            Log.d(TAG, "No namespace configured, skipping Firebase read")
            return
        }

        val (email, table) = parseNamespace(namespace)
        val path = "games/$email/$table/current"
        Log.d(TAG, "Reading from path: $path")
        val ref = database.getReference(path)

        ref.get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.exists()) {
                    val player1Name = snapshot.child("player1Name").getValue(String::class.java) ?: ""
                    val player2Name = snapshot.child("player2Name").getValue(String::class.java) ?: ""
                    Log.i(TAG, "SUCCESS: Read names from Firebase: '$player1Name' vs '$player2Name'")

                    // Update local settings with names from Firebase
                    if (player1Name.isNotBlank() && player1Name != "TBD") {
                        SettingsRepository.setPlayer1Name(player1Name)
                    }
                    if (player2Name.isNotBlank() && player2Name != "TBD") {
                        SettingsRepository.setPlayer2Name(player2Name)
                    }
                } else {
                    Log.d(TAG, "No data at path: $path")
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "FAILED to read from $path: ${e.message}", e)
            }
    }

    /**
     * Parse namespace into email and table number.
     * "casey@manion.com/1" → ("casey@manion_com", "1")
     * "casey@manion.com" → ("casey@manion_com", "1")
     */
    private fun parseNamespace(namespace: String): Pair<String, String> {
        val parts = namespace.split("/", limit = 2)
        val email = sanitizeEmail(parts[0])
        val table = if (parts.size > 1) parts[1] else "1"
        return Pair(email, table)
    }

    /**
     * Check if there's an active tournament for the current namespace.
     * An active tournament has archived=false and status is 'active' or 'setup'.
     * Calls callback with true if active tournament exists, false otherwise.
     */
    fun checkActiveTournament(callback: (Boolean) -> Unit) {
        val namespace = SettingsRepository.getFullNamespace()
        if (namespace.isBlank()) {
            callback(false)
            return
        }

        // Get just the email part (without game number)
        val email = sanitizeEmail(namespace.split("/", limit = 2)[0])
        val path = "tournaments/$email"
        Log.d(TAG, "Checking for active tournament at: $path")

        database.getReference(path).get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.exists()) {
                    // Check each tournament for an active one
                    var hasActive = false
                    snapshot.children.forEach { child ->
                        val archived = child.child("archived").getValue(Boolean::class.java) ?: false
                        val status = child.child("status").getValue(String::class.java) ?: ""
                        if (!archived && (status == "active" || status == "setup")) {
                            hasActive = true
                            Log.d(TAG, "Found active tournament: ${child.key}, status=$status")
                        }
                    }
                    callback(hasActive)
                } else {
                    Log.d(TAG, "No tournaments found at path: $path")
                    callback(false)
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to check tournaments: ${e.message}", e)
                callback(false)
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
