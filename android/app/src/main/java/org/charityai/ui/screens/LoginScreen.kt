package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import kotlinx.coroutines.launch
import org.charityai.data.remote.ApiClient
import org.charityai.data.remote.LoginRequest
import org.charityai.data.remote.SessionManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sign In", fontWeight = FontWeight.Bold, color = Color(0xFF25A47E)) }
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
            Text(
                text = "Welcome to CharityAI",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1E293B)
            )
            Text(
                text = "Log in to access your donation hub",
                fontSize = 14.sp,
                color = Color.Gray,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email Address") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = {
                    if (email.isBlank() || password.isBlank()) {
                        Toast.makeText(context, "Please enter email and password", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    isLoading = true
                    scope.launch {
                        try {
                            val response = ApiClient.getService().login(LoginRequest(email.trim(), password))
                            if (response.isSuccessful && response.body() != null) {
                                val body = response.body()!!
                                val role = body.role ?: "donor"
                                sessionManager.saveSession(body.access_token, body.refresh_token, body.user_id, role)
                                Toast.makeText(context, "Welcome back!", Toast.LENGTH_SHORT).show()

                                if (role == "ngo_admin" || role == "ngo_staff") {
                                    navController.navigate("ngo_dashboard") { popUpTo("login") { inclusive = true } }
                                } else {
                                    navController.navigate("donor_dashboard") { popUpTo("login") { inclusive = true } }
                                }
                            } else {
                                Toast.makeText(context, "Login failed: Check credentials", Toast.LENGTH_LONG).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Network error: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25A47E)),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text("Sign In", fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            TextButton(onClick = { navController.navigate("register") }) {
                Text("Don't have an account? Register free", color = Color(0xFF25A47E))
            }
        }
    }
}
