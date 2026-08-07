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
fun NGORequirementsScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var category by remember { mutableStateOf("food") }
    var itemName by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("50") }
    var unit by remember { mutableStateOf("kg") }
    var city by remember { mutableStateOf("Bangalore") }
    var urgency by remember { mutableStateOf("medium") }
    var description by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Post NGO Requirement", fontWeight = FontWeight.Bold, color = Color(0xFF25A47E)) }
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
            OutlinedTextField(
                value = itemName,
                onValueChange = { itemName = it },
                label = { Text("Requirement / Item Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = { Text("Quantity") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = unit,
                    onValueChange = { unit = it },
                    label = { Text("Unit (kg, items)") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = city,
                onValueChange = { city = it },
                label = { Text("City") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Notes for Donors") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = false
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val token = sessionManager.getAuthHeader()
                    if (token == null) {
                        Toast.makeText(context, "Log in first", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (itemName.isBlank()) {
                        Toast.makeText(context, "Item name required", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    isLoading = true
                    scope.launch {
                        try {
                            val payload = mapOf(
                                "category" to category,
                                "item_name" to itemName.trim(),
                                "quantity" to (quantity.toDoubleOrNull() ?: 1.0),
                                "unit" to unit,
                                "city" to city,
                                "urgency" to urgency,
                                "description" to description
                            )
                            val res = ApiClient.getService().createNgoRequirement(token, payload)
                            if (res.isSuccessful) {
                                Toast.makeText(context, "Requirement posted successfully!", Toast.LENGTH_SHORT).show()
                                navController.navigate("ngo_dashboard") { popUpTo("create_requirement") { inclusive = true } }
                            } else {
                                Toast.makeText(context, "Posting failed", Toast.LENGTH_SHORT).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Error: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
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
                    Text("Publish Requirement", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
