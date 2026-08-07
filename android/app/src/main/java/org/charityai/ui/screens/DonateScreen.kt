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

            if (category == "money") {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount (INR)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            } else {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Item Title (e.g. 10 kg Rice)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description & Condition") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = false
                )
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
