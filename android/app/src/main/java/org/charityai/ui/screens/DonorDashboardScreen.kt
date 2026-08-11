package org.charityai.ui.screens

import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import org.charityai.data.remote.SessionManager

@Composable
fun DonorDashboardScreen(navController: NavController, sessionManager: SessionManager) {
    DonorMainScreen(navController = navController, sessionManager = sessionManager)
}
