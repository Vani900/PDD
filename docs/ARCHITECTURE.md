# CharityAI – System Architecture & Implementation Documentation

## Executive Overview

CharityAI is an enterprise-grade AI-powered Smart Donation & Social Impact Platform. It connects Donors, NGOs, Volunteers, Receivers, and Corporate CSR teams through a unified microservice-ready backend and responsive cross-platform interfaces (Web + Android).

---

## Technical Stack Summary

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Web Frontend** | Next.js 15, React 19, TailwindCSS, Framer Motion, Redux Toolkit, TanStack Query | Responsive web app with dynamic animations |
| **Mobile App** | Kotlin, Jetpack Compose, Material 3, MVVM, Room DB, Retrofit | Native Android application with offline support |
| **Backend API** | FastAPI (Python 3.13), Pydantic v2, SQLAlchemy 2.0 (Async) | High-performance async API Gateway & core services |
| **Database** | PostgreSQL 16 + pgvector | Shared multi-tenant relational data store with vector similarity |
| **Cache & Real-time** | Redis 7 + WebSockets | Token revocation, session caching, and live streaming |
| **Task Queue** | RabbitMQ + Celery | Async background processing for emails, FCM push, AI tasks |
| **AI Engine** | OpenAI GPT-4o, PyTesseract OCR, Vision AI | Contextual chat, document extraction, fraud detection |
| **DevOps** | Docker Compose, Terraform, Kubernetes (EKS), GitHub Actions | Containerization, IaC, CI/CD pipeline |

---

## Database Architecture

The system uses **ONE SHARED DATABASE** with strict tenant isolation, UUID primary keys, soft deletes (`is_deleted`), audit fields (`created_by`, `updated_by`), and indexing on search fields.

### Key Domain Schema Clusters
1. **Users & Auth**: `users`, `user_profiles`, `user_documents`, `refresh_tokens`, `otp_verifications`, `sessions`
2. **Organizations & Campaigns**: `organizations`, `organization_members`, `campaigns`
3. **Donations & Deliveries**: `donations`, `donation_items`, `donation_pickups`, `donation_receipts`, `blood_donations`
4. **Volunteers & Tasks**: `volunteers`, `volunteer_tasks`, `volunteer_attendance`
5. **Receivers & Requests**: `receiver_profiles`, `help_requests`
6. **Payments**: `transactions`, `payment_methods`
7. **AI & Core**: `ai_recommendations`, `fraud_alerts`, `audit_logs`, `feature_flags`, `system_settings`

---

## API Layer Design (13 Routers)

1. `/api/v1/auth` – Authentication & JWT/OTP/2FA
2. `/api/v1/users` – Profiles & impact stats
3. `/api/v1/donations` – Donation CRUD & QR verification
4. `/api/v1/ngos` – Discovery, registration, verification
5. `/api/v1/volunteers` – Tasks & leaderboard
6. `/api/v1/receivers` – Receiver profile & help requests
7. `/api/v1/corporate` – CSR dashboard & reports
8. `/api/v1/payments` – Stripe & Razorpay integration
9. `/api/v1/ai` – Chatbot, OCR, recommendations, sentiment
10. `/api/v1/analytics` – Platform overview & heatmaps
11. `/api/v1/admin` – System settings & fraud resolution
12. `/api/v1/notifications` – In-app & push notifications
13. `/ws` – WebSockets for live donation stream & real-time updates

---

## Verification & Quality Assurance

- **Backend**: Standardized exception handling via `CharityAIException`, structured logging with `structlog`, Sentry integration.
- **Frontend**: Full design system tokens in Tailwind, glassmorphism, responsive navigation, dark/light theme switcher.
- **DevOps**: Docker Compose stack for local development, Terraform EKS manifests, GitHub Actions workflow for linting, testing, and building.
