package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
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
import org.charityai.data.remote.CreateDonationRequest
import org.charityai.data.remote.DonationItemRequest
import org.charityai.data.remote.SessionManager
import org.charityai.ui.theme.EmeraldPrimary
import org.charityai.ui.theme.TextMuted
import org.charityai.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DonateScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val userName = sessionManager.getUserName()

    var category by remember { mutableStateOf("food") }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("1000") }
    var pickupCity by remember { mutableStateOf("Bangalore") }
    var pickupAddress by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    val categories = listOf("food", "money", "blood", "clothes", "medicine", "books", "other")
    val categoryIcons = mapOf(
        "food" to "🍲", "money" to "💰", "blood" to "🩸",
        "clothes" to "👕", "medicine" to "💊", "books" to "📚", "other" to "🎁"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Make a Contribution", fontWeight = FontWeight.Bold, color = EmeraldPrimary, fontSize = 18.sp)
                        Text("Donor: $userName", fontSize = 11.sp, color = TextMuted)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.Top
        ) {
            Text("Select Category", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
            Spacer(modifier = Modifier.height(6.dp))

            // Category Chips Row 1 & 2
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.take(4).forEach { cat ->
                    val icon = categoryIcons[cat] ?: "🎁"
                    FilterChip(
                        selected = category == cat,
                        onClick = { category = cat },
                        label = { Text("$icon ${cat.uppercase()}", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.drop(4).forEach { cat ->
                    val icon = categoryIcons[cat] ?: "🎁"
                    FilterChip(
                        selected = category == cat,
                        onClick = { category = cat },
                        label = { Text("$icon ${cat.uppercase()}", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            AnimatedVisibility(visible = true, enter = fadeIn(), exit = fadeOut()) {
                Column {
                    when (category) {
                        "money" -> {
                            OutlinedTextField(
                                value = amount,
                                onValueChange = { amount = it },
                                label = { Text("Contribution Amount (INR ₹)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                        "blood" -> {
                            Text("Select Blood Group", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                listOf("A+", "B+", "O+", "AB+").forEach { bg ->
                                    FilterChip(
                                        selected = title.contains(bg),
                                        onClick = { title = "Blood Group $bg" },
                                        label = { Text("🩸 $bg", fontSize = 11.sp) }
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = title,
                                onValueChange = { title = it },
                                label = { Text("Units & Hospital / Blood Bank Name") },
                                placeholder = { Text("e.g. 2 Units O+ at Manipal Hospital") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Medical Urgency / Contact Notes") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = false,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                        "food" -> {
                            OutlinedTextField(
                                value = title,
                                onValueChange = { title = it },
                                label = { Text("Food Item & Quantity") },
                                placeholder = { Text("e.g. 50 kg Rice, 20 kg Pulses or 100 Cooked Meals") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Food Details (Type, Cooked/Prepared Time)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = false,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                        "clothes" -> {
                            OutlinedTextField(
                                value = title,
                                onValueChange = { title = it },
                                label = { Text("Apparel Type & Quantity") },
                                placeholder = { Text("e.g. 15 Pair Shirts & 10 Winter Blankets") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Sizes, Age Group & Condition") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = false,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                        "medicine" -> {
                            OutlinedTextField(
                                value = title,
                                onValueChange = { title = it },
                                label = { Text("Medicine Name & Strips") },
                                placeholder = { Text("e.g. Paracetamol 500mg (10 Strips)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Expiry Date & Packaging Notes") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = false,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                        "books" -> {
                            OutlinedTextField(
                                value = title,
                                onValueChange = { title = it },
                                label = { Text("Book Title & Quantity") },
                                placeholder = { Text("e.g. Class 10 NCERT Science & Math Sets (25 Books)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Subject & Educational Grade Level") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = false,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                        else -> {
                            OutlinedTextField(
                                value = title,
                                onValueChange = { title = it },
                                label = { Text("Item Title / Device Name") },
                                placeholder = { Text("e.g. Dell Core i5 Laptop for online learning") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Description & Specifications") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = false,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = pickupCity,
                onValueChange = { pickupCity = it },
                label = { Text("Pickup City") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = pickupAddress,
                onValueChange = { pickupAddress = it },
                label = { Text("Full Pickup Address") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = false,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val token = sessionManager.getAuthHeader()
                    if (token == null) {
                        Toast.makeText(context, "Please log in first", Toast.LENGTH_SHORT).show()
                        navController.navigate("login")
                        return@Button
                    }

                    val targetReqId = navController.previousBackStackEntry?.savedStateHandle?.get<String>("requirement_id")
                    val targetNgoId = navController.previousBackStackEntry?.savedStateHandle?.get<String>("ngo_id")

                    val request = CreateDonationRequest(
                        donation_type = category,
                        title = if (title.isBlank()) "$category donation" else title.trim(),
                        description = if (description.isBlank()) null else description.trim(),
                        amount = if (category == "money") amount.toDoubleOrNull() else null,
                        currency = "INR",
                        pickup_city = if (pickupCity.isBlank()) "Bangalore" else pickupCity.trim(),
                        pickup_address = if (pickupAddress.isBlank()) null else pickupAddress.trim(),
                        items = if (category != "money") listOf(DonationItemRequest(name = if (title.isBlank()) category else title.trim(), quantity = 1)) else null,
                        ngo_id = targetNgoId,
                        requirement_id = targetReqId
                    )

                    isLoading = true
                    scope.launch {
                        try {
                            val res = ApiClient.getService().createDonation(token, request)
                            if (res.isSuccessful && res.body() != null) {
                                val body = res.body()!!
                                Toast.makeText(context, "Donation created successfully! Tracking ID: ${body.tracking_number}", Toast.LENGTH_LONG).show()
                                navController.navigate("donor_dashboard") { popUpTo("create_donation") { inclusive = true } }
                            } else {
                                val errStr = res.errorBody()?.string() ?: ""
                                val msg = ApiClient.parseError(errStr).ifBlank { "Submission failed (${res.code()})" }
                                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Network error: ${e.localizedMessage ?: "Unable to connect"}", Toast.LENGTH_LONG).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Favorite, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Confirm & Submit Contribution", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}
