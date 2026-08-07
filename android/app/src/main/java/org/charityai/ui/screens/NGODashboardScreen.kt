package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import kotlinx.coroutines.launch
import org.charityai.data.remote.ApiClient
import org.charityai.data.remote.DonationDto
import org.charityai.data.remote.NgoRequirementDto
import org.charityai.data.remote.SessionManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NGODashboardScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var requirements by remember { mutableStateOf<List<NgoRequirementDto>>(emptyList()) }
    var openDonations by remember { mutableStateOf<List<DonationDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    fun loadData() {
        isLoading = true
        val token = sessionManager.getAuthHeader()
        if (token == null) {
            navController.navigate("login") { popUpTo(0) { inclusive = true } }
            return
        }
        scope.launch {
            try {
                val reqRes = ApiClient.getService().getMyNgoRequirements(token)
                if (reqRes.isSuccessful) {
                    requirements = reqRes.body()?.items ?: emptyList()
                }

                val donRes = ApiClient.getService().getDonations(token, status = "pending")
                if (donRes.isSuccessful) {
                    openDonations = donRes.body()?.items ?: emptyList()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error loading data", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { loadData() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("NGO Hub", fontWeight = FontWeight.Bold, color = Color(0xFF25A47E)) },
                actions = {
                    IconButton(onClick = { loadData() }) { Icon(Icons.Default.Refresh, contentDescription = "Refresh") }
                    IconButton(onClick = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }) { Icon(Icons.Default.ExitToApp, contentDescription = "Sign Out") }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { navController.navigate("create_requirement") },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Post Demand") },
                containerColor = Color(0xFF25A47E),
                contentColor = Color.White
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF25A47E))
                }
            } else {
                Text("NGO Requirements (${requirements.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(bottom = 8.dp))

                if (requirements.isEmpty()) {
                    Card(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("No requirements posted yet", fontSize = 14.sp, color = Color.Gray)
                            Text("Tap 'Post Demand' to state what your NGO needs", fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                } else {
                    LazyColumn(modifier = Modifier.height(200.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(requirements) { req ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(req.item_name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text("Category: ${req.category} · 📍 ${req.city}", fontSize = 12.sp, color = Color.Gray)
                                    }
                                    Text(req.urgency.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Red)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text("Available Donor Contributions (${openDonations.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(bottom = 8.dp))

                if (openDonations.isEmpty()) {
                    Text("No unassigned donor donations at this time.", fontSize = 12.sp, color = Color.Gray)
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(openDonations) { don ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(don.title ?: don.donation_type, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text("📍 ${don.pickup_city ?: "India"} · Type: ${don.donation_type}", fontSize = 12.sp, color = Color.Gray)
                                    }
                                    Button(
                                        onClick = {
                                            val token = sessionManager.getAuthHeader() ?: return@Button
                                            if (requirements.isEmpty()) {
                                                Toast.makeText(context, "Post a requirement first", Toast.LENGTH_SHORT).show()
                                                return@Button
                                            }
                                            val reqId = requirements.first().id
                                            scope.launch {
                                                try {
                                                    val res = ApiClient.getService().requestDonation(token, reqId, don.id, mapOf("message" to "NGO request from mobile app"))
                                                    if (res.isSuccessful) {
                                                        Toast.makeText(context, "Request sent to donor!", Toast.LENGTH_SHORT).show()
                                                        loadData()
                                                    } else {
                                                        Toast.makeText(context, "Failed to request", Toast.LENGTH_SHORT).show()
                                                    }
                                                } catch (e: Exception) {
                                                    Toast.makeText(context, "Error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25A47E)),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text("Request", fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
