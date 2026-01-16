package com.manion.washers.phone

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object SettingsRepository {

    private const val PREFS_NAME = "washers_settings"
    private const val KEY_BASE_NAMESPACE = "base_namespace"
    private const val KEY_GAME_NUMBER = "game_number"
    private const val KEY_FORMAT = "format"
    private const val KEY_PLAYER1_NAME = "player1_name"
    private const val KEY_PLAYER2_NAME = "player2_name"
    private const val KEY_SHOW_ROUNDS = "show_rounds"

    // Legacy key for migration
    private const val KEY_NAMESPACE_LEGACY = "namespace"

    private var prefs: SharedPreferences? = null

    // Base namespace (email only, e.g., "casey@manion.com")
    private val _baseNamespace = MutableStateFlow("")
    val baseNamespace: StateFlow<String> = _baseNamespace.asStateFlow()

    // Game number (0 = regular play, 1-64 = tournament)
    private val _gameNumber = MutableStateFlow(0)
    val gameNumber: StateFlow<Int> = _gameNumber.asStateFlow()

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
            // Check for legacy namespace and migrate if needed
            val legacyNamespace = p.getString(KEY_NAMESPACE_LEGACY, null)
            if (legacyNamespace != null && !p.contains(KEY_BASE_NAMESPACE)) {
                // Migrate from legacy format
                val parts = legacyNamespace.split("/", limit = 2)
                _baseNamespace.value = parts[0]
                _gameNumber.value = if (parts.size > 1) parts[1].toIntOrNull() ?: 0 else 0
                // Save in new format
                p.edit()
                    .putString(KEY_BASE_NAMESPACE, _baseNamespace.value)
                    .putInt(KEY_GAME_NUMBER, _gameNumber.value)
                    .remove(KEY_NAMESPACE_LEGACY)
                    .apply()
                Log.d("SettingsRepository", "Migrated legacy namespace: $legacyNamespace -> base=${_baseNamespace.value}, game=${_gameNumber.value}")
            } else {
                _baseNamespace.value = p.getString(KEY_BASE_NAMESPACE, "") ?: ""
                _gameNumber.value = p.getInt(KEY_GAME_NUMBER, 0)
            }

            _format.value = p.getInt(KEY_FORMAT, 1)
            _player1Name.value = p.getString(KEY_PLAYER1_NAME, "") ?: ""
            _player2Name.value = p.getString(KEY_PLAYER2_NAME, "") ?: ""
            _showRounds.value = p.getBoolean(KEY_SHOW_ROUNDS, false)
        }
    }

    /**
     * Get full namespace combining base and game number.
     * "casey@manion.com" + 5 → "casey@manion.com/5"
     * "casey@manion.com" + 0 → "casey@manion.com/0"
     */
    fun getFullNamespace(): String {
        val base = _baseNamespace.value
        return if (base.isBlank()) "" else "$base/${_gameNumber.value}"
    }

    /**
     * Set the base namespace (email only).
     * Used by Settings screen.
     */
    fun setBaseNamespace(value: String) {
        Log.d("SettingsRepository", "setBaseNamespace called with: '$value'")
        _baseNamespace.value = value
        prefs?.edit()?.putString(KEY_BASE_NAMESPACE, value)?.apply()
    }

    /**
     * Set the game number.
     * Used by Mirror/Keep Score screens.
     */
    fun setGameNumber(value: Int) {
        Log.d("SettingsRepository", "setGameNumber called with: $value")
        _gameNumber.value = value
        prefs?.edit()?.putInt(KEY_GAME_NUMBER, value)?.apply()
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
     * Check if current game is a tournament game (games 1-64).
     * Tournament games have format locked to 1 and don't show rounds.
     */
    fun isTournamentGame(): Boolean {
        return _gameNumber.value in 1..64
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
