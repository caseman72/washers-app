package com.manion.washers.watch

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Manages Watch → Phone communication via Wear OS Data Layer API.
 * Sends GameState updates to the paired phone app.
 * Singleton pattern to allow responding to state requests from phone.
 */
class DataLayerManager private constructor(context: Context) {

    private val dataClient = Wearable.getDataClient(context)
    private val messageClient = Wearable.getMessageClient(context)
    private val nodeClient = Wearable.getNodeClient(context)
    private val scope = CoroutineScope(Dispatchers.IO)

    /**
     * Pending settings from Phone that need user confirmation.
     */
    data class PendingSettings(
        val format: Int,
        val showRounds: Boolean
    )

    companion object {
        private const val TAG = "DataLayerManager"
        const val GAME_STATE_PATH = "/game_state"
        const val MESSAGE_PATH = "/game_state"
        const val REQUEST_STATE_PATH = "/request_state"
        const val FORMAT_PATH = "/format"
        const val SHOW_ROUNDS_PATH = "/show_rounds"

        @Volatile
        private var instance: DataLayerManager? = null
        private var lastGameState: GameState? = null

        // Current applied settings (initialized to Watch defaults)
        private val _formatFromPhone = MutableStateFlow<Int?>(1)  // Default: single game
        val formatFromPhone: StateFlow<Int?> = _formatFromPhone.asStateFlow()

        private val _showRoundsFromPhone = MutableStateFlow<Boolean?>(false)  // Default: games only
        val showRoundsFromPhone: StateFlow<Boolean?> = _showRoundsFromPhone.asStateFlow()

        // Pending settings awaiting user confirmation
        private var pendingFormat: Int? = null
        private var pendingShowRounds: Boolean? = null
        private val _pendingSettings = MutableStateFlow<PendingSettings?>(null)
        val pendingSettings: StateFlow<PendingSettings?> = _pendingSettings.asStateFlow()

        fun getInstance(context: Context): DataLayerManager {
            return instance ?: synchronized(this) {
                instance ?: DataLayerManager(context.applicationContext).also { instance = it }
            }
        }

        fun getLastGameState(): GameState? = lastGameState

        fun setFormatFromPhone(format: Int) {
            Log.d(TAG, "Format received from phone: $format, current: ${_formatFromPhone.value}")
            if (format != _formatFromPhone.value) {
                // Different from current - queue as pending
                pendingFormat = format
                updatePendingSettings()
            }
        }

        fun setShowRoundsFromPhone(showRounds: Boolean) {
            Log.d(TAG, "ShowRounds received from phone: $showRounds, current: ${_showRoundsFromPhone.value}")
            if (showRounds != _showRoundsFromPhone.value) {
                // Different from current - queue as pending
                pendingShowRounds = showRounds
                updatePendingSettings()
            }
        }

        private fun updatePendingSettings() {
            val format = pendingFormat ?: _formatFromPhone.value ?: 1
            val showRounds = pendingShowRounds ?: _showRoundsFromPhone.value ?: false

            // Only show dialog if something is actually pending
            if (pendingFormat != null || pendingShowRounds != null) {
                _pendingSettings.value = PendingSettings(format, showRounds)
            }
        }

        fun acceptPendingSettings() {
            pendingFormat?.let { _formatFromPhone.value = it }
            pendingShowRounds?.let { _showRoundsFromPhone.value = it }
            clearPendingSettings()
            Log.d(TAG, "Pending settings accepted")
        }

        fun rejectPendingSettings() {
            clearPendingSettings()
            Log.d(TAG, "Pending settings rejected")
        }

        private fun clearPendingSettings() {
            pendingFormat = null
            pendingShowRounds = null
            _pendingSettings.value = null
        }
    }

    /**
     * Send game state to phone via DataClient (persistent) and MessageClient (instant).
     * Call this on every state change.
     */
    suspend fun sendGameState(gameState: GameState) {
        try {
            lastGameState = gameState

            // Send via DataClient for persistence
            sendDataItem(gameState)

            // Send via MessageClient for instant delivery
            sendMessage(gameState)

            Log.d(TAG, "Sent game state: ${gameState.toJson()}")
        } catch (e: Exception) {
            Log.e(TAG, "Error sending game state", e)
        }
    }

    /**
     * Resend the last known game state (called when phone requests it).
     */
    fun resendLastState() {
        val state = lastGameState ?: return
        scope.launch {
            try {
                sendMessage(state)
                Log.d(TAG, "Resent game state on request: ${state.toJson()}")
            } catch (e: Exception) {
                Log.e(TAG, "Error resending game state", e)
            }
        }
    }

    /**
     * Send persistent data item that survives Bluetooth disconnects.
     */
    private suspend fun sendDataItem(gameState: GameState) {
        val request = PutDataMapRequest.create(GAME_STATE_PATH).apply {
            dataMap.putString("json", gameState.toJson())
            dataMap.putLong("timestamp", System.currentTimeMillis())
        }
        dataClient.putDataItem(request.asPutDataRequest().setUrgent()).await()
    }

    /**
     * Send instant message for immediate UI update on phone.
     */
    private suspend fun sendMessage(gameState: GameState) {
        try {
            val nodes = nodeClient.connectedNodes.await()
            val json = gameState.toJson()
            nodes.forEach { node ->
                messageClient.sendMessage(node.id, MESSAGE_PATH, json.toByteArray()).await()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Message send failed (phone may not be connected)", e)
        }
    }
}

/**
 * Serialize GameState to JSON string.
 */
fun GameState.toJson(): String = buildString {
    append("{")
    append("\"p1s\":$player1Score,")
    append("\"p2s\":$player2Score,")
    append("\"p1g\":$player1Games,")
    append("\"p2g\":$player2Games,")
    append("\"p1r\":$player1Rounds,")
    append("\"p2r\":$player2Rounds,")
    append("\"p1c\":\"${player1Color.name}\",")
    append("\"p2c\":\"${player2Color.name}\",")
    append("\"fmt\":$format")
    append("}")
}
