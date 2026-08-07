package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
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
import org.charityai.data.remote.UserImpactDto
import org.charityai.ui.theme.EmeraldPrimary
import org.charityai.ui.theme.StatusAmber
import org.charityai.ui.theme.TextMuted
import org.charityai.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DonorDashboardScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var impact by remember { mutableStateOf<UserImpactDto?>(null) }
    var donations by remember { mutableStateOf<List<DonationDto>>(emptyList()) }
    var ngoReqs by remember { mutableStateOf<List<NgoRequirementDto>>(emptyList()) }
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

                val reqRes = ApiClient.getService().getNgoRequirements(token)
                if (reqRes.isSuccessful) {
                    ngoReqs = reqRes.body()?.items ?: emptyList()
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
                title = { Text("Impact Dashboard", fontWeight = FontWeight.Bold, color = EmeraldPrimary) },
                actions = {
                    IconButton(onClick = { loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextPrimary)
                    }
                    IconButton(onClick = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Sign Out", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { navController.navigate("create_donation") },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Donate Now", fontWeight = FontWeight.Bold) },
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

            // 1. Overview Stat Grid
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Total Donated", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "₹${impact?.total_amount?.toInt() ?: 0}",
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
                            Text("Donations Made", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${impact?.total_donations ?: 0}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Impact Score", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${impact?.impact_score ?: 0}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusAmber
                            )
                        }
                    }
                }
            }

            // 2. Active NGO Requirements Feed (Smart Matching)
            item {
                Text(
                    text = "🏢 Urgent NGO Demands",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )
            }

            if (ngoReqs.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            text = "No urgent NGO requests currently. You can submit a general donation.",
                            fontSize = 12.sp,
                            color = TextMuted,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            } else {
                items(ngoReqs.take(4)) { req ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { navController.navigate("create_donation") },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = req.ngo_name ?: "Verified Partner NGO",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Requesting: ${req.item_name} ${if (req.quantity != null) "(${req.quantity?.toInt()} ${req.unit ?: ""})" else ""}",
                                    fontSize = 12.sp,
                                    color = EmeraldPrimary,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "📍 ${req.city} · Urgency: ${req.urgency.uppercase()}",
                                    fontSize = 11.sp,
                                    color = TextMuted
                                )
                            }
                            Button(
                                onClick = { navController.navigate("create_donation") },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Fulfill", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 3. My Donation History
            item {
                Text(
                    text = "📦 Your Donation History",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextPrimary,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            if (donations.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.Favorite, contentDescription = null, tint = TextMuted, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No donations yet", fontWeight = FontWeight.Bold, color = TextPrimary)
                            Text("Tap 'Donate Now' to make your first contribution", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }
            } else {
                items(donations) { don ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(don.title ?: don.donation_type, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Text("Tracking: ${don.tracking_number}", fontSize = 11.sp, color = TextMuted)
                                Text("City: ${don.pickup_city ?: "India"}", fontSize = 11.sp, color = TextMuted)
                            }
                            Surface(
                                color = EmeraldPrimary.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = don.status.uppercase(),
                                    color = EmeraldPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(64.dp)) }
        }
    }
}
