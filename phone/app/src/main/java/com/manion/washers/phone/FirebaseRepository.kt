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
     * For tournament games (1-64), player names are NOT written - they're controlled by the bracket.
     * @param onComplete Optional callback called after successful write
     */
    fun writeCurrentState(gameState: GameState, onComplete: (() -> Unit)? = null) {
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

        val isTournamentGame = SettingsRepository.isTournamentGame()

        val data = mutableMapOf<String, Any>(
            "player1Score" to gameState.player1Score,
            "player2Score" to gameState.player2Score,
            "player1Games" to gameState.player1Games,
            "player2Games" to gameState.player2Games,
            "player1Rounds" to gameState.player1Rounds,
            "player2Rounds" to gameState.player2Rounds,
            "player1Color" to gameState.player1Color.name,
            "player2Color" to gameState.player2Color.name,
            "format" to gameState.format,
            "updatedAt" to ServerValue.TIMESTAMP
        )

        // Only include names for non-tournament games (tournament names are set by bracket)
        if (!isTournamentGame) {
            data["player1Name"] = SettingsRepository.player1Name.value
            data["player2Name"] = SettingsRepository.player2Name.value
        }

        // Use updateChildren instead of setValue to preserve fields we don't write
        // (like player1Id, player2Id for tournament games)
        ref.updateChildren(data)
            .addOnSuccessListener {
                Log.i(TAG, "SUCCESS: Wrote current state to Firebase path: $path")
                onComplete?.invoke()
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
                    Log.i(TAG, "SUCCESS: Read from Firebase: '$player1Name' vs '$player2Name'")

                    // Update local settings with names from Firebase (clear if blank)
                    if (player1Name.isNotBlank() && player1Name != "TBD") {
                        SettingsRepository.setPlayer1Name(player1Name)
                    } else {
                        SettingsRepository.setPlayer1Name("")
                    }
                    if (player2Name.isNotBlank() && player2Name != "TBD") {
                        SettingsRepository.setPlayer2Name(player2Name)
                    } else {
                        SettingsRepository.setPlayer2Name("")
                    }
                } else {
                    Log.d(TAG, "No data at path: $path - clearing names")
                    // No data at path - clear names
                    SettingsRepository.setPlayer1Name("")
                    SettingsRepository.setPlayer2Name("")
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "FAILED to read from $path: ${e.message}", e)
            }
    }

    /**
     * Read current game state from Firebase.
     * @param callback Called with the game state (or null if not found/error)
     */
    fun readGameState(callback: (GameState?) -> Unit) {
        val namespace = SettingsRepository.getFullNamespace()
        Log.d(TAG, "readGameState called, namespace='$namespace'")
        if (namespace.isBlank()) {
            Log.d(TAG, "No namespace configured, returning null")
            callback(null)
            return
        }

        val (email, table) = parseNamespace(namespace)
        val path = "games/$email/$table/current"
        Log.d(TAG, "Reading game state from path: $path")
        val ref = database.getReference(path)

        ref.get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.exists()) {
                    val player1Score = snapshot.child("player1Score").getValue(Int::class.java) ?: 0
                    val player2Score = snapshot.child("player2Score").getValue(Int::class.java) ?: 0
                    val player1Games = snapshot.child("player1Games").getValue(Int::class.java) ?: 0
                    val player2Games = snapshot.child("player2Games").getValue(Int::class.java) ?: 0
                    val player1Rounds = snapshot.child("player1Rounds").getValue(Int::class.java) ?: 0
                    val player2Rounds = snapshot.child("player2Rounds").getValue(Int::class.java) ?: 0
                    val player1ColorStr = snapshot.child("player1Color").getValue(String::class.java) ?: "ORANGE"
                    val player2ColorStr = snapshot.child("player2Color").getValue(String::class.java) ?: "BLACK"
                    val player1Name = snapshot.child("player1Name").getValue(String::class.java) ?: ""
                    val player2Name = snapshot.child("player2Name").getValue(String::class.java) ?: ""
                    val format = snapshot.child("format").getValue(Int::class.java) ?: 1

                    val player1Color = try { PlayerColor.valueOf(player1ColorStr) } catch (_: Exception) { PlayerColor.ORANGE }
                    val player2Color = try { PlayerColor.valueOf(player2ColorStr) } catch (_: Exception) { PlayerColor.BLACK }

                    val gameState = GameState(
                        player1Score = player1Score,
                        player2Score = player2Score,
                        player1Games = player1Games,
                        player2Games = player2Games,
                        player1Rounds = player1Rounds,
                        player2Rounds = player2Rounds,
                        player1Color = player1Color,
                        player2Color = player2Color,
                        format = format
                    )
                    Log.i(TAG, "SUCCESS: Read game state from Firebase: $gameState")

                    // Also sync player names
                    if (player1Name.isNotBlank() && player1Name != "TBD") {
                        SettingsRepository.setPlayer1Name(player1Name)
                    } else {
                        SettingsRepository.setPlayer1Name("")
                    }
                    if (player2Name.isNotBlank() && player2Name != "TBD") {
                        SettingsRepository.setPlayer2Name(player2Name)
                    } else {
                        SettingsRepository.setPlayer2Name("")
                    }

                    callback(gameState)
                } else {
                    Log.d(TAG, "No data at path: $path")
                    callback(null)
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "FAILED to read game state from $path: ${e.message}", e)
                callback(null)
            }
    }

    /**
     * Check if a specific game number is complete in the active tournament.
     * A game is complete if the bracket match has a winnerId set.
     * Computes game numbers from bracket structure (same algorithm as web).
     * @param gameNumber The game number to check (1-64)
     * @param callback Called with true if game is complete, false otherwise
     */
    fun checkGameComplete(gameNumber: Int, callback: (Boolean) -> Unit) {
        val namespace = SettingsRepository.getFullNamespace()
        if (namespace.isBlank()) {
            callback(false)
            return
        }

        val email = sanitizeEmail(namespace.split("/", limit = 2)[0])
        val path = "tournaments/$email"
        Log.d(TAG, "Checking game $gameNumber complete at: $path")

        database.getReference(path).get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.exists()) {
                    // Find active tournament
                    var isComplete = false
                    for (child in snapshot.children) {
                        val archived = child.child("archived").getValue(Boolean::class.java) ?: false
                        val status = child.child("status").getValue(String::class.java) ?: ""
                        if (!archived && (status == "active" || status == "setup")) {
                            // Found active tournament - compute game numbers from bracket
                            val bracket = child.child("bracket")
                            val gameNumbers = computeGameNumbers(bracket)

                            // Find the match ID for this game number
                            val matchId = gameNumbers.entries.find { it.value == gameNumber }?.key

                            if (matchId != null) {
                                // Find the match and check if it has a winner
                                for (match in bracket.children) {
                                    val id = match.child("id").getValue(String::class.java)
                                    if (id == matchId) {
                                        val winnerId = match.child("winnerId").getValue(String::class.java)
                                        isComplete = !winnerId.isNullOrBlank()
                                        Log.d(TAG, "Game $gameNumber (match $matchId): winnerId=$winnerId, complete=$isComplete")
                                        break
                                    }
                                }
                            } else {
                                Log.d(TAG, "Game $gameNumber not found in bracket")
                            }
                            break
                        }
                    }
                    callback(isComplete)
                } else {
                    Log.d(TAG, "No tournaments found at path: $path")
                    callback(false)
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to check game complete: ${e.message}", e)
                callback(false)
            }
    }

    /**
     * Compute game numbers from bracket structure (same algorithm as web BracketScreen).
     * Returns a Map from matchId to gameNumber.
     */
    private fun computeGameNumbers(bracket: com.google.firebase.database.DataSnapshot): Map<String, Int> {
        val numbers = mutableMapOf<String, Int>()
        var gameNum = 1

        // Parse bracket into list of match data
        data class MatchData(
            val id: String,
            val round: Int,
            val position: Int,
            val bracketType: String,
            val player1Id: String?,
            val player2Id: String?,
            val isByeMatch: Boolean,
            val nextMatchId: String?
        )

        val matches = bracket.children.mapNotNull { match ->
            val id = match.child("id").getValue(String::class.java) ?: return@mapNotNull null
            MatchData(
                id = id,
                round = match.child("round").getValue(Int::class.java) ?: 0,
                position = match.child("position").getValue(Int::class.java) ?: 0,
                bracketType = match.child("bracket").getValue(String::class.java) ?: "winners",
                player1Id = match.child("player1Id").getValue(String::class.java),
                player2Id = match.child("player2Id").getValue(String::class.java),
                isByeMatch = match.child("isByeMatch").getValue(Boolean::class.java) ?: false,
                nextMatchId = match.child("nextMatchId").getValue(String::class.java)
            )
        }

        // Helper: check if a match is structurally a BYE
        fun isStructuralBye(match: MatchData): Boolean {
            if (match.isByeMatch) return true
            if (match.round == 1 && match.bracketType == "winners") {
                val hasP1 = !match.player1Id.isNullOrBlank()
                val hasP2 = !match.player2Id.isNullOrBlank()
                return (hasP1 && !hasP2) || (!hasP1 && hasP2)
            }
            return false
        }

        // Helper: check if match is immediately playable
        fun isImmediatelyPlayable(match: MatchData): Boolean {
            if (isStructuralBye(match)) return false
            if (match.round == 1 && match.bracketType == "winners") return true
            val feeders = matches.filter { it.nextMatchId == match.id }
            if (feeders.isEmpty()) return false
            return feeders.all { isStructuralBye(it) }
        }

        // Get matches by round and bracket type (excluding grand finals)
        fun getMatchesByRound(bracketType: String): Map<Int, List<MatchData>> {
            return matches
                .filter { it.bracketType == bracketType && it.id != "grand-finals" && it.id != "grand-finals-2" }
                .groupBy { it.round }
        }

        val winnersRounds = getMatchesByRound("winners")
        val losersRounds = getMatchesByRound("losers")

        val maxRound = maxOf(
            winnersRounds.keys.maxOrNull() ?: 0,
            losersRounds.keys.maxOrNull() ?: 0
        )

        val finalsGame1 = matches.find { it.id == "grand-finals" }
        val finalsGame2 = matches.find { it.id == "grand-finals-2" }

        // Number games by round
        for (round in 1..maxRound) {
            val wbMatches = winnersRounds[round] ?: emptyList()
            val lbMatches = losersRounds[round] ?: emptyList()
            val allMatches = wbMatches + lbMatches

            val immediate = mutableListOf<MatchData>()
            val waiting = mutableListOf<MatchData>()

            allMatches.forEach { match ->
                if (isStructuralBye(match)) return@forEach
                if (isImmediatelyPlayable(match)) {
                    immediate.add(match)
                } else {
                    waiting.add(match)
                }
            }

            immediate.sortBy { it.position }
            waiting.sortBy { it.position }

            immediate.forEach { numbers[it.id] = gameNum++ }
            waiting.forEach { numbers[it.id] = gameNum++ }

            if (round == maxRound && finalsGame1 != null) {
                numbers[finalsGame1.id] = gameNum++
            }
        }

        if (finalsGame2 != null) {
            numbers[finalsGame2.id] = gameNum++
        }

        return numbers
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
