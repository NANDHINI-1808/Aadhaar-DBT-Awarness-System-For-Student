# Aadhaar DBT for Students Portal

A secure, government-style awareness and self-service portal designed to help students understand Aadhaar-linked vs. DBT-seeded bank accounts, discover and apply for Pre-Matric and Post-Matric scholarships, check their DBT readiness, and interact with a language-adaptive AI Guide.

## Tech Stack
*   **Frontend**: React + Vite (TypeScript), Tailwind CSS, React Router DOM, i18next
*   **Backend**: Node.js + Express (TypeScript), Prisma ORM (PostgreSQL), Multer, Nodemailer, node-cron, pdf-lib
*   **Auth**: JWT (stored in `httpOnly` secure cookies) with token rotation & revocation

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```ini
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/aadhaar_dbt_db?schema=public"

# Auth Secrets
JWT_ACCESS_SECRET="your_long_random_access_jwt_secret"
JWT_REFRESH_SECRET="your_long_random_refresh_jwt_secret"

# Security Keys
AADHAAR_PEPPER="your_secure_aadhaar_hashing_pepper_string"
# 32-byte key in hex (64 hex characters) for AES-256-CBC
BANK_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Email Configuration (Nodemailer / SMTP)
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your_mailtrap_smtp_user"
SMTP_PASS="your_mailtrap_smtp_password"
FROM_EMAIL="noreply@dbt-students.gov.in"

# AI Integration
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

Create a `.env` file in the `frontend/` directory if needed:
```ini
VITE_API_URL="http://localhost:5000/api"
```

---

## Installation & Setup

### Database Configuration
Ensure PostgreSQL is running on your machine and you have created the database (e.g. `aadhaar_dbt_db`).

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run Prisma Migrations to create tables:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Run the seed script:
   ```bash
   npx prisma db seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## Admin Portal (NGO / College Staff)
A pre-seeded admin user is created for local testing:
*   **Email**: `admin@dbt-students.gov.in` (CHANGE BEFORE DEPLOY)
*   **Password**: `AdminDefaultPass123!` (CHANGE BEFORE DEPLOY)

---

## Production Swap details
*   **Aadhaar/NPCI Integration**: In production, the file `backend/src/services/npciService.ts` (currently stubbed) can be configured to call the actual NPCI Aadhaar Seeding status API.
*   **SMS Gateway**: To swap email OTP/notifications to SMS, replace Nodemailer commands in `backend/src/services/smsService.ts` using external SMS gateways (e.g. CDAC / NIC / SMS Gupshup).
*   **S3-Compatible Storage**: Update `backend/src/middleware/upload.ts` to use `multer-s3` instead of local file storage.
