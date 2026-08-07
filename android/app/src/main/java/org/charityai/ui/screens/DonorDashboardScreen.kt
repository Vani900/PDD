package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
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

    var userName by remember { mutableStateOf(sessionManager.getUserName()) }
    var userEmail by remember { mutableStateOf(sessionManager.getUserEmail()) }
    var impact by remember { mutableStateOf<UserImpactDto?>(null) }
    var donations by remember { mutableStateOf<List<DonationDto>>(emptyList()) }
    var ngoReqs by remember { mutableStateOf<List<NgoRequirementDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var isRefreshing by remember { mutableStateOf(false) }

    // Pulse animation for live sync dot
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    fun loadData() {
        val token = sessionManager.getAuthHeader()
        if (token == null) {
            navController.navigate("login") { popUpTo(0) { inclusive = true } }
            return
        }
        scope.launch {
            try {
                // Also fetch fresh user profile info
                val profileRes = ApiClient.getService().getUserProfile(token)
                if (profileRes.isSuccessful && profileRes.body() != null) {
                    val p = profileRes.body()!!
                    val freshName = "${p.first_name} ${p.last_name}".trim()
                    if (freshName.isNotBlank()) {
                        userName = freshName
                        sessionManager.updateProfileInfo(freshName, p.email)
                    }
                }

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
                // Silently handle offline fallback
            } finally {
                isLoading = false
                isRefreshing = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("CharityAI", fontWeight = FontWeight.Bold, color = EmeraldPrimary, fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        // Pulse live badge
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
                    IconButton(onClick = { isRefreshing = true; loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextPrimary)
                    }
                    IconButton(onClick = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Sign Out", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { navController.navigate("create_donation") },
                icon = { Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(20.dp)) },
                text = { Text("Make a Donation", fontWeight = FontWeight.Bold) },
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

            // 1. Personalized Creative Hero Greeting Card
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
                                        Color(0xFF8B5CF6).copy(alpha = 0.1f),
                                        Color.Transparent
                                    )
                                )
                            )
                            .padding(20.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Welcome back 👋", fontSize = 13.sp, color = TextMuted)
                                    Text(
                                        text = userName.ifBlank { "Generous Donor" },
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                }
                                Surface(
                                    color = EmeraldPrimary.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Default.Star, contentDescription = null, tint = StatusAmber, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "Level ${impact?.level ?: 1} Donor",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = EmeraldPrimary
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Level Progress Indicator
                            val score = impact?.impact_score ?: 0
                            val progress = ((score % 100) / 100f).coerceIn(0.1f, 1.0f)
                            Text("Impact Score: $score pts (Next level in ${(100 - (score % 100))} pts)", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(6.dp))
                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(CircleShape),
                                color = EmeraldPrimary,
                                trackColor = EmeraldPrimary.copy(alpha = 0.2f),
                            )
                        }
                    }
                }
            }

            // 2. Animated Impact Stat Cards
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Total Donated", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "₹${impact?.total_amount?.toInt() ?: 0}",
                                fontSize = 19.sp,
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
                            Text("Donations Made", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${impact?.total_donations ?: donations.size}",
                                fontSize = 19.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
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
                            Text("Impact Score", fontSize = 11.sp, color = TextMuted)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${impact?.impact_score ?: 0}",
                                fontSize = 19.sp,
                                fontWeight = FontWeight.Bold,
                                color = StatusAmber
                            )
                        }
                    }
                }
            }

            // 3. Urgent NGO Requirements Feed (Smart Matching)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "🏢 Urgent NGO Demands",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = TextPrimary
                    )
                    Text(
                        text = "Realtime PostgreSQL Sync",
                        fontSize = 10.sp,
                        color = EmeraldPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (ngoReqs.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            text = "No urgent NGO requests currently. You can submit a general donation anytime!",
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
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
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
                                    text = req.ngo_name ?: "Partner NGO",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Needs: ${req.item_name} ${if (req.quantity != null) "(${req.quantity?.toInt()} ${req.unit ?: ""})" else ""}",
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
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Fulfill", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 4. My Donation History Timeline
            item {
                Text(
                    text = "📦 Your Donation History (${donations.size})",
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
                            modifier = Modifier.padding(28.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.Favorite, contentDescription = null, tint = TextMuted, modifier = Modifier.size(40.dp))
                            Spacer(modifier = Modifier.height(10.dp))
                            Text("No donations yet", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 15.sp)
                            Text("Tap 'Make a Donation' below to start your impact!", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }
            } else {
                items(donations) { don ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(don.title ?: don.donation_type, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Text("Tracking: ${don.tracking_number}", fontSize = 11.sp, color = TextMuted)
                                Text("📍 ${don.pickup_city ?: "India"} · Type: ${don.donation_type.uppercase()}", fontSize = 11.sp, color = TextMuted)
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
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}
