package com.manion.washers.phone

import android.annotation.SuppressLint
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
    private const val RESET_PATH = "/reset"

    @SuppressLint("StaticFieldLeak")
    private var messageClient: MessageClient? = null
    @SuppressLint("StaticFieldLeak")
    private var nodeClient: NodeClient? = null
    private val scope = CoroutineScope(Dispatchers.IO)

    fun initialize(context: Context) {
        // Use applicationContext to avoid memory leaks from holding Activity references
        val appContext = context.applicationContext
        messageClient = Wearable.getMessageClient(appContext)
        nodeClient = Wearable.getNodeClient(appContext)
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

    fun sendReset() {
        scope.launch {
            try {
                val nodes = nodeClient?.connectedNodes?.await() ?: return@launch
                if (nodes.isEmpty()) {
                    Log.d(TAG, "No connected nodes, cannot send reset")
                    return@launch
                }
                nodes.forEach { node ->
                    messageClient?.sendMessage(node.id, RESET_PATH, byteArrayOf())?.await()
                    Log.d(TAG, "Sent reset to node: ${node.displayName}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending reset to watch", e)
            }
        }
    }
}
