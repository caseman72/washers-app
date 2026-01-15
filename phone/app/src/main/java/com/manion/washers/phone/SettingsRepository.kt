package com.manion.washers.phone

import android.content.Context
import android.content.SharedPreferences
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
}
