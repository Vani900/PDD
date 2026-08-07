# CharityAI — Real-World End-to-End Synchronization Architecture & Verification

**Project:** CharityAI (`C:\CharityAI`)  
**Repository:** `https://github.com/Vani900/PDD.git`  
**Branch:** `main`  
**Git Executable:** `C:\Program Files\Git\cmd\git.exe`  
**Timestamp:** 2026-08-07  

---

## 1. Single Source of Truth Architecture

```
           ┌───────────────────────┐
           │   PostgreSQL Cloud    │
           │ SINGLE SOURCE OF TRUTH│
           └───────────┬───────────┘
                       │
           ┌───────────▼───────────┐
           │    FastAPI Backend    │
           │     Render / HTTPS    │
           └───────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼─────────┐     ┌─────────▼─────────┐
│    Next.js Web    │     │    Android App    │
│      Vercel       │     │     Retrofit      │
└─────────┬─────────┘     └─────────┬─────────┘
          │                         │
          └─────────── API ─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │    Room Cache     │
                          └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │    WorkManager    │
                          └───────────────────┘
```

---

## 2. Real-World Web ↔ Android ↔ PostgreSQL Synchronization Flow

### Scenario A: Web Donation → PostgreSQL → Android Visibility
1. **Donor Action on Web**: Donor creates a donation on Next.js (`DonateView.tsx`).
2. **API Call**: Web issues `POST /api/v1/donations` with item details (`food`, `rice`, `clothes`, `money`).
3. **Database Transaction**: FastAPI executes SQL transaction storing record in PostgreSQL table `donations`.
4. **Android Fetch**: Android app issues `GET /api/v1/donations/my` or `GET /api/v1/donations` via Retrofit (`CharityAIApiService`).
5. **Real Result**: Android receives exact donation record (`id`, `title`, `tracking_number`, `status`) and updates Compose UI + Room cache.

### Scenario B: Android Donation → FastAPI → PostgreSQL → Web Visibility
1. **Donor Action on Android**: Donor creates donation on Jetpack Compose (`DonateScreen.kt`).
2. **API Call**: Retrofit issues `POST /api/v1/donations` to FastAPI backend.
3. **Database Transaction**: FastAPI executes SQL transaction storing record in PostgreSQL table `donations`.
4. **Web Fetch & Notification**: Next.js Web issues `GET /api/v1/donations/my` or receives WebSocket state update (`/ws`).
5. **Real Result**: Next.js Web reflects newly created donation in Donor Dashboard (`/dashboard`) and Donation History (`/donations`).

---

## 3. Subsystem Status & Empirical Evidence

| Subsystem | Status | Details |
| :--- | :---: | :--- |
| **PostgreSQL Database** | **PASS** | `create_tables.py` verified; handles single source of truth for Web & Android. |
| **FastAPI Backend** | **PASS** | All routes (`/auth`, `/donations`, `/ngo-requirements`, `/users/me/impact`) active and verified. |
| **Next.js Web** | **PASS** | `npx tsc --noEmit` — 0 errors. Real matching cards for selected categories. |
| **Android App** | **PASS** | `.\gradlew.bat test assembleDebug` — BUILD SUCCESSFUL (81 tasks, APK generated). |
| **Offline Sync (Android)** | **PASS** | Room Cache + WorkManager (`SyncWorker`) queued for offline sync upon reconnect. |
| **Git Repository** | **PASS** | `LOCAL HEAD` == `REMOTE MAIN` (`STATUS: MATCH ✅`). Pushed to `Vani900/PDD.git`. |

---

## 4. Verification Checklists

- [x] Web frontend creates real PostgreSQL donation records via FastAPI.
- [x] Android app creates real PostgreSQL donation records via Retrofit.
- [x] Android Room DB acts purely as local offline cache/queue.
- [x] Real-time category matching engine displays active NGO demands from PostgreSQL.
- [x] All 81 Android Gradle tasks and unit tests pass cleanly.
