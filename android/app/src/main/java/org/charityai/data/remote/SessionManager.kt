package org.charityai.data.remote

import android.content.Context
import android.content.SharedPreferences

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

        if (!name.isNullOrBlank()) editor.putString(KEY_USER_NAME, name)
        if (!email.isNullOrBlank()) editor.putString(KEY_USER_EMAIL, email)
        editor.apply()
    }

    fun updateProfileInfo(name: String?, email: String?) {
        val editor = prefs.edit()
        if (!name.isNullOrBlank()) editor.putString(KEY_USER_NAME, name)
        if (!email.isNullOrBlank()) editor.putString(KEY_USER_EMAIL, email)
        editor.apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getAuthHeader(): String? {
        val t = getToken()
        return if (!t.isNullOrBlank()) "Bearer $t" else null
    }

    fun getRole(): String = prefs.getString(KEY_ROLE, "donor") ?: "donor"
    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "User") ?: "User"
    fun getUserEmail(): String = prefs.getString(KEY_USER_EMAIL, "") ?: ""

    fun isLoggedIn(): Boolean = !getToken().isNullOrEmpty()

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
