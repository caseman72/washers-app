package com.manion.washers.phone

import android.util.Log
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Data class representing a player.
 */
data class Player(
    val id: String,
    val name: String,
    val wins: Int = 0,
    val losses: Int = 0,
    val finalsWins: Int = 0,
    val finalsLosses: Int = 0,
    val teamWins: Int = 0,
    val teamLosses: Int = 0,
    val teamFinalsWins: Int = 0,
    val teamFinalsLosses: Int = 0,
    val archived: Boolean = false
)

/**
 * Repository for managing players in Firebase Realtime Database.
 *
 * Data structure:
 * /players/{namespace}/{playerId} - Player data
 */
object FirebasePlayersRepository {

    private const val TAG = "FirebasePlayersRepo"
    private val database: FirebaseDatabase by lazy {
        val url = BuildConfig.FIREBASE_DATABASE_URL
        if (url.isBlank()) {
            Log.w(TAG, "FIREBASE_DATABASE_URL not configured in secrets.properties")
            FirebaseDatabase.getInstance()
        } else {
            FirebaseDatabase.getInstance(url)
        }
    }

    private val _players = MutableStateFlow<List<Player>>(emptyList())
    val players: StateFlow<List<Player>> = _players.asStateFlow()

    private val _loading = MutableStateFlow(true)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private var currentListener: ValueEventListener? = null
    private var currentNamespace: String? = null

    /**
     * Subscribe to players for the given namespace.
     * Automatically unsubscribes from previous namespace.
     */
    fun subscribeToPlayers(namespace: String) {
        if (namespace.isBlank()) {
            _players.value = emptyList()
            _loading.value = false
            _error.value = "No namespace configured"
            return
        }

        // Unsubscribe from previous namespace if different
        if (currentNamespace != namespace) {
            unsubscribe()
        }

        currentNamespace = namespace
        _loading.value = true
        _error.value = null

        val sanitized = sanitizeEmail(namespace)
        val path = "players/$sanitized"
        val ref = database.getReference(path)

        Log.d(TAG, "Subscribing to players at: $path")

        currentListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val playersList = mutableListOf<Player>()

                for (childSnapshot in snapshot.children) {
                    val id = childSnapshot.key ?: continue
                    val name = childSnapshot.child("name").getValue(String::class.java) ?: continue
                    val wins = childSnapshot.child("wins").getValue(Int::class.java) ?: 0
                    val losses = childSnapshot.child("losses").getValue(Int::class.java) ?: 0
                    val finalsWins = childSnapshot.child("finalsWins").getValue(Int::class.java)
                        ?: childSnapshot.child("tournamentWins").getValue(Int::class.java) ?: 0
                    val finalsLosses = childSnapshot.child("finalsLosses").getValue(Int::class.java) ?: 0
                    val teamWins = childSnapshot.child("teamWins").getValue(Int::class.java) ?: 0
                    val teamLosses = childSnapshot.child("teamLosses").getValue(Int::class.java) ?: 0
                    val teamFinalsWins = childSnapshot.child("teamFinalsWins").getValue(Int::class.java)
                        ?: childSnapshot.child("teamTournamentWins").getValue(Int::class.java) ?: 0
                    val teamFinalsLosses = childSnapshot.child("teamFinalsLosses").getValue(Int::class.java) ?: 0
                    val archived = childSnapshot.child("archived").getValue(Boolean::class.java) ?: false

                    playersList.add(
                        Player(
                            id = id,
                            name = name,
                            wins = wins,
                            losses = losses,
                            finalsWins = finalsWins,
                            finalsLosses = finalsLosses,
                            teamWins = teamWins,
                            teamLosses = teamLosses,
                            teamFinalsWins = teamFinalsWins,
                            teamFinalsLosses = teamFinalsLosses,
                            archived = archived
                        )
                    )
                }

                // Sort by name
                playersList.sortBy { it.name.lowercase() }

                _players.value = playersList
                _loading.value = false
                _error.value = null
                Log.d(TAG, "Loaded ${playersList.size} players from $path")
            }

            override fun onCancelled(error: DatabaseError) {
                Log.e(TAG, "Failed to read players: ${error.message}")
                _loading.value = false
                _error.value = error.message
            }
        }

        ref.addValueEventListener(currentListener!!)
    }

    /**
     * Unsubscribe from current player updates.
     */
    fun unsubscribe() {
        currentListener?.let { listener ->
            currentNamespace?.let { namespace ->
                val sanitized = sanitizeEmail(namespace)
                val path = "players/$sanitized"
                database.getReference(path).removeEventListener(listener)
                Log.d(TAG, "Unsubscribed from players at: $path")
            }
        }
        currentListener = null
        currentNamespace = null
    }

    /**
     * Add a new player.
     */
    fun addPlayer(namespace: String, name: String) {
        if (namespace.isBlank() || name.isBlank()) {
            Log.w(TAG, "Cannot add player: namespace or name is blank")
            return
        }

        val sanitized = sanitizeEmail(namespace)
        val path = "players/$sanitized"
        val ref = database.getReference(path).push()

        val data = mapOf(
            "name" to name.trim(),
            "createdAt" to System.currentTimeMillis(),
            "archived" to false,
            "wins" to 0,
            "losses" to 0,
            "finalsWins" to 0,
            "finalsLosses" to 0,
            "teamWins" to 0,
            "teamLosses" to 0,
            "teamFinalsWins" to 0,
            "teamFinalsLosses" to 0
        )

        ref.setValue(data)
            .addOnSuccessListener {
                Log.i(TAG, "Added player '$name' with ID ${ref.key}")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to add player '$name': ${e.message}", e)
            }
    }

    /**
     * Delete a player.
     */
    fun deletePlayer(namespace: String, playerId: String) {
        if (namespace.isBlank() || playerId.isBlank()) {
            Log.w(TAG, "Cannot delete player: namespace or playerId is blank")
            return
        }

        val sanitized = sanitizeEmail(namespace)
        val path = "players/$sanitized/$playerId"
        val ref = database.getReference(path)

        ref.removeValue()
            .addOnSuccessListener {
                Log.i(TAG, "Deleted player $playerId")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Failed to delete player $playerId: ${e.message}", e)
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
