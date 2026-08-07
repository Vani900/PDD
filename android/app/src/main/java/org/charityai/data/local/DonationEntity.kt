package org.charityai.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "donations")
data class DonationEntity(
    @PrimaryKey val id: String,
    val title: String,
    val donationType: String,
    val status: String,
    val trackingNumber: String,
    val amount: Double?,
    val city: String?,
    val isSynced: Boolean = true
)
