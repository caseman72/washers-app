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
     * showRounds is inferred from format > 1
     */
    data class PendingSettings(
        val format: Int
    ) {
        val showRounds: Boolean get() = format > 1
    }

    companion object {
        private const val TAG = "DataLayerManager"
        const val GAME_STATE_PATH = "/game_state"
        const val MESSAGE_PATH = "/game_state"
        const val REQUEST_STATE_PATH = "/request_state"
        const val REQUEST_SETTINGS_PATH = "/request_settings"
        const val FORMAT_PATH = "/format"
        const val RESET_PATH = "/reset"

        @Volatile
        private var instance: DataLayerManager? = null
        private var lastGameState: GameState? = null

        // Current applied settings (initialized to Watch defaults)
        private val _formatFromPhone = MutableStateFlow<Int?>(1)  // Default: single game
        val formatFromPhone: StateFlow<Int?> = _formatFromPhone.asStateFlow()

        // Pending settings awaiting user confirmation
        private var pendingFormat: Int? = null
        private val _pendingSettings = MutableStateFlow<PendingSettings?>(null)
        val pendingSettings: StateFlow<PendingSettings?> = _pendingSettings.asStateFlow()

        // Reset trigger from Phone (incremented when reset message received)
        private val _resetTrigger = MutableStateFlow(0)
        val resetTrigger: StateFlow<Int> = _resetTrigger.asStateFlow()

        fun getInstance(context: Context): DataLayerManager {
            return instance ?: synchronized(this) {
                instance ?: DataLayerManager(context.applicationContext).also { instance = it }
            }
        }

        fun setFormatFromPhone(format: Int) {
            Log.d(TAG, "Format received from phone: $format, current: ${_formatFromPhone.value}, pending: $pendingFormat")
            // Show dialog if:
            // 1. Format differs from current applied value, OR
            // 2. There's already a pending dialog and the new format is different from pending
            if (format != _formatFromPhone.value || (pendingFormat != null && format != pendingFormat)) {
                pendingFormat = format
                updatePendingSettings()
            }
        }

        private fun updatePendingSettings() {
            val format = pendingFormat ?: _formatFromPhone.value ?: 1

            // Only show dialog if format is actually pending
            if (pendingFormat != null) {
                _pendingSettings.value = PendingSettings(format)
            }
        }

        fun acceptPendingSettings() {
            pendingFormat?.let { _formatFromPhone.value = it }
            clearPendingSettings()
            Log.d(TAG, "Pending settings accepted")
        }

        fun rejectPendingSettings() {
            clearPendingSettings()
            Log.d(TAG, "Pending settings rejected")
        }

        private fun clearPendingSettings() {
            pendingFormat = null
            _pendingSettings.value = null
        }

        fun triggerReset() {
            Log.d(TAG, "Reset triggered from Phone")
            _resetTrigger.value++
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
     * Request settings from Phone (called on Watch startup).
     */
    fun requestSettingsFromPhone() {
        scope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                nodes.forEach { node ->
                    messageClient.sendMessage(node.id, REQUEST_SETTINGS_PATH, byteArrayOf()).await()
                    Log.d(TAG, "Requested settings from phone: ${node.displayName}")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to request settings from phone", e)
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
