package org.charityai.data.remote

import android.content.Context
import android.util.Log
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Centralized ApiClient for CharityAI.
 * - Always points to production Railway API
 * - Injects Authorization header from SessionManager
 * - Logs all API calls in debug mode
 * - Never uses localhost / 10.0.2.2 / separate databases
 */
object ApiClient {
    private const val TAG = "CharityAI_API"

    @Volatile
    private var service: CharityAIApiService? = null

    // Token provider — set once after SessionManager is initialized
    private var tokenProvider: (() -> String?)? = null

    fun init(context: Context, sessionManager: SessionManager) {
        tokenProvider = { sessionManager.getToken() }
    }

    private val loggingInterceptor = HttpLoggingInterceptor { message ->
        Log.d(TAG, message)
    }.apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val token = tokenProvider?.invoke()
        val request = if (!token.isNullOrEmpty() && original.header("Authorization") == null) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }
        chain.proceed(request)
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .protocols(listOf(Protocol.HTTP_1_1, Protocol.HTTP_2))
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
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

    /**
     * Parse real error message from API error response body.
     * Returns the actual backend error message, never a generic one.
     */
    fun parseError(errorBody: String?): String {
        if (errorBody.isNullOrBlank()) return "Unknown server error"
        return try {
            val obj = org.json.JSONObject(errorBody)
            when {
                obj.has("message") -> obj.getString("message")
                obj.has("detail") -> {
                    val detail = obj.get("detail")
                    when {
                        detail is org.json.JSONArray -> {
                            (0 until detail.length()).mapNotNull {
                                detail.optJSONObject(it)?.optString("msg")
                            }.joinToString("; ")
                        }
                        else -> detail.toString()
                    }
                }
                else -> errorBody
            }
        } catch (e: Exception) {
            errorBody
        }
    }
}
