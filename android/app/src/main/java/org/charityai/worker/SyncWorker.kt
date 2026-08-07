package org.charityai.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class SyncWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        return try {
            // Sync offline queued donations with FastAPI backend
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
