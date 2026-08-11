package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.navigation.NavController
import kotlinx.coroutines.launch
import org.charityai.data.remote.ApiClient
import org.charityai.data.remote.DonationDetailDto
import org.charityai.data.remote.DonationDto
import org.charityai.data.remote.DonationMatchDto
import org.charityai.data.remote.NgoRequirementDto
import org.charityai.data.remote.SessionManager
import org.charityai.data.remote.UpdateDonationStatusRequest
import org.charityai.data.remote.UserImpactDto
import org.charityai.ui.theme.EmeraldPrimary
import org.charityai.ui.theme.StatusAmber
import org.charityai.ui.theme.TextMuted
import org.charityai.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DonorMainScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var selectedTab by remember { mutableIntStateOf(0) }

    var userName by remember { mutableStateOf(sessionManager.getUserName()) }
    var userEmail by remember { mutableStateOf(sessionManager.getUserEmail()) }
    var impact by remember { mutableStateOf<UserImpactDto?>(null) }
    var donations by remember { mutableStateOf<List<DonationDto>>(emptyList()) }
    var ngoReqs by remember { mutableStateOf<List<NgoRequirementDto>>(emptyList()) }
    var incomingMatches by remember { mutableStateOf<List<DonationMatchDto>>(emptyList()) }
    var selectedDonationForDetails by remember { mutableStateOf<DonationDto?>(null) }
    var actioningMatchId by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var statusFilter by remember { mutableStateOf("ALL") }

    // Pulse animation for live sync indicator
    val infiniteTransition = rememberInfiniteTransition(label = "pulseDonor")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlphaDonor"
    )

    fun loadData() {
        val token = sessionManager.getAuthHeader()
        if (token == null) {
            navController.navigate("login") { popUpTo(0) { inclusive = true } }
            return
        }
        scope.launch {
            try {
                // Profile
                val profileRes = ApiClient.getService().getUserProfile(token)
                if (profileRes.isSuccessful && profileRes.body() != null) {
                    val p = profileRes.body()!!
                    val freshName = "${p.first_name} ${p.last_name}".trim()
                    if (freshName.isNotBlank()) {
                        userName = freshName
                        userEmail = p.email
                        sessionManager.updateProfileInfo(freshName, p.email)
                    }
                }

                // Impact
                val impactRes = ApiClient.getService().getImpactStats(token)
                if (impactRes.isSuccessful) {
                    impact = impactRes.body()
                }

                // My Donations
                val donRes = ApiClient.getService().getMyDonations(token)
                if (donRes.isSuccessful) {
                    donations = donRes.body()?.items ?: emptyList()
                }

                // Urgent Requirements
                val reqRes = ApiClient.getService().getNgoRequirements(token)
                if (reqRes.isSuccessful) {
                    ngoReqs = reqRes.body()?.items ?: emptyList()
                }

                // Incoming Requests
                val matchesRes = ApiClient.getService().getMyMatches(token)
                if (matchesRes.isSuccessful) {
                    incomingMatches = matchesRes.body()?.items ?: emptyList()
                }
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                Toast.makeText(context, "Sync error: ${e.localizedMessage ?: "Connection error"}", Toast.LENGTH_SHORT).show()
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
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("CharityAI", fontWeight = FontWeight.Bold, color = EmeraldPrimary, fontSize = 20.sp)
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
                    IconButton(onClick = { loadData() }) {
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
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                tonalElevation = 8.dp
            ) {
                val pendingRequestsCount = incomingMatches.count { it.status == "pending_donor" || it.status == "requested" }

                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Favorite, contentDescription = "Donations") },
                    label = { Text("Donations", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = {
                        BadgedBox(badge = {
                            if (pendingRequestsCount > 0) {
                                Badge(containerColor = StatusAmber) { Text("$pendingRequestsCount") }
                            }
                        }) {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Requests")
                        }
                    },
                    label = { Text("Requests", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Explore") },
                    label = { Text("Explore", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
                NavigationBarItem(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
            }
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { navController.navigate("create_donation") },
                icon = { Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(20.dp)) },
                text = { Text("Donate", fontWeight = FontWeight.Bold) },
                containerColor = EmeraldPrimary,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (selectedTab) {
                0 -> HomeTab(
                    userName = userName,
                    impact = impact,
                    donations = donations,
                    incomingMatches = incomingMatches,
                    ngoReqs = ngoReqs,
                    navController = navController,
                    onSelectTab = { selectedTab = it }
                )
                1 -> DonationsTab(
                    donations = donations,
                    statusFilter = statusFilter,
                    onStatusFilterChange = { statusFilter = it },
                    navController = navController,
                    onDonationClick = { selectedDonationForDetails = it }
                )
                2 -> RequestsTab(
                    incomingMatches = incomingMatches,
                    actioningMatchId = actioningMatchId,
                    onAccept = { matchId ->
                        val token = sessionManager.getAuthHeader() ?: return@RequestsTab
                        actioningMatchId = matchId
                        scope.launch {
                            try {
                                val res = ApiClient.getService().acceptMatch(token, matchId)
                                if (res.isSuccessful) {
                                    Toast.makeText(context, "Request accepted! NGO notified.", Toast.LENGTH_SHORT).show()
                                    loadData()
                                } else {
                                    val err = ApiClient.parseError(res.errorBody()?.string())
                                    Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                if (e is kotlinx.coroutines.CancellationException) throw e
                                Toast.makeText(context, "Error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                            } finally {
                                actioningMatchId = null
                            }
                        }
                    },
                    onDecline = { matchId ->
                        val token = sessionManager.getAuthHeader() ?: return@RequestsTab
                        actioningMatchId = matchId
                        scope.launch {
                            try {
                                val res = ApiClient.getService().rejectMatch(token, matchId)
                                if (res.isSuccessful) {
                                    Toast.makeText(context, "Request declined.", Toast.LENGTH_SHORT).show()
                                    loadData()
                                } else {
                                    val err = ApiClient.parseError(res.errorBody()?.string())
                                    Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                }
                            } catch (e: Exception) {
                                if (e is kotlinx.coroutines.CancellationException) throw e
                                Toast.makeText(context, "Error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                            } finally {
                                actioningMatchId = null
                            }
                        }
                    }
                )
                3 -> ExploreTab(
                    ngoReqs = ngoReqs,
                    navController = navController
                )
                4 -> ProfileTab(
                    userName = userName,
                    userEmail = userEmail,
                    impact = impact,
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }
                )
            }

            // Pickup & Donation Details Dialog / BottomSheet
            selectedDonationForDetails?.let { don ->
                val matchingMatch = incomingMatches.find { it.donation_id == don.id }
                DonationPickupDetailsDialog(
                    donation = don,
                    matchingMatch = matchingMatch,
                    sessionManager = sessionManager,
                    onDismiss = { selectedDonationForDetails = null },
                    onStatusUpdated = {
                        loadData()
                    }
                )
            }
        }
    }
}

// ── TAB 0: HOME TAB ──────────────────────────────────────────────────────────
@Composable
private fun HomeTab(
    userName: String,
    impact: UserImpactDto?,
    donations: List<DonationDto>,
    incomingMatches: List<DonationMatchDto>,
    ngoReqs: List<NgoRequirementDto>,
    navController: NavController,
    onSelectTab: (Int) -> Unit
) {
    val pendingCount = incomingMatches.count { it.status == "pending_donor" || it.status == "requested" }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }

        // Hero Greeting Banner
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
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Welcome back 👋", fontSize = 13.sp, color = TextMuted)
                                Text(
                                    text = userName.ifBlank { "Generous Donor" },
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
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
                        val score = impact?.impact_score ?: 0
                        val progress = ((score % 100) / 100f).coerceIn(0.1f, 1.0f)
                        Text("Impact Score: $score pts", fontSize = 11.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(6.dp))
                        LinearProgressIndicator(
                            progress = { progress },
                            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
                            color = EmeraldPrimary,
                            trackColor = EmeraldPrimary.copy(alpha = 0.2f)
                        )
                    }
                }
            }
        }

        // Action Alert Badge if Pending NGO Requests
        if (pendingCount > 0) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onSelectTab(2) },
                    colors = CardDefaults.cardColors(containerColor = StatusAmber.copy(alpha = 0.15f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, StatusAmber.copy(alpha = 0.6f)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("📩", fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "$pendingCount NGO Request(s) Pending Action!",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = TextPrimary
                            )
                            Text(
                                text = "An NGO requested your donation. Tap to accept or decline.",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                        Button(
                            onClick = { onSelectTab(2) },
                            colors = ButtonDefaults.buttonColors(containerColor = StatusAmber),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("View", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        }
                    }
                }
            }
        }

        // Stats Row
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
                        Text("₹${impact?.total_amount?.toInt() ?: 0}", fontSize = 19.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
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
                        Text("${impact?.total_donations ?: donations.size}", fontSize = 19.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
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
                        Text("${impact?.impact_score ?: 0}", fontSize = 19.sp, fontWeight = FontWeight.Bold, color = StatusAmber)
                    }
                }
            }
        }

        // Recent NGO Demands (Preview)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🏢 Urgent NGO Demands", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
                Text(
                    text = "See All →",
                    fontSize = 12.sp,
                    color = EmeraldPrimary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onSelectTab(3) }
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
                    Text("No urgent NGO demands currently.", fontSize = 12.sp, color = TextMuted, modifier = Modifier.padding(16.dp))
                }
            }
        } else {
            items(ngoReqs.take(3), key = { it.id }) { req ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { navController.navigate("create_donation") },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                            Text(req.ngo_name ?: "Partner NGO", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("Needs: ${req.item_name}", fontSize = 12.sp, color = EmeraldPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("📍 ${req.city} · Urgency: ${req.urgency.uppercase()}", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        Button(
                            onClick = {
                                navController.currentBackStackEntry?.savedStateHandle?.set("requirement_id", req.id)
                                navController.currentBackStackEntry?.savedStateHandle?.set("ngo_id", req.ngo_id)
                                navController.currentBackStackEntry?.savedStateHandle?.set("ngo_name", req.ngo_name)
                                navController.currentBackStackEntry?.savedStateHandle?.set("title", req.item_name)
                                navController.currentBackStackEntry?.savedStateHandle?.set("category", req.category)
                                navController.currentBackStackEntry?.savedStateHandle?.set("city", req.city)
                                navController.navigate("create_donation")
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Fulfill", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── TAB 1: DONATIONS TAB ──────────────────────────────────────────────────────
@Composable
private fun DonationsTab(
    donations: List<DonationDto>,
    statusFilter: String,
    onStatusFilterChange: (String) -> Unit,
    navController: NavController,
    onDonationClick: (DonationDto) -> Unit
) {
    val filtered = when (statusFilter) {
        "PENDING" -> donations.filter { it.status.equals("pending", true) }
        "ACCEPTED" -> donations.filter { it.status.equals("pickup_arranged", true) || it.status.equals("accepted", true) }
        "COMPLETED" -> donations.filter {
            it.status.equals("completed", true) ||
            it.status.equals("in_transit", true) ||
            it.status.equals("received", true) ||
            it.status.equals("verified", true) ||
            it.status.equals("distributed", true)
        }
        else -> donations
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }
        item {
            Text("📦 Your Donation History (${donations.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
        }

        // Status Filter Chips
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("ALL", "PENDING", "ACCEPTED", "COMPLETED").forEach { st ->
                    FilterChip(
                        selected = statusFilter == st,
                        onClick = { onStatusFilterChange(st) },
                        label = { Text(st, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        if (filtered.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Favorite, contentDescription = null, tint = TextMuted, modifier = Modifier.size(40.dp))
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("No matching donations found", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 15.sp)
                        Text("Tap '+' below to register a new contribution!", fontSize = 12.sp, color = TextMuted)
                    }
                }
            }
        } else {
            items(filtered, key = { it.id }) { don ->
                val isPickupArranged = don.status.lowercase() in listOf("pickup_arranged", "accepted")
                val isInTransit = don.status.lowercase() == "in_transit"

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onDonationClick(don) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isPickupArranged) StatusAmber.copy(alpha = 0.6f) else Color(0xFF334155)
                    )
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                                Text(
                                    text = don.title ?: don.donation_type,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text("Tracking: ${don.tracking_number}", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text("📍 ${don.pickup_city ?: "India"} · Type: ${don.donation_type.uppercase()}", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                            Surface(
                                color = when (don.status.lowercase()) {
                                    "completed", "verified", "delivered" -> EmeraldPrimary.copy(alpha = 0.2f)
                                    "pickup_arranged", "accepted" -> StatusAmber.copy(alpha = 0.2f)
                                    "in_transit" -> Color(0xFF6366F1).copy(alpha = 0.2f)
                                    else -> Color.Gray.copy(alpha = 0.2f)
                                },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = don.status.uppercase(),
                                    color = when (don.status.lowercase()) {
                                        "completed", "verified", "delivered" -> EmeraldPrimary
                                        "pickup_arranged", "accepted" -> StatusAmber
                                        "in_transit" -> Color(0xFF818CF8)
                                        else -> TextMuted
                                    },
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }

                        if (isPickupArranged || isInTransit) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isInTransit) "🚚 Handover In Transit" else "🚚 NGO pickup scheduled",
                                    fontSize = 11.sp,
                                    color = if (isInTransit) Color(0xFF818CF8) else StatusAmber,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Button(
                                    onClick = { onDonationClick(don) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isInTransit) Color(0xFF6366F1) else StatusAmber
                                    ),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = "Pickup Details →",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isInTransit) Color.White else Color.Black
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── TAB 2: REQUESTS TAB ───────────────────────────────────────────────────────
@Composable
private fun RequestsTab(
    incomingMatches: List<DonationMatchDto>,
    actioningMatchId: String?,
    onAccept: (String) -> Unit,
    onDecline: (String) -> Unit
) {
    val pendingList = incomingMatches.filter { it.status == "pending_donor" || it.status == "requested" }
    val historyList = incomingMatches.filter { it.status != "pending_donor" && it.status != "requested" }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }
        item {
            Text("📩 Incoming NGO Match Requests (${incomingMatches.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
        }

        if (incomingMatches.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("No incoming NGO match requests", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("When an NGO requests one of your donations, it will appear here in real time.", fontSize = 12.sp, color = TextMuted)
                    }
                }
            }
        } else {
            if (pendingList.isNotEmpty()) {
                item {
                    Text("Action Required (${pendingList.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = StatusAmber)
                }
                items(pendingList, key = { it.match_id }) { match ->
                    MatchRequestCard(
                        match = match,
                        actioningMatchId = actioningMatchId,
                        onAccept = onAccept,
                        onDecline = onDecline
                    )
                }
            }

            if (historyList.isNotEmpty()) {
                item {
                    Text("Past Request History (${historyList.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextMuted)
                }
                items(historyList, key = { it.match_id }) { match ->
                    MatchRequestCard(
                        match = match,
                        actioningMatchId = actioningMatchId,
                        onAccept = onAccept,
                        onDecline = onDecline
                    )
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

@Composable
private fun MatchRequestCard(
    match: DonationMatchDto,
    actioningMatchId: String?,
    onAccept: (String) -> Unit,
    onDecline: (String) -> Unit
) {
    val isPending = match.status == "pending_donor" || match.status == "requested"

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isPending) StatusAmber.copy(alpha = 0.6f) else Color(0xFF334155)
        )
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                    Text(match.ngo_name ?: "Partner NGO", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Requested for: ${match.donation_title ?: match.donation_type ?: "Donation"}", fontSize = 12.sp, color = EmeraldPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Surface(
                    color = when (match.status.lowercase()) {
                        "accepted" -> EmeraldPrimary.copy(alpha = 0.2f)
                        "rejected" -> Color.Red.copy(alpha = 0.2f)
                        else -> StatusAmber.copy(alpha = 0.2f)
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = match.status.uppercase(),
                        color = when (match.status.lowercase()) {
                            "accepted" -> EmeraldPrimary
                            "rejected" -> Color.Red
                            else -> StatusAmber
                        },
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            if (!match.request_message.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text("\"${match.request_message}\"", fontSize = 12.sp, color = TextMuted, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }

            if (isPending) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val isActioning = actioningMatchId == match.match_id

                    Button(
                        enabled = actioningMatchId == null,
                        onClick = { onAccept(match.match_id) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        if (isActioning) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Text("Accept Request", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    OutlinedButton(
                        enabled = actioningMatchId == null,
                        onClick = { onDecline(match.match_id) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        Text("Decline", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                }
            }
        }
    }
}

// ── TAB 3: EXPLORE TAB ────────────────────────────────────────────────────────
@Composable
private fun ExploreTab(
    ngoReqs: List<NgoRequirementDto>,
    navController: NavController
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCat by remember { mutableStateOf("ALL") }

    val filtered = ngoReqs.filter { req ->
        (selectedCat == "ALL" || req.category.equals(selectedCat, true)) &&
                (searchQuery.isBlank() || req.item_name.contains(searchQuery, true) || req.city.contains(searchQuery, true) || (req.ngo_name?.contains(searchQuery, true) == true))
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }
        item {
            Text("🔍 Explore NGO Requirements (${ngoReqs.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
        }

        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search items, NGOs, or cities...") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
        }

        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("ALL", "food", "clothes", "medicine", "books").forEach { cat ->
                    FilterChip(
                        selected = selectedCat == cat,
                        onClick = { selectedCat = cat },
                        label = { Text(cat.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = EmeraldPrimary, selectedLabelColor = Color.White)
                    )
                }
            }
        }

        if (filtered.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("No requirements matching search.", fontSize = 12.sp, color = TextMuted, modifier = Modifier.padding(16.dp))
                }
            }
        } else {
            items(filtered, key = { it.id }) { req ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { navController.navigate("create_donation") },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                            Text(req.ngo_name ?: "Partner NGO", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("Needs: ${req.item_name} ${if (req.quantity != null) "(${req.quantity?.toInt()} ${req.unit ?: ""})" else ""}", fontSize = 12.sp, color = EmeraldPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("📍 ${req.city} · Urgency: ${req.urgency.uppercase()}", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
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

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── TAB 4: PROFILE TAB ────────────────────────────────────────────────────────
@Composable
private fun ProfileTab(
    userName: String,
    userEmail: String,
    impact: UserImpactDto?,
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))
        Surface(
            modifier = Modifier.size(72.dp),
            shape = CircleShape,
            color = EmeraldPrimary.copy(alpha = 0.2f)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = if (userName.isNotBlank()) userName.take(1).uppercase() else "D",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = EmeraldPrimary
                )
            }
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(userName.ifBlank { "Donor Account" }, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text(userEmail.ifBlank { "donor@charityai.org" }, fontSize = 13.sp, color = TextMuted)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Impact Overview", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary)
                HorizontalDivider(color = Color(0xFF334155))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Contribution Amount", fontSize = 12.sp, color = TextMuted)
                    Text("₹${impact?.total_amount?.toInt() ?: 0}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Completed Donations", fontSize = 12.sp, color = TextMuted)
                    Text("${impact?.completed_donations ?: 0}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Active Level", fontSize = 12.sp, color = TextMuted)
                    Text("Level ${impact?.level ?: 1}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = StatusAmber)
                }
            }
        }

        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(alpha = 0.8f)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Sign Out of CharityAI", fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
    }
}

// ── DONATION & PICKUP DETAILS DIALOG ─────────────────────────────────────────
@Composable
private fun DonationPickupDetailsDialog(
    donation: DonationDto,
    matchingMatch: DonationMatchDto?,
    sessionManager: SessionManager,
    onDismiss: () -> Unit,
    onStatusUpdated: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val clipboardManager = LocalClipboardManager.current

    var isActioning by remember { mutableStateOf(false) }
    var currentStatus by remember { mutableStateOf(donation.status) }
    var detailedInfo by remember { mutableStateOf<DonationDetailDto?>(null) }
    var isLoadingDetail by remember { mutableStateOf(true) }

    LaunchedEffect(donation.id) {
        val token = sessionManager.getAuthHeader()
        try {
            val res = ApiClient.getService().getDonationDetail(token, donation.id)
            if (res.isSuccessful && res.body() != null) {
                detailedInfo = res.body()
                currentStatus = res.body()!!.status
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            // Gracefully fallback to basic donation dto
        } finally {
            isLoadingDetail = false
        }
    }

    fun updateStatus(newStatus: String, notes: String) {
        val token = sessionManager.getAuthHeader() ?: return
        isActioning = true
        scope.launch {
            try {
                val res = ApiClient.getService().updateDonationStatus(
                    token = token,
                    id = donation.id,
                    payload = UpdateDonationStatusRequest(status = newStatus, notes = notes)
                )
                if (res.isSuccessful) {
                    currentStatus = newStatus
                    Toast.makeText(context, "Status updated to ${newStatus.uppercase()}! NGO notified.", Toast.LENGTH_SHORT).show()
                    onStatusUpdated()
                } else {
                    val errMsg = ApiClient.parseError(res.errorBody()?.string())
                    Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                if (e is kotlinx.coroutines.CancellationException) throw e
                Toast.makeText(context, "Update error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
            } finally {
                isActioning = false
            }
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.88f),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("📦", fontSize = 22.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Pickup & Donation Details",
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp,
                            color = TextPrimary
                        )
                    }
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMuted)
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFF334155))

                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Item Title & Tracking Card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = detailedInfo?.title ?: donation.title ?: "${donation.donation_type.uppercase()} Contribution",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            color = TextPrimary
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "Category: ${donation.donation_type.uppercase()}",
                                            fontSize = 12.sp,
                                            color = EmeraldPrimary,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                    Surface(
                                        color = when (currentStatus.lowercase()) {
                                            "completed", "verified", "delivered" -> EmeraldPrimary.copy(alpha = 0.2f)
                                            "pickup_arranged", "accepted" -> StatusAmber.copy(alpha = 0.2f)
                                            "in_transit" -> Color(0xFF6366F1).copy(alpha = 0.2f)
                                            else -> Color.Gray.copy(alpha = 0.2f)
                                        },
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            text = currentStatus.uppercase(),
                                            color = when (currentStatus.lowercase()) {
                                                "completed", "verified", "delivered" -> EmeraldPrimary
                                                "pickup_arranged", "accepted" -> StatusAmber
                                                "in_transit" -> Color(0xFF818CF8)
                                                else -> TextMuted
                                            },
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))
                                HorizontalDivider(color = Color(0xFF334155))
                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Tracking Number", fontSize = 11.sp, color = TextMuted)
                                        Text(
                                            text = donation.tracking_number,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary
                                        )
                                    }
                                    OutlinedButton(
                                        onClick = {
                                            clipboardManager.setText(AnnotatedString(donation.tracking_number))
                                            Toast.makeText(context, "Tracking ID copied to clipboard!", Toast.LENGTH_SHORT).show()
                                        },
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text("Copy ID", fontSize = 11.sp, color = EmeraldPrimary)
                                    }
                                }
                            }
                        }
                    }

                    // Matched NGO & Pickup Coordination Card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("🏢 Matched NGO Partner & Pickup", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("Organization: ", fontSize = 12.sp, color = TextMuted)
                                    Text(
                                        text = matchingMatch?.ngo_name ?: "Verified Partner NGO",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = EmeraldPrimary
                                    )
                                }

                                val pickupLoc = detailedInfo?.pickup_address?.ifBlank { null } ?: detailedInfo?.pickup_city ?: donation.pickup_city ?: "Chennai, India"
                                Row(verticalAlignment = Alignment.Top) {
                                    Text("📍 Pickup Location: ", fontSize = 12.sp, color = TextMuted)
                                    Text(
                                        text = pickupLoc,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = TextPrimary
                                    )
                                }

                                if (!matchingMatch?.request_message.isNullOrBlank()) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            text = "NGO Note: \"${matchingMatch?.request_message}\"",
                                            fontSize = 11.sp,
                                            color = TextMuted,
                                            modifier = Modifier.padding(8.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 5-Stage Lifecycle Timeline
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("📋 Donation & Pickup Lifecycle", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                Spacer(modifier = Modifier.height(10.dp))

                                val isAccepted = currentStatus.lowercase() in listOf("pickup_arranged", "accepted", "in_transit", "completed", "verified", "delivered")
                                val isPickupArranged = currentStatus.lowercase() in listOf("pickup_arranged", "accepted", "in_transit", "completed", "verified", "delivered")
                                val isInTransit = currentStatus.lowercase() in listOf("in_transit", "completed", "verified", "delivered")
                                val isCompleted = currentStatus.lowercase() in listOf("completed", "verified", "delivered")

                                val steps = listOf(
                                    Triple("1. Donation Registered", "Submitted to CharityAI matching engine", true),
                                    Triple("2. NGO Match Confirmed", if (matchingMatch != null) "${matchingMatch.ngo_name ?: "NGO"} requested item" else "Linked with partner NGO", isAccepted),
                                    Triple("3. Pickup Arranged", "NGO coordination & logistics scheduled", isPickupArranged),
                                    Triple("4. In Transit / Handover", if (isInTransit) "Package handed over to NGO/volunteer" else "Awaiting handover at pickup address", isInTransit),
                                    Triple("5. Delivered & Verified", if (isCompleted) "Verified & distributed to beneficiaries" else "Final distribution audit", isCompleted)
                                )

                                steps.forEachIndexed { idx, step ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Surface(
                                            modifier = Modifier.size(22.dp),
                                            shape = CircleShape,
                                            color = if (step.third) EmeraldPrimary else Color(0xFF334155)
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                if (step.third) {
                                                    Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                                } else {
                                                    Text("${idx + 1}", fontSize = 10.sp, color = TextMuted)
                                                }
                                            }
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                text = step.first,
                                                fontSize = 12.sp,
                                                fontWeight = if (step.third) FontWeight.Bold else FontWeight.Normal,
                                                color = if (step.third) TextPrimary else TextMuted
                                            )
                                            Text(step.second, fontSize = 10.sp, color = TextMuted)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Verification QR Code Box
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("🔐 Pickup Verification Code", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Present to the NGO pickup representative upon collection", fontSize = 11.sp, color = TextMuted)
                                Spacer(modifier = Modifier.height(10.dp))

                                Surface(
                                    color = Color.White,
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.padding(6.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text("📦 CHARITY-AI VERIFIED", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = donation.tracking_number,
                                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                            fontWeight = FontWeight.Black,
                                            fontSize = 15.sp,
                                            color = Color.Black
                                        )
                                        Text("ID: ${donation.id.take(8).uppercase()}", fontSize = 9.sp, color = Color.DarkGray)
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Action Buttons at Bottom
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    val statusLower = currentStatus.lowercase()

                    if (statusLower in listOf("pickup_arranged", "accepted")) {
                        Button(
                            enabled = !isActioning,
                            onClick = {
                                updateStatus("in_transit", "Donor confirmed pickup handover to NGO representative")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            if (isActioning) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Text("🚚 Confirm Pickup Handover (In Transit)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    } else if (statusLower == "in_transit") {
                        Button(
                            enabled = !isActioning,
                            onClick = {
                                updateStatus("completed", "Donation verified and marked completed")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            if (isActioning) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Text("✅ Mark Complete & Verified", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }

                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Close Details", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
