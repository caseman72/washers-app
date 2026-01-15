package com.manion.washers.phone

import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.NodeClient
import com.google.android.gms.wearable.Wearable
import com.manion.washers.phone.navigation.NavGraph
import com.manion.washers.phone.ui.theme.WashersPhoneTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class MainActivity : ComponentActivity(), DataClient.OnDataChangedListener, MessageClient.OnMessageReceivedListener {

    companion object {
        private const val TAG = "MainActivity"
        private const val GAME_STATE_PATH = "/game_state"
        private const val REQUEST_STATE_PATH = "/request_state"
    }

    private lateinit var dataClient: DataClient
    private lateinit var messageClient: MessageClient
    private lateinit var nodeClient: NodeClient
    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on while app is running
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Initialize Wearable clients
        dataClient = Wearable.getDataClient(this)
        messageClient = Wearable.getMessageClient(this)
        nodeClient = Wearable.getNodeClient(this)

        // Initialize sender for Phone → Watch messaging
        WearableSender.initialize(this)

        // Initialize settings repository
        SettingsRepository.initialize(this)

        // Sign in anonymously for Firebase access
        scope.launch {
            AuthRepository.signInAnonymously()
        }

        setContent {
            WashersPhoneTheme {
                NavGraph()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Register listeners when app is visible
        dataClient.addListener(this)
        messageClient.addListener(this)
        Log.d(TAG, "Registered Data Layer listeners")

        // Request current state from watch
        requestStateFromWatch()

        // Send current settings to watch
        WearableSender.sendFormat(SettingsRepository.format.value)
        WearableSender.sendShowRounds(SettingsRepository.showRounds.value)
    }

    private fun requestStateFromWatch() {
        scope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                if (nodes.isEmpty()) {
                    Log.d(TAG, "No connected nodes, cannot request state")
                    return@launch
                }
                nodes.forEach { node ->
                    messageClient.sendMessage(node.id, REQUEST_STATE_PATH, byteArrayOf()).await()
                    Log.d(TAG, "Sent state request to node: ${node.displayName}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error requesting state from watch", e)
            }
        }
    }

    override fun onPause() {
        super.onPause()
        // Unregister listeners when app goes to background
        dataClient.removeListener(this)
        messageClient.removeListener(this)
        Log.d(TAG, "Unregistered Data Layer listeners")
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d(TAG, "onDataChanged: ${dataEvents.count} events")
        dataEvents.forEach { event ->
            val uri = event.dataItem.uri
            Log.d(TAG, "Data changed path: ${uri.path}")
            if (uri.path == GAME_STATE_PATH) {
                try {
                    val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                    val json = dataMap.getString("json") ?: return@forEach
                    Log.d(TAG, "Received game state: $json")
                    WearableRepository.updateFromJson(json)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing data", e)
                }
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d(TAG, "onMessageReceived: ${messageEvent.path}")
        if (messageEvent.path == GAME_STATE_PATH) {
            try {
                val json = String(messageEvent.data)
                Log.d(TAG, "Received message: $json")
                WearableRepository.updateFromJson(json)
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing message", e)
            }
        }
    }
}
