package org.charityai

import org.junit.Assert.assertEquals
import org.junit.Test

class DonationDaoTest {
    @Test
    fun testDonationEntityCreation() {
        val entity = org.charityai.data.local.DonationEntity(
            id = "1",
            title = "Food Pack",
            donationType = "food",
            status = "pending",
            trackingNumber = "CAI-1234",
            amount = null,
            city = "Bangalore"
        )
        assertEquals("CAI-1234", entity.trackingNumber)
        assertEquals("food", entity.donationType)
    }
}
