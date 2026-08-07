package org.charityai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import org.charityai.data.remote.SessionManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(navController: NavController, sessionManager: SessionManager) {
    LaunchedEffect(Unit) {
        if (sessionManager.isLoggedIn()) {
            val role = sessionManager.getRole()
            if (role == "ngo_admin" || role == "ngo_staff" || role == "ngo") {
                navController.navigate("ngo_dashboard") { popUpTo("home") { inclusive = true } }
            } else {
                navController.navigate("donor_dashboard") { popUpTo("home") { inclusive = true } }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CharityAI", fontWeight = FontWeight.Bold, color = Color(0xFF25A47E)) }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = "Welcome to CharityAI", fontSize = 26.sp, fontWeight = FontWeight.Bold)
            Text(
                text = "Connecting Hearts Through AI",
                fontSize = 14.sp,
                color = Color.Gray,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            Button(
                onClick = { navController.navigate("login") },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25A47E))
            ) {
                Text("Sign In to Your Hub", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = { navController.navigate("register") },
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Text("Register New Account", color = Color(0xFF25A47E), fontWeight = FontWeight.Bold)
            }
        }
    }
}
