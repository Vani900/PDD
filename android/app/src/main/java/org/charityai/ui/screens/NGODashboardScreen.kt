package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import org.charityai.ui.theme.EmeraldPrimary
import org.charityai.ui.theme.StatusAmber
import org.charityai.ui.theme.TextMuted
import org.charityai.ui.theme.TextPrimary

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
                Toast.makeText(context, "Error syncing with PostgreSQL", Toast.LENGTH_SHORT).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { loadData() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("NGO Operations Hub", fontWeight = FontWeight.Bold, color = EmeraldPrimary) },
                actions = {
                    IconButton(onClick = { loadData() }) { Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextPrimary) }
                    IconButton(onClick = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }) { Icon(Icons.Default.ExitToApp, contentDescription = "Sign Out", tint = TextPrimary) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { navController.navigate("create_requirement") },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Post Requirement", fontWeight = FontWeight.Bold) },
                containerColor = EmeraldPrimary,
                contentColor = Color.White
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. NGO Stat Cards
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Active Demands", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${requirements.size}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Open Supplies", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${openDonations.size}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusAmber
                            )
                        }
                    }
                }
            }

            // 2. Active NGO Requirements List
            item {
                Text(
                    text = "📋 Your Posted Requirements (${requirements.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )
            }

            if (requirements.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("No requirements posted yet", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text("Tap 'Post Requirement' to state what your NGO needs", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }
            } else {
                items(requirements) { req ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(req.item_name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Text("Category: ${req.category} · 📍 ${req.city}", fontSize = 11.sp, color = TextMuted)
                            }
                            Surface(
                                color = Color.Red.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = req.urgency.uppercase(),
                                    color = Color.Red,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }

            // 3. Open Donor Contributions matching NGO demands
            item {
                Text(
                    text = "🎁 Available Donor Contributions (${openDonations.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextPrimary,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            if (openDonations.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            text = "No unassigned donor contributions at this time.",
                            fontSize = 12.sp,
                            color = TextMuted,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            } else {
                items(openDonations) { don ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(don.title ?: don.donation_type, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Text("📍 ${don.pickup_city ?: "India"} · Type: ${don.donation_type.uppercase()}", fontSize = 11.sp, color = TextMuted)
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
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Request", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(64.dp)) }
        }
    }
}
