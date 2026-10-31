# Deployment & Operational Readiness Guide

## 1. Local Development Quickstart

### Prerequisites
- Docker & Docker Compose
- Python 3.14 (or Python 3.12+)
- Node.js 24+ & npm

### Step 1: Start PostgreSQL via Docker Compose
```bash
docker compose up -d db
```

### Step 2: Initialize Backend
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py setup_restaurant
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Initialize Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`, communicating with backend at `http://localhost:8000`.

---

## 2. Production Checklist (Pre-Launch Gates)
Before transitioning to Production:
1. `APP_ENV` set to `production`.
2. `DEBUG=False`.
3. `LIVE_PAYMENTS_ENABLED=True`.
4. `ZARINPAL_ENV=production`.
5. `ZARINPAL_MERCHANT_ID` set to the verified 36-character merchant UUID from ZarinPal panel.
6. `IS_DEMO_PRICE=False` and actual agreed ticket price set in Toman.
7. `RESTAURANT_NAME`, `RESTAURANT_ADDRESS`, and `RESTAURANT_PHONE` populated with real brand details.
8. HTTPS enforced (`SECURE_SSL_REDIRECT=True`, `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`).
9. `QR_ENCRYPTION_KEY` configured with a 32-byte base64-encoded random key.

