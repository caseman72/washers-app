package com.manion.washers.phone.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.manion.washers.phone.screens.AppMode
import com.manion.washers.phone.screens.GameDisplayScreen
import com.manion.washers.phone.screens.LoadingScreen
import com.manion.washers.phone.screens.ModePickerScreen
import com.manion.washers.phone.screens.SettingsScreen

object Routes {
    const val LOADING = "loading"
    const val MODE_PICKER = "mode_picker?initialMode={initialMode}"
    const val MODE_PICKER_BASE = "mode_picker"
    const val GAME_DISPLAY = "game_display/{mode}"
    const val SETTINGS = "settings"

    fun gameDisplay(mode: AppMode) = "game_display/${mode.name}"
    fun modePicker(initialMode: AppMode? = null) =
        if (initialMode != null) "mode_picker?initialMode=${initialMode.name}" else "mode_picker"
}

@Composable
fun NavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.LOADING
    ) {
        composable(Routes.LOADING) {
            LoadingScreen(
                onLoadingComplete = {
                    navController.navigate(Routes.MODE_PICKER_BASE) {
                        popUpTo(Routes.LOADING) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Routes.MODE_PICKER,
            arguments = listOf(
                navArgument("initialMode") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val initialModeString = backStackEntry.arguments?.getString("initialMode")
            val initialMode = initialModeString?.let { AppMode.valueOf(it) }
            ModePickerScreen(
                initialMode = initialMode,
                onModeSelected = { mode ->
                    when (mode) {
                        AppMode.SETTINGS -> navController.navigate(Routes.SETTINGS)
                        else -> navController.navigate(Routes.gameDisplay(mode))
                    }
                }
            )
        }

        composable(
            route = Routes.GAME_DISPLAY,
            arguments = listOf(
                navArgument("mode") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val modeString = backStackEntry.arguments?.getString("mode") ?: AppMode.MIRROR.name
            val mode = AppMode.valueOf(modeString)
            GameDisplayScreen(
                mode = mode,
                onBackClick = {
                    navController.navigate(Routes.modePicker(mode)) {
                        popUpTo(Routes.MODE_PICKER_BASE) { inclusive = true }
                    }
                }
            )
        }

        composable(route = Routes.SETTINGS) {
            SettingsScreen(
                onBackClick = {
                    navController.navigate(Routes.modePicker(AppMode.SETTINGS)) {
                        popUpTo(Routes.MODE_PICKER_BASE) { inclusive = true }
                    }
                }
            )
        }
    }
}
