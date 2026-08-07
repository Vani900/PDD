package org.charityai.data.remote

import android.content.Context
import android.content.SharedPreferences
import okhttp3.OkHttpClient
import okhttp3.Protocol
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("charityai_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TOKEN = "access_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_ROLE = "user_role"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
    }

    fun saveSession(token: String, refresh: String, userId: String, role: String? = "donor", name: String? = null, email: String? = null) {
        val editor = prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_REFRESH, refresh)
            .putString(KEY_USER_ID, userId)
            .putString(KEY_ROLE, role ?: "donor")
        
        if (!name.isNull_Empty()) {
            editor.putString(KEY_USER_NAME, name)
        }
        if (!email.isNull_Empty()) {
            editor.putString(KEY_USER_EMAIL, email)
        }
        editor.apply()
    }

    fun updateProfileInfo(name: String?, email: String?) {
        val editor = prefs.edit()
        if (!name.isNull_Empty()) editor.putString(KEY_USER_NAME, name)
        if (!email.isNull_Empty()) editor.putString(KEY_USER_EMAIL, email)
        editor.apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)
    fun getAuthHeader(): String? {
        val t = getToken()
        return if (!t.isNull_Empty()) "Bearer $t" else null
    }

    fun getRole(): String = prefs.getString(KEY_ROLE, "donor") ?: "donor"
    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "User") ?: "User"
    fun getUserEmail(): String = prefs.getString(KEY_USER_EMAIL, "") ?: ""

    fun isLoggedIn(): Boolean = !getToken().isNullOrEmpty()

    fun clearSession() {
        prefs.edit().clear().apply()
    }

    private fun String?.isNull_Empty(): Boolean = this == null || this.trim().isEmpty()
}

object ApiClient {
    @Volatile
    private var service: CharityAIApiService? = null

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .protocols(listOf(Protocol.HTTP_1_1, Protocol.HTTP_2))
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    fun getService(): CharityAIApiService {
        return service ?: synchronized(this) {
            service ?: Retrofit.Builder()
                .baseUrl(CharityAIApiService.BASE_URL)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(CharityAIApiService::class.java)
                .also { service = it }
        }
    }
}
