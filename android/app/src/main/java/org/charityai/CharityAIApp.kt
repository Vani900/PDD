package org.charityai

import android.app.Application
import org.charityai.data.remote.ApiClient
import org.charityai.data.remote.SessionManager

class CharityAIApp : Application() {
    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        // Initialize SessionManager as singleton
        sessionManager = SessionManager(this)
        // Initialize ApiClient with token provider from session
        ApiClient.init(this, sessionManager)
    }
}
