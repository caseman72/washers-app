package com.manion.washers.watch

import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.MaterialTheme
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable

class MainActivity : ComponentActivity(), MessageClient.OnMessageReceivedListener {

    companion object {
        private const val TAG = "WatchMainActivity"
    }

    private lateinit var messageClient: MessageClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on while app is running
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Initialize message client
        messageClient = Wearable.getMessageClient(this)

        setContent {
            MaterialTheme {
                ScoreboardScreen()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        messageClient.addListener(this)
        Log.d(TAG, "Registered message listener")
    }

    override fun onPause() {
        super.onPause()
        messageClient.removeListener(this)
        Log.d(TAG, "Unregistered message listener")
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d(TAG, "Message received: ${messageEvent.path}")
        when (messageEvent.path) {
            DataLayerManager.REQUEST_STATE_PATH -> {
                Log.d(TAG, "Phone requested game state, resending...")
                DataLayerManager.getInstance(this).resendLastState()
            }
            DataLayerManager.FORMAT_PATH -> {
                val format = String(messageEvent.data).toIntOrNull() ?: 7
                Log.d(TAG, "Phone sent format: $format")
                DataLayerManager.setFormatFromPhone(format)
            }
            DataLayerManager.SHOW_ROUNDS_PATH -> {
                val showRounds = String(messageEvent.data).toBoolean()
                Log.d(TAG, "Phone sent showRounds: $showRounds")
                DataLayerManager.setShowRoundsFromPhone(showRounds)
            }
        }
    }
}
