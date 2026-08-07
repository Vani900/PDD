package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
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
import org.charityai.data.remote.SessionManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DonateScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var category by remember { mutableStateOf("food") }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("1000") }
    var pickupCity by remember { mutableStateOf("Bangalore") }
    var pickupAddress by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    val categories = listOf("food", "money", "clothes", "medicine", "books", "shelter")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Make a Donation", fontWeight = FontWeight.Bold, color = Color(0xFF25A47E)) }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            verticalArrangement = Arrangement.Top
        ) {
            Text("Donation Category", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.take(3).forEach { cat ->
                    FilterChip(
                        selected = category == cat,
                        onClick = { category = cat },
                        label = { Text(cat.uppercase(), fontSize = 10.sp) }
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.drop(3).forEach { cat ->
                    FilterChip(
                        selected = category == cat,
                        onClick = { category = cat },
                        label = { Text(cat.uppercase(), fontSize = 10.sp) }
                    )
                }
            }

            when (category) {
                "money" -> {
                    OutlinedTextField(
                        value = amount,
                        onValueChange = { amount = it },
                        label = { Text("Contribution Amount (INR)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
                "blood" -> {
                    Text("Select Blood Group", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf("A+", "B+", "O+", "AB+").forEach { bg ->
                            FilterChip(
                                selected = title.contains(bg),
                                onClick = { title = "Blood Group $bg" },
                                label = { Text("🩸 $bg", fontSize = 10.sp) }
                            )
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf("A-", "B-", "O-", "AB-").forEach { bg ->
                            FilterChip(
                                selected = title.contains(bg),
                                onClick = { title = "Blood Group $bg" },
                                label = { Text("🩸 $bg", fontSize = 10.sp) }
                            )
                        }
                    }
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Units & Hospital Name") },
                        placeholder = { Text("e.g. 2 Units O+ at Manipal Hospital") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Medical Urgency / Contact Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false
                    )
                }
                "food" -> {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Food Item & Quantity") },
                        placeholder = { Text("e.g. 50 kg Rice, 20 kg Pulses or 100 Cooked Meals") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Food Details (Type, Cooked/Prepared Time)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false
                    )
                }
                "clothes" -> {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Apparel Type & Quantity") },
                        placeholder = { Text("e.g. 15 Pair Shirts & 10 Winter Blankets") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Sizes, Age Group & Condition") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false
                    )
                }
                "medicine" -> {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Medicine Name & Strips") },
                        placeholder = { Text("e.g. Paracetamol 500mg (10 Strips)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Expiry Date & Packaging Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false
                    )
                }
                "books" -> {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Book Title & Quantity") },
                        placeholder = { Text("e.g. Class 10 NCERT Science & Math Sets (25 Books)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Subject & Educational Grade Level") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false
                    )
                }
                else -> {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Item Title / Device Name") },
                        placeholder = { Text("e.g. Dell Core i5 Laptop for online learning") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Description & Specifications") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = pickupCity,
                onValueChange = { pickupCity = it },
                label = { Text("Pickup City") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = pickupAddress,
                onValueChange = { pickupAddress = it },
                label = { Text("Full Pickup Address") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = false
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

                    val payload = mapOf(
                        "donation_type" to category,
                        "title" to (title.ifBlank { "$category donation" }),
                        "description" to description,
                        "amount" to if (category == "money") amount.toDoubleOrNull() else null,
                        "currency" to "INR",
                        "pickup_city" to pickupCity,
                        "pickup_address" to pickupAddress,
                        "items" to if (category != "money") listOf(mapOf("name" to (title.ifBlank { category }), "quantity" to 1)) else emptyList()
                    )

                    isLoading = true
                    scope.launch {
                        try {
                            val res = ApiClient.getService().createDonation(token, payload)
                            if (res.isSuccessful && res.body() != null) {
                                val trackNum = res.body()?.get("tracking_number")?.toString() ?: "SUCCESS"
                                Toast.makeText(context, "Donation created successfully!", Toast.LENGTH_LONG).show()
                                navController.navigate("donor_dashboard") { popUpTo("create_donation") { inclusive = true } }
                            } else {
                                Toast.makeText(context, "Submission failed", Toast.LENGTH_SHORT).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Error: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25A47E)),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text("Confirm & Submit Donation", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
