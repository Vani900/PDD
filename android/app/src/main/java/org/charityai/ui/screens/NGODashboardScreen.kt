package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
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
import org.charityai.data.remote.RequestDonationPayload
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

    var userName by remember { mutableStateOf(sessionManager.getUserName()) }
    var requirements by remember { mutableStateOf<List<NgoRequirementDto>>(emptyList()) }
    var openDonations by remember { mutableStateOf<List<DonationDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    // Pulse animation for live sync dot
    val infiniteTransition = rememberInfiniteTransition(label = "pulseNgo")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlphaNgo"
    )

    fun loadData() {
        isLoading = true
        val token = sessionManager.getAuthHeader()
        if (token == null) {
            navController.navigate("login") { popUpTo(0) { inclusive = true } }
            return
        }
        scope.launch {
            try {
                // Fetch fresh profile info
                val profileRes = ApiClient.getService().getUserProfile(token)
                if (profileRes.isSuccessful && profileRes.body() != null) {
                    val p = profileRes.body()!!
                    val freshName = "${p.first_name} ${p.last_name}".trim()
                    if (freshName.isNotBlank()) {
                        userName = freshName
                        sessionManager.updateProfileInfo(freshName, p.email)
                    }
                }

                val reqRes = ApiClient.getService().getMyNgoRequirements(token)
                if (reqRes.isSuccessful) {
                    requirements = reqRes.body()?.items ?: emptyList()
                }

                val donRes = ApiClient.getService().getDonations(token, status = "pending")
                if (donRes.isSuccessful) {
                    openDonations = donRes.body()?.items ?: emptyList()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Sync error: ${e.localizedMessage ?: "Unable to connect to server"}", Toast.LENGTH_LONG).show()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { loadData() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("NGO Hub", fontWeight = FontWeight.Bold, color = EmeraldPrimary, fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(EmeraldPrimary.copy(alpha = pulseAlpha))
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("LIVE SYNC", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                    }
                },
                actions = {
                    IconButton(onClick = { loadData() }) { Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextPrimary) }
                    IconButton(onClick = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }) { Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Sign Out", tint = TextPrimary) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { navController.navigate("create_requirement") },
                icon = { Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(20.dp)) },
                text = { Text("Post Requirement", fontWeight = FontWeight.Bold) },
                containerColor = EmeraldPrimary,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp)
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
            item { Spacer(modifier = Modifier.height(2.dp)) }

            // 1. Personalized NGO Partner Banner
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, EmeraldPrimary.copy(alpha = 0.4f), RoundedCornerShape(20.dp)),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        EmeraldPrimary.copy(alpha = 0.15f),
                                        Color(0xFF3B82F6).copy(alpha = 0.1f),
                                        Color.Transparent
                                    )
                                )
                            )
                            .padding(20.dp)
                    ) {
                        Column {
                            Text("NGO Operations Hub 🏢", fontSize = 13.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = userName.ifBlank { "Verified Partner Organization" },
                                fontSize = 21.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Post demands and match with active donor contributions in real time.", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }
            }

            // 2. NGO Stat Cards
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Active Demands", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${requirements.size}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                        }
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Open Donor Supplies", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${openDonations.size}",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusAmber
                            )
                        }
                    }
                }
            }

            // 3. Active NGO Requirements List
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
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("No requirements posted yet", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Tap 'Post Requirement' to state what your NGO needs!", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }
            } else {
                items(requirements) { req ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(req.item_name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Text("Category: ${req.category} · 📍 ${req.city}", fontSize = 11.sp, color = TextMuted)
                                if (req.quantity != null) {
                                    Text("Quantity Needed: ${req.quantity?.toInt()} ${req.unit ?: ""}", fontSize = 11.sp, color = EmeraldPrimary, fontWeight = FontWeight.SemiBold)
                                }
                            }
                            Surface(
                                color = if (req.urgency.equals("high", true) || req.urgency.equals("critical", true)) Color.Red.copy(alpha = 0.2f) else EmeraldPrimary.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = req.urgency.uppercase(),
                                    color = if (req.urgency.equals("high", true) || req.urgency.equals("critical", true)) Color.Red else EmeraldPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }
                    }
                }
            }

            // 4. Open Donor Contributions matching NGO demands
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
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
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
                                            val res = ApiClient.getService().requestDonation(token, reqId, don.id, RequestDonationPayload("NGO request from mobile app"))
                                            if (res.isSuccessful) {
                                                Toast.makeText(context, "Request sent to donor!", Toast.LENGTH_SHORT).show()
                                                loadData()
                                            } else {
                                                Toast.makeText(context, "Request failed (${res.code()})", Toast.LENGTH_SHORT).show()
                                            }
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Request", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}
