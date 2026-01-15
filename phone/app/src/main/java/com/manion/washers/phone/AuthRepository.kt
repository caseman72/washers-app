package com.manion.washers.phone

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await

/**
 * Repository for Firebase Anonymous Authentication.
 * Signs in anonymously to satisfy database security rules.
 */
object AuthRepository {

    private const val TAG = "AuthRepository"
    private val auth = FirebaseAuth.getInstance()

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    init {
        // Check if already signed in
        _isAuthenticated.value = auth.currentUser != null
        Log.d(TAG, "Initial auth state: ${_isAuthenticated.value}")
    }

    /**
     * Sign in anonymously. Call this on app start.
     * If already signed in, does nothing.
     */
    suspend fun signInAnonymously(): Boolean {
        return try {
            if (auth.currentUser != null) {
                Log.d(TAG, "Already signed in: ${auth.currentUser?.uid}")
                _isAuthenticated.value = true
                return true
            }

            val result = auth.signInAnonymously().await()
            _isAuthenticated.value = result.user != null
            Log.d(TAG, "Signed in anonymously: ${result.user?.uid}")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Anonymous sign-in failed", e)
            _isAuthenticated.value = false
            false
        }
    }

    /**
     * Get current user ID (for debugging/logging).
     */
    fun getUserId(): String? = auth.currentUser?.uid
}
