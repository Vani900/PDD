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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import kotlinx.coroutines.launch
import org.charityai.data.remote.ApiClient
import org.charityai.data.remote.DonationDto
import org.charityai.data.remote.DonationMatchDto
import org.charityai.data.remote.NgoRequirementDto
import org.charityai.data.remote.RequestDonationPayload
import org.charityai.data.remote.SessionManager
import org.charityai.ui.theme.EmeraldPrimary
import org.charityai.ui.theme.StatusAmber
import org.charityai.ui.theme.TextMuted
import org.charityai.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NGOMainScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var selectedTab by remember { mutableIntStateOf(0) }

    var userName by remember { mutableStateOf(sessionManager.getUserName()) }
    var requirements by remember { mutableStateOf<List<NgoRequirementDto>>(emptyList()) }
    var openDonations by remember { mutableStateOf<List<DonationDto>>(emptyList()) }
    var ngoMatches by remember { mutableStateOf<List<DonationMatchDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var requestingDonationId by remember { mutableStateOf<String?>(null) }

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
                        sessionManager.updateProfileInfo(freshName, p.email)
                    }
                }

                // Posted requirements
                val reqRes = ApiClient.getService().getMyNgoRequirements(token)
                if (reqRes.isSuccessful) {
                    requirements = reqRes.body()?.items ?: emptyList()
                }

                // Available donor donations
                val donRes = ApiClient.getService().getDonations(token, status = "pending")
                if (donRes.isSuccessful) {
                    openDonations = donRes.body()?.items ?: emptyList()
                }

                // Requested matches (real-time tracking)
                val matchesRes = ApiClient.getService().getMyMatches(token)
                if (matchesRes.isSuccessful) {
                    ngoMatches = matchesRes.body()?.items ?: emptyList()
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
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                tonalElevation = 8.dp
            ) {
                val acceptedCount = ngoMatches.count { it.status == "accepted" }

                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "NGO Home") },
                    label = { Text("Home", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Requirements") },
                    label = { Text("Needs", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Favorite, contentDescription = "Contributions") },
                    label = { Text("Supplies", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = EmeraldPrimary, indicatorColor = EmeraldPrimary.copy(alpha = 0.2f))
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = {
                        BadgedBox(badge = {
                            if (acceptedCount > 0) {
                                Badge(containerColor = EmeraldPrimary) { Text("$acceptedCount") }
                            }
                        }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Match Tracker")
                        }
                    },
                    label = { Text("Matches", fontSize = 11.sp) },
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
            if (selectedTab == 1 || selectedTab == 0) {
                ExtendedFloatingActionButton(
                    onClick = { navController.navigate("create_requirement") },
                    icon = { Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(20.dp)) },
                    text = { Text("Post Demand", fontWeight = FontWeight.Bold) },
                    containerColor = EmeraldPrimary,
                    contentColor = Color.White,
                    shape = RoundedCornerShape(16.dp)
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (selectedTab) {
                0 -> NgoHomeTab(
                    userName = userName,
                    requirements = requirements,
                    openDonations = openDonations,
                    ngoMatches = ngoMatches,
                    navController = navController,
                    onSelectTab = { selectedTab = it }
                )
                1 -> RequirementsTab(
                    requirements = requirements,
                    navController = navController
                )
                2 -> ContributionsTab(
                    openDonations = openDonations,
                    requirements = requirements,
                    requestingDonationId = requestingDonationId,
                    sessionManager = sessionManager,
                    onRequestSubmitted = { loadData() }
                )
                3 -> MatchTrackerTab(
                    ngoMatches = ngoMatches
                )
                4 -> NgoProfileTab(
                    userName = userName,
                    requirementsCount = requirements.size,
                    onLogout = {
                        sessionManager.clearSession()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                    }
                )
            }
        }
    }
}

// ── TAB 0: NGO HOME TAB ───────────────────────────────────────────────────────
@Composable
private fun NgoHomeTab(
    userName: String,
    requirements: List<NgoRequirementDto>,
    openDonations: List<DonationDto>,
    ngoMatches: List<DonationMatchDto>,
    navController: NavController,
    onSelectTab: (Int) -> Unit
) {
    val acceptedCount = ngoMatches.count { it.status == "accepted" }
    val pendingCount = ngoMatches.count { it.status == "pending_donor" || it.status == "requested" }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }

        // Operations Banner
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
                            text = userName.ifBlank { "Verified NGO Organization" },
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Post requirements and request matching donor contributions in real time.", fontSize = 12.sp, color = TextMuted)
                    }
                }
            }
        }

        // Accepted Match Alert Badge
        if (acceptedCount > 0) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onSelectTab(3) },
                    colors = CardDefaults.cardColors(containerColor = EmeraldPrimary.copy(alpha = 0.15f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, EmeraldPrimary.copy(alpha = 0.6f)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🎉", fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("$acceptedCount Donation Request(s) Accepted!", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                            Text("A donor has accepted your request. Tap to view details and arrange pickup.", fontSize = 12.sp, color = TextMuted)
                        }
                        Button(
                            onClick = { onSelectTab(3) },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Track", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Stats Cards
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Posted Demands", fontSize = 11.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("${requirements.size}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Open Supplies", fontSize = 11.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("${openDonations.size}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = StatusAmber)
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Accepted Matches", fontSize = 11.sp, color = TextMuted)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("$acceptedCount", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                    }
                }
            }
        }

        // Quick Available Donor Supplies (Preview)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🎁 Available Donor Contributions", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
                Text(
                    text = "See All →",
                    fontSize = 12.sp,
                    color = EmeraldPrimary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onSelectTab(2) }
                )
            }
        }

        if (openDonations.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("No unassigned donor contributions currently.", fontSize = 12.sp, color = TextMuted, modifier = Modifier.padding(16.dp))
                }
            }
        } else {
            items(openDonations.take(3), key = { it.id }) { don ->
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
                        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                            Text(don.title ?: don.donation_type, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("📍 ${don.pickup_city ?: "India"} · Type: ${don.donation_type.uppercase()}", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        Button(
                            onClick = { onSelectTab(2) },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
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

// ── TAB 1: REQUIREMENTS TAB ───────────────────────────────────────────────────
@Composable
private fun RequirementsTab(
    requirements: List<NgoRequirementDto>,
    navController: NavController
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("📋 Your Posted Requirements (${requirements.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
                Button(
                    onClick = { navController.navigate("create_requirement") },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("+ Post Demand", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
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
                        Text("Tap '+ Post Demand' to state what your NGO needs!", fontSize = 12.sp, color = TextMuted)
                    }
                }
            }
        } else {
            items(requirements, key = { it.id }) { req ->
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
                        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                            Text(req.item_name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("Category: ${req.category} · 📍 ${req.city}", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            if (req.quantity != null) {
                                Text("Quantity Needed: ${req.quantity?.toInt()} ${req.unit ?: ""}", fontSize = 11.sp, color = EmeraldPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
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

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── TAB 2: CONTRIBUTIONS TAB ──────────────────────────────────────────────────
@Composable
private fun ContributionsTab(
    openDonations: List<DonationDto>,
    requirements: List<NgoRequirementDto>,
    requestingDonationId: String?,
    sessionManager: SessionManager,
    onRequestSubmitted: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var reqDonatingId by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }
        item {
            Text("🎁 Available Donor Contributions (${openDonations.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
        }

        if (openDonations.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("No unassigned donor contributions at this time.", fontSize = 12.sp, color = TextMuted, modifier = Modifier.padding(16.dp))
                }
            }
        } else {
            items(openDonations, key = { it.id }) { don ->
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
                        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                            Text(don.title ?: don.donation_type, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("📍 ${don.pickup_city ?: "India"} · Type: ${don.donation_type.uppercase()}", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        val isRequestingThis = reqDonatingId == don.id

                        Button(
                            enabled = reqDonatingId == null,
                            onClick = {
                                val token = sessionManager.getAuthHeader() ?: return@Button
                                reqDonatingId = don.id
                                scope.launch {
                                    try {
                                        val payload = RequestDonationPayload("NGO request from mobile app")
                                        val res = if (requirements.isNotEmpty()) {
                                            ApiClient.getService().requestDonation(token, requirements.first().id, don.id, payload)
                                        } else {
                                            ApiClient.getService().directRequestDonation(token, don.id, payload)
                                        }

                                        if (res.isSuccessful) {
                                            Toast.makeText(context, "Request sent to donor!", Toast.LENGTH_SHORT).show()
                                            onRequestSubmitted()
                                        } else {
                                            val rawErr = res.errorBody()?.string()
                                            val errMsg = ApiClient.parseError(rawErr)
                                            if (res.code() == 409) {
                                                Toast.makeText(context, "Request already sent for this donation", Toast.LENGTH_LONG).show()
                                            } else {
                                                Toast.makeText(context, errMsg, Toast.LENGTH_LONG).show()
                                            }
                                        }
                                    } catch (e: Exception) {
                                        if (e is kotlinx.coroutines.CancellationException) throw e
                                        Toast.makeText(context, "Error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                                    } finally {
                                        reqDonatingId = null
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            if (isRequestingThis) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Text("Request", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── TAB 3: MATCH TRACKER TAB ─────────────────────────────────────────────────
@Composable
private fun MatchTrackerTab(
    ngoMatches: List<DonationMatchDto>
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(2.dp)) }
        item {
            Text("🔄 Sent Match Requests & Status Tracker (${ngoMatches.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
        }

        if (ngoMatches.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("No match requests recorded yet", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("When you request donor supplies, their acceptance status will appear here in real time.", fontSize = 12.sp, color = TextMuted)
                    }
                }
            }
        } else {
            items(ngoMatches, key = { it.match_id }) { match ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (match.status == "accepted") EmeraldPrimary.copy(alpha = 0.6f) else Color(0xFF334155)
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
                                    text = match.donation_title ?: match.donation_type ?: "Donation Request",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Target NGO: ${match.ngo_name ?: "Your NGO"}",
                                    fontSize = 12.sp,
                                    color = TextMuted,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
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
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("NGO Message: \"${match.request_message}\"", fontSize = 11.sp, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }

                        if (!match.response_message.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Donor Response: \"${match.response_message}\"", fontSize = 11.sp, color = EmeraldPrimary, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

// ── TAB 4: NGO PROFILE TAB ────────────────────────────────────────────────────
@Composable
private fun NgoProfileTab(
    userName: String,
    requirementsCount: Int,
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
                    text = if (userName.isNotBlank()) userName.take(1).uppercase() else "N",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = EmeraldPrimary
                )
            }
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(userName.ifBlank { "NGO Partner Account" }, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("Verified Organization", fontSize = 12.sp, color = EmeraldPrimary, fontWeight = FontWeight.SemiBold)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("NGO Organization Details", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary)
                HorizontalDivider(color = Color(0xFF334155))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Requirements Posted", fontSize = 12.sp, color = TextMuted)
                    Text("$requirementsCount", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Verification Status", fontSize = 12.sp, color = TextMuted)
                    Text("VERIFIED", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Operating Hub", fontSize = 12.sp, color = TextMuted)
                    Text("Bangalore, India", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                }
            }
        }

        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(alpha = 0.8f)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Sign Out of NGO Hub", fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
    }
}
