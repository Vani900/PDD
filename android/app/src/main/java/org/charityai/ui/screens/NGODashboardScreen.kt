package org.charityai.ui.screens

import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import org.charityai.data.remote.SessionManager

@Composable
fun NGODashboardScreen(navController: NavController, sessionManager: SessionManager) {
    NGOMainScreen(navController = navController, sessionManager = sessionManager)
}
