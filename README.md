# DevBattle Authentication Backend

A production-ready, highly secure authentication backend service for **DevBattle**. Built with Node.js, Express, PostgreSQL, and Drizzle ORM, following Clean Architecture principles.

---

## Folder Structure

The project implements a clean layered architecture (`Controller -> Service -> Repository -> Database`):

```text
devbattle-backend/
│
├── src/
│   ├── auth/          # JWT utilities (generate/verify token)
│   ├── config/        # Environment configurations & Zod validation schema
│   ├── controllers/   # HTTP controllers (parses requests, calls services)
│   ├── db/            # Database connection & client instantiation
│   ├── logger/        # Winston logger transports & formatting configuration
│   ├── middleware/    # Auth, request logger, global error handler middlewares
│   ├── repositories/  # Direct database queries & operations using Drizzle
│   ├── routes/        # Router configuration & endpoints mappings
│   ├── schema/        # Drizzle database model definitions (Users)
│   ├── services/      # Business logic operations (signup, login, profile)
│   ├── utils/         # Response formatter utils & AppError class definitions
│   ├── validation/    # Request Zod schema specifications (auth rules)
│   ├── app.js         # Express app configurations & security configurations
│   └── server.js      # Server listener & database connectivity validator
│
├── logs/              # Auto-generated combined.log, error.log, exceptions.log
├── drizzle/           # Generated SQL migration files & schema snapshots
├── WORKFLOW.md        # Feature log and historical developer tracking
└── package.json       # Script and dependency configuration registry
```

---

## Technology Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database Driver**: postgres.js (hosted on Supabase)
- **Hashing**: bcryptjs (for robust cross-platform hashing)
- **Tokens**: jsonwebtoken (custom JWT validation)
- **Validation**: Zod
- **Logger**: Winston

---

## Installation & Setup

### 1. Clone the repository and install dependencies
```bash
# Recommended: npm or pnpm
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory. You can copy the contents of `.env.example`:
```bash
cp .env.example .env
```

Define the following variables inside `.env`:
```env
PORT=5000
NODE_ENV=development

# Supabase PostgreSQL connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# JWT Configurations
JWT_SECRET=your_jwt_signing_key_at_least_8_characters
JWT_EXPIRES_IN=1d

# Supabase Credentials (Custom JWT auth is implemented; metadata requirement only)
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Migration Commands

To generate Drizzle migrations after modifying the schema:
```bash
npm run db:generate
```

To execute migrations against your database:
```bash
npm run db:migrate
```

To run Drizzle Studio (a local database GUI):
```bash
npm run db:studio
```

---

## Running the Project

### Start in development mode (with auto-reload):
```bash
npm run dev
```

### Start in production mode:
```bash
npm run start
```

---

## API Endpoints

### 1. Health Checks
* **GET** `/health`
  * Checks server uptime, connection logs, and verifies database connectivity.
  * **Response (Success)**:
    ```json
    {
      "success": true,
      "status": "OK",
      "uptime": "123.45s",
      "database": "connected",
      "timestamp": "2026-07-14T10:00:00.000Z"
    }
    ```

### 2. Authentication API
* **POST** `/api/auth/signup`
  * Creates a new user account.
  * **Body**:
    ```json
    {
      "username": "john_doe",
      "email": "john@example.com",
      "password": "Password@123",
      "role": "student"
    }
    ```
    * *Note*: `role` must be `'student'` or `'teacher'`.
    * *Note*: `password` must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
  * **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "user": {
          "id": "1e6f7890-9e1a-4e33-aa86-ca073d19b599",
          "username": "john_doe",
          "email": "john@example.com",
          "role": "student",
          "createdAt": "2026-07-14T09:00:00.000Z",
          "updatedAt": "2026-07-14T09:00:00.000Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

* **POST** `/api/auth/login`
  * Logs in an existing user and retrieves a signed JWT.
  * **Body**:
    ```json
    {
      "email": "john@example.com",
      "password": "Password@123"
    }
    ```
  * **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "user": {
          "id": "1e6f7890-9e1a-4e33-aa86-ca073d19b599",
          "username": "john_doe",
          "email": "john@example.com",
          "role": "student",
          "createdAt": "2026-07-14T09:00:00.000Z",
          "updatedAt": "2026-07-14T09:00:00.000Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```

* **POST** `/api/auth/logout`
  * Log out the current session and clean the user credentials cache.
  * **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Logout successful. Please discard your JWT access token."
    }
    ```

---

## Security Features

- **Helmet**: Secures the application by setting various HTTP response headers.
- **CORS**: Handles Cross-Origin Resource Sharing.
- **Compression**: Gzip compression for all JSON payloads.
- **Express JSON Limit**: Restricts request payloads to `10kb` to prevent Denial of Service (DoS).
- **Express Rate Limit**: Restricts IP requests to `100` calls per 15 minutes.
- **Hiding Powered-By**: Explicitly disables `x-powered-by` headers.
- **Zod Environment Validation**: Prevents starting the application without correct environment keys defined.

---

## Logging System

Winston logs events under the `./logs` folder:
- **`combined.log`**: Standard operational info and incoming requests.
- **`error.log`**: Standard logging for handled failures and validation warnings.
- **`exceptions.log`**: Tracks uncaught program exceptions.
- **`rejections.log`**: Tracks unhandled promise rejections.

In non-production environments, colorful logs are also printed to the server console window for developer convenience.
