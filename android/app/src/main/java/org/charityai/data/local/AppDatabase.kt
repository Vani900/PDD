package org.charityai.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [DonationEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun donationDao(): DonationDao
}
