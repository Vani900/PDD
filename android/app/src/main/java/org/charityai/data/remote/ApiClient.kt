package org.charityai.data.remote

import android.content.Context
import android.util.Log
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Protocol
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
     * Extracts exact message, detail string, or array of Pydantic validation errors.
     */
    fun parseError(errorBody: String?): String {
        if (errorBody.isNullOrBlank()) return "No response details from server"
        return try {
            val obj = org.json.JSONObject(errorBody)
            when {
                obj.has("message") && !obj.isNull("message") -> obj.getString("message")
                obj.has("detail") -> {
                    val detail = obj.get("detail")
                    when (detail) {
                        is org.json.JSONArray -> {
                            val errors = mutableListOf<String>()
                            for (i in 0 until detail.length()) {
                                val item = detail.optJSONObject(i)
                                if (item != null) {
                                    val msg = item.optString("msg", "")
                                    val locArr = item.optJSONArray("loc")
                                    val field = if (locArr != null && locArr.length() > 0) locArr.optString(locArr.length() - 1) else ""
                                    if (field.isNotBlank() && field != "body") {
                                        errors.add("$field: $msg")
                                    } else if (msg.isNotBlank()) {
                                        errors.add(msg)
                                    }
                                }
                            }
                            if (errors.isNotEmpty()) errors.joinToString("; ") else detail.toString()
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

    /**
     * Format a detailed, non-generic error string including HTTP status, method, endpoint, and server response.
     */
    fun formatApiError(
        endpoint: String,
        method: String,
        statusCode: Int,
        errorBody: String?
    ): String {
        val serverDetail = parseError(errorBody)
        val msg = "$method $endpoint FAILED (Status: $statusCode)\nServer: $serverDetail"
        Log.e(TAG, msg)
        return msg
    }

    /**
     * Format a detailed network/timeout error string.
     */
    fun formatNetworkError(
        endpoint: String,
        method: String,
        e: Exception
    ): String {
        val detail = e.localizedMessage ?: e.message ?: e.javaClass.simpleName
        val msg = "$method $endpoint NETWORK ERROR\nDetail: $detail"
        Log.e(TAG, msg, e)
        return msg
    }
}
