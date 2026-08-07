package org.charityai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
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
import org.charityai.data.remote.CreateNgoRequirementRequest
import org.charityai.data.remote.SessionManager
import org.charityai.ui.theme.EmeraldPrimary
import org.charityai.ui.theme.TextMuted
import org.charityai.ui.theme.TextPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NGORequirementsScreen(navController: NavController, sessionManager: SessionManager) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val userName = sessionManager.getUserName()

    var category by remember { mutableStateOf("food") }
    var itemName by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("50") }
    var unit by remember { mutableStateOf("kg") }
    var city by remember { mutableStateOf("Bangalore") }
    var urgency by remember { mutableStateOf("medium") }
    var description by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    val categories = listOf("food", "clothes", "medicine", "books", "money", "other")
    val urgencies = listOf("low", "medium", "high", "critical")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Post NGO Requirement", fontWeight = FontWeight.Bold, color = EmeraldPrimary, fontSize = 18.sp)
                        Text("NGO Partner: $userName", fontSize = 11.sp, color = TextMuted)
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
            Text("Requirement Category", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.take(3).forEach { cat ->
                    FilterChip(
                        selected = category == cat,
                        onClick = { category = cat },
                        label = { Text(cat.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.drop(3).forEach { cat ->
                    FilterChip(
                        selected = category == cat,
                        onClick = { category = cat },
                        label = { Text(cat.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = EmeraldPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            OutlinedTextField(
                value = itemName,
                onValueChange = { itemName = it },
                label = { Text("Required Item / Resource Name") },
                placeholder = { Text("e.g. 100 Meals, 50 Blankets, NCERT Books") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = { Text("Quantity") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = unit,
                    onValueChange = { unit = it },
                    label = { Text("Unit (kg, packs)") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = city,
                onValueChange = { city = it },
                label = { Text("Target City") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))

            Text("Urgency Level", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextMuted)
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                urgencies.forEach { u ->
                    FilterChip(
                        selected = urgency == u,
                        onClick = { urgency = u },
                        label = { Text(u.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = if (u == "high" || u == "critical") Color.Red else EmeraldPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Additional Instructions for Donors") },
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
                        return@Button
                    }
                    if (itemName.isBlank()) {
                        Toast.makeText(context, "Item name is required", Toast.LENGTH_SHORT).show()
                        return@Button
                    }

                    val req = CreateNgoRequirementRequest(
                        category = category,
                        item_name = itemName.trim(),
                        quantity = quantity.toDoubleOrNull() ?: 1.0,
                        unit = unit.trim(),
                        city = if (city.isBlank()) "Bangalore" else city.trim(),
                        urgency = urgency,
                        description = if (description.isBlank()) null else description.trim()
                    )

                    isLoading = true
                    scope.launch {
                        try {
                            val res = ApiClient.getService().createNgoRequirement(token, req)
                            if (res.isSuccessful && res.body() != null) {
                                Toast.makeText(context, "NGO Requirement published successfully!", Toast.LENGTH_LONG).show()
                                navController.navigate("ngo_dashboard") { popUpTo("create_requirement") { inclusive = true } }
                            } else {
                                val errStr = res.errorBody()?.string() ?: ""
                                val parsedErr = try {
                                    val obj = org.json.JSONObject(errStr)
                                    if (obj.has("message")) obj.getString("message") else null
                                } catch (e: Exception) { null }
                                Toast.makeText(context, parsedErr ?: "Posting failed (${res.code()})", Toast.LENGTH_LONG).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Network error: ${e.localizedMessage ?: "Unable to connect"}", Toast.LENGTH_LONG).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Publish Requirement to Network", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}
