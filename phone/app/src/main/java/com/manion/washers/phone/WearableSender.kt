package com.manion.washers.phone

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.NodeClient
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

object WearableSender {

    private const val TAG = "WearableSender"
    private const val FORMAT_PATH = "/format"
    private const val SHOW_ROUNDS_PATH = "/show_rounds"

    private var messageClient: MessageClient? = null
    private var nodeClient: NodeClient? = null
    private val scope = CoroutineScope(Dispatchers.IO)

    fun initialize(context: Context) {
        messageClient = Wearable.getMessageClient(context)
        nodeClient = Wearable.getNodeClient(context)
    }

    fun sendFormat(format: Int) {
        scope.launch {
            try {
                val nodes = nodeClient?.connectedNodes?.await() ?: return@launch
                if (nodes.isEmpty()) {
                    Log.d(TAG, "No connected nodes, cannot send format")
                    return@launch
                }
                val data = format.toString().toByteArray()
                nodes.forEach { node ->
                    messageClient?.sendMessage(node.id, FORMAT_PATH, data)?.await()
                    Log.d(TAG, "Sent format $format to node: ${node.displayName}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending format to watch", e)
            }
        }
    }

    fun sendShowRounds(showRounds: Boolean) {
        scope.launch {
            try {
                val nodes = nodeClient?.connectedNodes?.await() ?: return@launch
                if (nodes.isEmpty()) {
                    Log.d(TAG, "No connected nodes, cannot send showRounds")
                    return@launch
                }
                val data = showRounds.toString().toByteArray()
                nodes.forEach { node ->
                    messageClient?.sendMessage(node.id, SHOW_ROUNDS_PATH, data)?.await()
                    Log.d(TAG, "Sent showRounds $showRounds to node: ${node.displayName}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending showRounds to watch", e)
            }
        }
    }
}
