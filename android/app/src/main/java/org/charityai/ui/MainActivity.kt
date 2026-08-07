package org.charityai.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import org.charityai.data.remote.SessionManager
import org.charityai.ui.screens.*
import org.charityai.ui.theme.CharityAITheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sessionManager = SessionManager(applicationContext)

        setContent {
            CharityAITheme {
                val navController = rememberNavController()
                val role = sessionManager.getRole()
                val startDestination = if (sessionManager.isLoggedIn()) {
                    if (role == "ngo_admin" || role == "ngo_staff" || role == "ngo") {
                        "ngo_dashboard"
                    } else {
                        "donor_dashboard"
                    }
                } else {
                    "home"
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NavHost(navController = navController, startDestination = startDestination) {
                        composable("home") {
                            HomeScreen(navController = navController, sessionManager = sessionManager)
                        }
                        composable("login") {
                            LoginScreen(navController = navController, sessionManager = sessionManager)
                        }
                        composable("register") {
                            RegisterScreen(navController = navController)
                        }
                        composable("donor_dashboard") {
                            DonorDashboardScreen(navController = navController, sessionManager = sessionManager)
                        }
                        composable("ngo_dashboard") {
                            NGODashboardScreen(navController = navController, sessionManager = sessionManager)
                        }
                        composable("create_donation") {
                            DonateScreen(navController = navController, sessionManager = sessionManager)
                        }
                        composable("create_requirement") {
                            NGORequirementsScreen(navController = navController, sessionManager = sessionManager)
                        }
                    }
                }
            }
        }
    }
}
