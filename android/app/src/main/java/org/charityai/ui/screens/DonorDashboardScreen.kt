package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Favorite
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
import org.charityai.data.remote.SessionManager
import org.charityai.data.remote.UserImpactDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DonorDashboardScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var impact by remember { mutableStateOf<UserImpactDto?>(null) }
    var donations by remember { mutableStateOf<List<DonationDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var isError by remember { mutableStateOf(false) }

    fun loadData() {
        isLoading = true
        isError = false
        val token = sessionManager.getAuthHeader()
        if (token == null) {
            navController.navigate("login") { popUpTo(0) { inclusive = true } }
            return
        }
        scope.launch {
            try {
                val impactRes = ApiClient.getService().getImpactStats(token)
                if (impactRes.isSuccessful) {
                    impact = impactRes.body()
                }

                val donRes = ApiClient.getService().getMyDonations(token)
                if (donRes.isSuccessful) {
                    donations = donRes.body()?.items ?: emptyList()
                }
            } catch (e: Exception) {
                isError = true
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Donor Hub", fontWeight = FontWeight.Bold, color = Color(0xFF25A47E)) },
                actions = {
                    IconButton(onClick = { loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Sign Out")
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { navController.navigate("create_donation") },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Donate Now") },
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
            } else if (isError) {
                Card(modifier = Modifier.fillMaxWidth().padding(8.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2))) {
                    Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Could not load impact data. Backend may be starting up.", color = Color.Red, fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { loadData() }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25A47E))) {
                            Text("Retry")
                        }
                    }
                }
            } else {
                // Impact Cards
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF25A47E).copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Your Total Impact", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Color.Gray)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${impact?.total_donations ?: 0} Donations · ₹${impact?.total_amount?.toInt() ?: 0} Donated",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF25A47E)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Impact Score: ${impact?.impact_score ?: 0} · Rank: ${impact?.rank ?: "New Member"}",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }

                Text("Your Recent Donations", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(bottom = 8.dp))

                if (donations.isEmpty()) {
                    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Favorite, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(40.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No donations yet", fontWeight = FontWeight.SemiBold)
                            Text("Tap 'Donate Now' to make your first contribution", fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(donations) { don ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(don.title ?: don.donation_type, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                        Text("Tracking: ${don.tracking_number}", fontSize = 12.sp, color = Color.Gray)
                                        Text("City: ${don.pickup_city ?: "N/A"}", fontSize = 12.sp, color = Color.Gray)
                                    }
                                    Surface(
                                        color = Color(0xFF25A47E).copy(alpha = 0.15f),
                                        shape = MaterialTheme.shapes.small
                                    ) {
                                        Text(
                                            text = don.status.uppercase(),
                                            color = Color(0xFF25A47E),
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.sp,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
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
