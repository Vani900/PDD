package org.charityai.data.remote

import retrofit2.Response
import retrofit2.http.*

// ── Auth Data Classes ────────────────────────────────────────────────────────
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val access_token: String,
    val refresh_token: String,
    val user_id: String,
    val email: String? = null,
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

// ── User Data Classes ────────────────────────────────────────────────────────
data class UserProfileDto(
    val user_id: String,
    val email: String,
    val first_name: String,
    val last_name: String,
    val role: String,
    val completion_percentage: Int = 100
)

data class UserImpactDto(
    val total_donations: Int = 0,
    val total_amount: Double = 0.0,
    val completed_donations: Int = 0,
    val active_donations: Int = 0,
    val impact_score: Int = 0,
    val level: Int = 1,
    val volunteer_hours: Double = 0.0,
    val rank: String? = null
)

// ── Donation Data Classes ────────────────────────────────────────────────────
data class DonationItemRequest(
    val name: String,
    val quantity: Int = 1,
    val unit: String = "pack",
    val condition: String = "new",
    val estimated_value: Double = 0.0
)

data class CreateDonationRequest(
    val donation_type: String,
    val title: String,
    val description: String? = null,
    val amount: Double? = null,
    val currency: String = "INR",
    val pickup_city: String? = null,
    val pickup_address: String? = null,
    val items: List<DonationItemRequest>? = null,
    val ngo_id: String? = null,
    val campaign_id: String? = null
)

data class CreateDonationResponse(
    val donation_id: String,
    val tracking_number: String,
    val status: String,
    val created_at: String? = null
)

data class UpdateDonationStatusRequest(
    val status: String,
    val notes: String? = null
)

data class UpdateDonationStatusResponse(
    val donation_id: String,
    val old_status: String,
    val new_status: String,
    val updated_at: String? = null
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

data class ListDonationsResponse(
    val total: Int,
    val items: List<DonationDto>
)

// ── NGO Requirements Data Classes ────────────────────────────────────────────
data class CreateNgoRequirementRequest(
    val category: String,
    val item_name: String,
    val quantity: Double? = null,
    val unit: String? = null,
    val city: String,
    val urgency: String = "medium",
    val description: String? = null,
    val ngo_id: String? = null
)

data class CreateNgoRequirementResponse(
    val requirement_id: String,
    val status: String,
    val message: String
)

data class RequestDonationPayload(
    val message: String? = "NGO request from mobile app"
)

data class GenericActionResponse(
    val message: String? = null,
    val status: String? = null
)

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

data class ListNgoRequirementsResponse(
    val total: Int,
    val items: List<NgoRequirementDto>
)

// ── Receiver & Volunteer Data Classes ────────────────────────────────────────
data class CreateHelpRequestRequest(
    val need_type: String,
    val title: String,
    val description: String? = null,
    val city: String? = null
)

data class HelpRequestDto(
    val id: String,
    val need_type: String,
    val title: String,
    val status: String,
    val urgency_level: String,
    val ai_priority_score: Double?
)

data class ListHelpRequestsResponse(
    val total: Int,
    val items: List<HelpRequestDto>
)

data class CompleteTaskRequest(
    val notes: String? = null
)

data class VolunteerTaskDto(
    val id: String,
    val title: String,
    val task_type: String,
    val status: String,
    val points_earned: Int
)

data class ListVolunteerTasksResponse(
    val total: Int,
    val items: List<VolunteerTaskDto>
)

// ── CharityAI Retrofit Interface ──────────────────────────────────────────────
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
        @Body payload: CreateDonationRequest
    ): Response<CreateDonationResponse>

    @PATCH("api/v1/donations/{id}/status")
    suspend fun updateDonationStatus(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body payload: UpdateDonationStatusRequest
    ): Response<UpdateDonationStatusResponse>

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
        @Body payload: CreateNgoRequirementRequest
    ): Response<CreateNgoRequirementResponse>

    @POST("api/v1/ngo-requirements/{reqId}/request-donation/{donationId}")
    suspend fun requestDonation(
        @Header("Authorization") token: String,
        @Path("reqId") reqId: String,
        @Path("donationId") donationId: String,
        @Body payload: RequestDonationPayload
    ): Response<GenericActionResponse>

    @GET("api/v1/receivers/help-requests")
    suspend fun getHelpRequests(@Header("Authorization") token: String): Response<ListHelpRequestsResponse>

    @POST("api/v1/receivers/help-requests")
    suspend fun createHelpRequest(
        @Header("Authorization") token: String,
        @Body payload: CreateHelpRequestRequest
    ): Response<GenericActionResponse>

    @GET("api/v1/volunteers/tasks")
    suspend fun getVolunteerTasks(@Header("Authorization") token: String): Response<ListVolunteerTasksResponse>

    @POST("api/v1/volunteers/tasks/{id}/complete")
    suspend fun completeTask(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body payload: CompleteTaskRequest
    ): Response<GenericActionResponse>
}
