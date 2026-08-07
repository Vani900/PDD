package org.charityai.data.remote

import retrofit2.Response
import retrofit2.http.*

data class LoginRequest(val email: String, val password: String)
data class LoginResponse(
    val access_token: String,
    val refresh_token: String,
    val user_id: String,
    val role: String? = "donor"
)
data class RegisterRequest(
    val first_name: String,
    val last_name: String,
    val email: String,
    val password: String,
    val role: String = "donor"
)
data class RegisterResponse(
    val user_id: String,
    val email: String,
    val message: String,
    val requires_verification: Boolean
)
data class UserProfileDto(
    val user_id: String,
    val email: String,
    val first_name: String,
    val last_name: String,
    val role: String,
    val completion_percentage: Int
)

data class UserImpactDto(
    val total_donations: Int,
    val total_amount: Double,
    val completed_donations: Int,
    val active_donations: Int,
    val impact_score: Int,
    val level: Int,
    val volunteer_hours: Double,
    val rank: String
)

data class DonationDto(
    val id: String,
    val title: String?,
    val donation_type: String,
    val status: String,
    val tracking_number: String,
    val amount: Double?,
    val pickup_city: String?,
    val created_at: String?
)
data class ListDonationsResponse(val total: Int, val items: List<DonationDto>)

data class NgoRequirementDto(
    val id: String,
    val ngo_id: String,
    val ngo_name: String?,
    val category: String,
    val item_name: String,
    val quantity: Double?,
    val unit: String?,
    val city: String,
    val urgency: String,
    val status: String,
    val created_at: String?
)
data class ListNgoRequirementsResponse(val total: Int, val items: List<NgoRequirementDto>)

data class HelpRequestDto(val id: String, val need_type: String, val title: String, val status: String, val urgency_level: String, val ai_priority_score: Double?)
data class ListHelpRequestsResponse(val total: Int, val items: List<HelpRequestDto>)

data class VolunteerTaskDto(val id: String, val title: String, val task_type: String, val status: String, val points_earned: Int)
data class ListVolunteerTasksResponse(val total: Int, val items: List<VolunteerTaskDto>)

interface CharityAIApiService {
    companion object {
        val BASE_URL = org.charityai.BuildConfig.BASE_URL
    }

    @POST("api/v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @POST("api/v1/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/v1/users/me")
    suspend fun getUserProfile(@Header("Authorization") token: String): Response<UserProfileDto>

    @GET("api/v1/users/me/impact")
    suspend fun getImpactStats(@Header("Authorization") token: String): Response<UserImpactDto>

    @GET("api/v1/donations")
    suspend fun getDonations(
        @Header("Authorization") token: String?,
        @Query("page") page: Int = 1,
        @Query("status") status: String? = null
    ): Response<ListDonationsResponse>

    @GET("api/v1/donations/my")
    suspend fun getMyDonations(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1
    ): Response<ListDonationsResponse>

    @POST("api/v1/donations")
    suspend fun createDonation(
        @Header("Authorization") token: String,
        @Body payload: Map<String, Any?>
    ): Response<Map<String, Any>>

    @PATCH("api/v1/donations/{id}/status")
    suspend fun updateDonationStatus(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body payload: Map<String, Any>
    ): Response<Map<String, Any>>

    @GET("api/v1/ngo-requirements")
    suspend fun getNgoRequirements(
        @Header("Authorization") token: String?,
        @Query("page") page: Int = 1
    ): Response<ListNgoRequirementsResponse>

    @GET("api/v1/ngo-requirements/my")
    suspend fun getMyNgoRequirements(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1
    ): Response<ListNgoRequirementsResponse>

    @POST("api/v1/ngo-requirements")
    suspend fun createNgoRequirement(
        @Header("Authorization") token: String,
        @Body payload: Map<String, Any?>
    ): Response<Map<String, Any>>

    @POST("api/v1/ngo-requirements/{reqId}/request-donation/{donationId}")
    suspend fun requestDonation(
        @Header("Authorization") token: String,
        @Path("reqId") reqId: String,
        @Path("donationId") donationId: String,
        @Body payload: Map<String, String>
    ): Response<Map<String, Any>>

    @GET("api/v1/receivers/help-requests")
    suspend fun getHelpRequests(@Header("Authorization") token: String): Response<ListHelpRequestsResponse>

    @POST("api/v1/receivers/help-requests")
    suspend fun createHelpRequest(@Header("Authorization") token: String, @Body payload: Map<String, Any>): Response<Map<String, Any>>

    @GET("api/v1/volunteers/tasks")
    suspend fun getVolunteerTasks(@Header("Authorization") token: String): Response<ListVolunteerTasksResponse>

    @POST("api/v1/volunteers/tasks/{id}/complete")
    suspend fun completeTask(@Header("Authorization") token: String, @Path("id") id: String, @Body payload: Map<String, Any>): Response<Map<String, Any>>
}
