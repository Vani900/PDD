# CharityAI – OpenAPI / Swagger Documentation Guide

## Accessing Interactive API Documentation

When the backend container or local dev server is running, interactive Swagger and ReDoc documentation are available at:

- **Swagger UI**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **ReDoc UI**: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)
- **OpenAPI Spec (JSON)**: [http://localhost:8000/api/openapi.json](http://localhost:8000/api/openapi.json)

---

## 13 Core API Routers & Base Paths

| Router | Base Path | Key Capabilities |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | Login, Register, Email OTP, TOTP 2FA, JWT Refresh, Password Reset |
| **Users** | `/api/v1/users` | Profile CRUD, Impact metrics, Admin user list & suspension |
| **Donations** | `/api/v1/donations` | Donation creation across 12 categories, pickup scheduling, tracking, QR verification |
| **NGOs** | `/api/v1/ngos` | Organization discovery, registration, 80G tax verification, campaign listing |
| **Volunteers** | `/api/v1/volunteers` | Task assignment, GPS check-in, points leaderboard, rank badges |
| **Receivers** | `/api/v1/receivers` | Help request application, family size scoring, priority approval workflow |
| **Corporate** | `/api/v1/corporate` | CSR company registration, annual budget tracking, Section 80G tax report PDF |
| **Payments** | `/api/v1/payments` | Stripe PaymentIntent, Razorpay order verification, PayPal REST SDK, transaction history |
| **AI Engine** | `/api/v1/ai` | GPT-4o assistant chatbot, PyTesseract OCR, Vision AI item classification, fraud score |
| **Analytics** | `/api/v1/analytics` | Platform overview, donation category breakdown, 30-day trends, heatmap points |
| **Admin** | `/api/v1/admin` | Governance dashboard, NGO review queue, fraud alert resolution, feature flags |
| **Notifications** | `/api/v1/notifications` | In-app notification stream, mark read, FCM push test |
| **WebSockets** | `/ws` | Real-time live feed, donation status updates, admin monitoring stream |

---

## Authentication Mechanism

All protected endpoints require a HTTP Bearer header:

```http
Authorization: Bearer <your_jwt_access_token>
```
