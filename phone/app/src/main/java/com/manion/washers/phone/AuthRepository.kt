package com.manion.washers.phone

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await

/**
 * Repository for Firebase Anonymous Authentication.
 * Signs in anonymously to satisfy database security rules.
 */
object AuthRepository {

    private const val TAG = "AuthRepository"
    private val auth = FirebaseAuth.getInstance()

    init {
        // Check if already signed in
        Log.d(TAG, "Initial auth state: ${auth.currentUser != null}")
    }

    /**
     * Sign in anonymously. Call this on app start.
     * If already signed in, does nothing.
     */
    suspend fun signInAnonymously(): Boolean {
        return try {
            if (auth.currentUser != null) {
                Log.d(TAG, "Already signed in: ${auth.currentUser?.uid}")
                return true
            }

            val result = auth.signInAnonymously().await()
            Log.d(TAG, "Signed in anonymously: ${result.user?.uid}")
            result.user != null
        } catch (e: Exception) {
            Log.e(TAG, "Anonymous sign-in failed", e)
            false
        }
    }
}
