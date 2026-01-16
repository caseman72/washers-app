package com.manion.washers.phone

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object SettingsRepository {

    private const val PREFS_NAME = "washers_settings"
    private const val KEY_NAMESPACE = "namespace"
    private const val KEY_FORMAT = "format"
    private const val KEY_PLAYER1_NAME = "player1_name"
    private const val KEY_PLAYER2_NAME = "player2_name"
    private const val KEY_SHOW_ROUNDS = "show_rounds"

    private var prefs: SharedPreferences? = null

    private val _namespace = MutableStateFlow("")
    val namespace: StateFlow<String> = _namespace.asStateFlow()

    private val _format = MutableStateFlow(1)
    val format: StateFlow<Int> = _format.asStateFlow()

    private val _player1Name = MutableStateFlow("")
    val player1Name: StateFlow<String> = _player1Name.asStateFlow()

    private val _player2Name = MutableStateFlow("")
    val player2Name: StateFlow<String> = _player2Name.asStateFlow()

    private val _showRounds = MutableStateFlow(false)
    val showRounds: StateFlow<Boolean> = _showRounds.asStateFlow()

    fun initialize(context: Context) {
        if (prefs == null) {
            prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            loadSettings()
        }
    }

    private fun loadSettings() {
        prefs?.let { p ->
            _namespace.value = p.getString(KEY_NAMESPACE, "") ?: ""
            _format.value = p.getInt(KEY_FORMAT, 1)
            _player1Name.value = p.getString(KEY_PLAYER1_NAME, "") ?: ""
            _player2Name.value = p.getString(KEY_PLAYER2_NAME, "") ?: ""
            _showRounds.value = p.getBoolean(KEY_SHOW_ROUNDS, false)
        }
    }

    fun setNamespace(value: String) {
        Log.d("SettingsRepository", "setNamespace called with: '$value'")
        _namespace.value = value
        prefs?.edit()?.putString(KEY_NAMESPACE, value)?.apply()
    }

    fun setFormat(value: Int) {
        _format.value = value
        prefs?.edit()?.putInt(KEY_FORMAT, value)?.apply()
    }

    fun setPlayer1Name(value: String) {
        _player1Name.value = value
        prefs?.edit()?.putString(KEY_PLAYER1_NAME, value)?.apply()
    }

    fun setPlayer2Name(value: String) {
        _player2Name.value = value
        prefs?.edit()?.putString(KEY_PLAYER2_NAME, value)?.apply()
    }

    fun setShowRounds(value: Boolean) {
        _showRounds.value = value
        prefs?.edit()?.putBoolean(KEY_SHOW_ROUNDS, value)?.apply()
    }

    /**
     * Get the game number from the current namespace.
     * "casey@manion.com/5" → 5
     * "casey@manion.com" → 0 (no game number specified)
     */
    fun getGameNumber(): Int {
        val parts = _namespace.value.split("/", limit = 2)
        return if (parts.size > 1) parts[1].toIntOrNull() ?: 0 else 0
    }

    /**
     * Get the base namespace (email) without the game number.
     * "casey@manion.com/5" → "casey@manion.com"
     */
    fun getBaseNamespace(): String {
        return _namespace.value.split("/", limit = 2)[0]
    }

    /**
     * Check if current game is a tournament game (games 1-64).
     * Tournament games have format locked to 1 and don't show rounds.
     */
    fun isTournamentGame(): Boolean {
        val gameNumber = getGameNumber()
        return gameNumber in 1..64
    }

    /**
     * Get effective format: tournament games are always format 1.
     */
    fun getEffectiveFormat(): Int {
        return if (isTournamentGame()) 1 else _format.value
    }

    /**
     * Check if rounds should be shown (format > 1 and not a tournament game).
     */
    fun shouldShowRounds(): Boolean {
        return !isTournamentGame() && _format.value > 1
    }
}
