package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import org.charityai.ui.theme.EmeraldPrimary
import org.charityai.ui.theme.TextMuted
import org.charityai.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var loginRole by remember { mutableStateOf("donor") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sign In", fontWeight = FontWeight.Bold, color = EmeraldPrimary) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
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
                text = "Welcome Back",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Select your account type to continue",
                fontSize = 13.sp,
                color = TextMuted,
                modifier = Modifier.padding(bottom = 20.dp)
            )

            // Role selection tabs matching Web
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(12.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                FilterChip(
                    selected = loginRole == "donor",
                    onClick = { loginRole = "donor" },
                    label = { Text("❤️ Donor Login", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    modifier = Modifier.weight(1f).padding(end = 4.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = EmeraldPrimary,
                        selectedLabelColor = Color.White
                    )
                )
                FilterChip(
                    selected = loginRole == "ngo",
                    onClick = { loginRole = "ngo" },
                    label = { Text("🏢 NGO Partner", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    modifier = Modifier.weight(1f).padding(start = 4.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = EmeraldPrimary,
                        selectedLabelColor = Color.White
                    )
                )
            }

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email Address") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
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
                            val response = ApiClient.getService().login(LoginRequest(email.trim().lowercase(), password))
                            if (response.isSuccessful && response.body() != null) {
                                val body = response.body()!!
                                val role = body.role ?: loginRole
                                var userName = body.email?.substringBefore("@") ?: "User"
                                val token = body.access_token ?: ""
                                val refresh = body.refresh_token ?: ""
                                val userId = body.user_id ?: ""
                                try {
                                    if (token.isNotBlank()) {
                                        val profileRes = ApiClient.getService().getUserProfile("Bearer $token")
                                        if (profileRes.isSuccessful && profileRes.body() != null) {
                                            val p = profileRes.body()!!
                                            val fullName = "${p.first_name} ${p.last_name}".trim()
                                            if (fullName.isNotBlank()) userName = fullName
                                        }
                                    }
                                } catch (e: Exception) {}

                                sessionManager.saveSession(token, refresh, userId, role, userName, body.email)
                                Toast.makeText(context, "Welcome back, $userName!", Toast.LENGTH_SHORT).show()

                                if (role == "ngo_admin" || role == "ngo_staff" || role == "ngo" || loginRole == "ngo") {
                                    navController.navigate("ngo_dashboard") { popUpTo("login") { inclusive = true } }
                                } else {
                                    navController.navigate("donor_dashboard") { popUpTo("login") { inclusive = true } }
                                }
                            } else {
                                val errStr = response.errorBody()?.string() ?: ""
                                val msg = ApiClient.formatApiError(
                                    endpoint = "api/v1/auth/login",
                                    method = "POST",
                                    statusCode = response.code(),
                                    errorBody = errStr
                                )
                                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                            }
                        } catch (e: Exception) {
                            val msg = ApiClient.formatNetworkError(
                                endpoint = "api/v1/auth/login",
                                method = "POST",
                                e = e
                            )
                            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
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
                Text("Don't have an account? Register free", color = EmeraldPrimary)
            }
        }
    }
}
