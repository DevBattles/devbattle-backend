# DevBattle Authentication Backend

A production-ready, highly secure authentication backend service for **DevBattle**. Built with Node.js, Express, PostgreSQL, and Drizzle ORM, following Clean Architecture principles.

---

## 🛠️ Architecture & Folder Structure

This project implements a Clean Layered Architecture (`Controller -> Service -> Repository -> Database`) to enforce a strict **separation of concerns**. 

```mermaid
graph TD
    Client[Client Request] -->|Route Mapping| Routes[Routes Layer]
    Routes -->|Input Validation| Validation[Zod Validation]
    Validation -->|Invoke Handler| Controllers[Controllers Layer]
    Controllers -->|Auth Guard & Sec| Middleware[Middleware Layer]
    Controllers -->|Call Business Logic| Services[Services Layer]
    Services -->|Authenticate / Verify JWT| Auth[Auth Utility]
    Services -->|Request Data| Repositories[Repositories Layer]
    Repositories -->|Queries / Mutations| Drizzle[Drizzle ORM]
    Drizzle -->|Connect| Db[Database Connection]
    Db -->|Host| Supabase[(Supabase PostgreSQL)]
```

Below is the directory layout and the reason why separate folders are used:

```text
devbattle-backend/
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

### 📂 Why We Make Separate Folders

Each folder in `src/` represents a distinct boundary of responsibility:

| Folder / File | Purpose | Why It's Kept Separate (Separation of Concerns) |
| :--- | :--- | :--- |
| **`src/auth/`** | Custom JWT utility helpers ([jwt.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/auth/jwt.js)). | Separates token sign/verify cryptography from business rules. If we migrate to standard sessions or OAuth, we only modify this folder without altering business logic. |
| **`src/config/`** | Environment configurations with runtime schema validation ([env.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/config/env.js)). | Prevents the application from running in a semi-functional state. If variables are missing, Zod fails fast at startup. Centralizing config prevents configuration pollution across files. |
| **`src/controllers/`** | HTTP request and response handlers ([authController.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/controllers/authController.js)). | Decouples HTTP transport semantics (status codes, JSON formatting, request parsing) from core logic. If we change web frameworks (e.g., Express to Fastify or AWS Lambda), we only rewrite controllers. |
| **`src/db/`** | Database client instantiation and pool configuration ([index.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/db/index.js)). | Isolates PostgreSQL client configurations, pool connections, and SSL setup so schemas/repositories don't have to manage raw database lifecycle parameters. |
| **`src/logger/`** | Winston logging settings ([logger.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/logger/logger.js)). | Ensures that formatting rules and file logging outputs are isolated, leaving the rest of the application with a clean, standardized logging utility. |
| **`src/middleware/`** | Sequential request cycle filters ([auth.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/middleware/auth.js), [errorHandler.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/middleware/errorHandler.js)). | Isolates cross-cutting concerns (authentication guards, CORS, global error handling, logging) that intercept HTTP requests globally before they hit route controllers. |
| **`src/repositories/`** | Direct database queries using Drizzle ORM ([userRepository.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/repositories/userRepository.js)). | Restricts raw data access logic to specific files. Services query the repository interface (`findByEmail`, `create`) instead of writing database-specific SQL. If the DB schema changes, only repository code requires modification. |
| **`src/routes/`** | HTTP path and method routing registrations ([index.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/routes/index.js)). | Serves as the traffic control center of the API. Maps URL paths directly to controllers and links route-specific middleware, making endpoints easily scannable in a single file. |
| **`src/schema/`** | Drizzle ORM model definitions ([users.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/schema/users.js)). | Defines data structures, column constraints, relations, and table names. Keeping schema files isolated simplifies migrations generation via Drizzle Kit. |
| **`src/services/`** | Core business logic layer ([authService.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/services/authService.js)). | The heart of the application. Contains domain validation, password hashing, and authentication workflows. Services do not know about Express `req` or `res` objects, making them fully unit-testable. |
| **`src/utils/`** | Global helper files like [AppError.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/utils/AppError.js). | Holds generic utility classes and structural helpers used universally across layers. |
| **`src/validation/`** | Input validation schema specifications ([auth.js](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/Hackathon%20Prj/devBattle_Backend/devbattle-backend/src/validation/auth.js)). | Declares request validation specifications (Zod schemas). Keeps controllers clean by offloading type validation and format checks to a dedicated, modular step. |
| **`src/app.js`** | Express application initializer. | configures security headers, JSON limits, CORS setups, router registers, and the error middleware. It does **not** listen to a port, allowing integration tests to load the app in memory without binding ports. |
| **`src/server.js`** | Application server entry listener. | Bootstraps the application, tests the database connection, handles server cleanup on crash signals, and binds Express to the designated network port. |

---

## 🛠️ Technology Stack & Rationale

We have selected a modern, light, and performance-oriented backend stack. Below is the breakdown of why each stack component is utilized:

### 1. Core Runtime & Web Framework
* **Node.js (ES Modules)**
  * *Why we use it*: Node.js provides a high-performance, event-driven, non-blocking I/O model perfect for concurrent HTTP operations. Using ES Modules (`import/export`) aligns the project with modern JavaScript standards, providing cleaner syntax and standardized asynchronous imports.
* **Express.js**
  * *Why we use it*: Express is the de-facto minimalist framework for Node.js. It does not enforce opinionated, complex routing styles or heavy abstractions, giving us complete control over our middlewares, custom response handling, and route execution pipelines.

### 2. Database & ORM
* **Drizzle ORM**
  * *Why we use it*: Drizzle is a next-generation TypeScript-first ORM that is extremely fast. Unlike heavy ORMs (like Sequelize or TypeORM), Drizzle behaves as a thin wrapper around SQL queries, meaning it has zero query overhead and lets you write queries that feel like pure SQL. It maintains type safety, includes custom migrations generation, and features a clean web-based manager called Drizzle Studio.
* **postgres.js**
  * *Why we use it*: An extremely fast, modern PostgreSQL client for Node.js. It outperforms legacy options like `pg` in connection handshakes, natively supports ES Modules, handles query pool queuing internally, and integrates seamlessly with Drizzle ORM.
* **Supabase (PostgreSQL)**
  * *Why we use it*: Supabase supplies fully managed, scalable PostgreSQL databases in the cloud. PostgreSQL is chosen for its compliance, ACID transactions, robust foreign-key constraints, and stellar reliability for user and profile relation management.

### 3. Cryptography & Security
* **bcryptjs**
  * *Why we use it*: A pure-JavaScript implementation of bcrypt for password hashing. Unlike the standard `bcrypt` library, `bcryptjs` requires zero native compilation (C++ dependencies) during installation, preventing workspace build failures on different operating systems (Windows, macOS, Linux).
* **jsonwebtoken (JWT)**
  * *Why we use it*: Custom JWT validation allows for stateless authentication. Rather than querying a Redis cluster or database session table on every client request, the server decodes and validates signed JSON tokens in-memory. This significantly reduces DB load and decreases endpoint response latency.
* **Helmet, CORS, Compression & Rate-Limiter**
  * *Why we use them*:
    * **Helmet**: Configures essential HTTP headers to prevent web exploits (e.g., Clickjacking, XSS).
    * **CORS**: Handles Cross-Origin Resource Sharing, ensuring only allowed client domains can consume the API.
    * **Compression**: Implements Gzip compression on JSON responses to save client network bandwidth and speed up page renders.
    * **Express Rate Limit**: Prevents Denial of Service (DoS) and authentication brute-force attacks by rate-limiting client IPs (100 requests per 15 mins).

### 4. Validation & Utility
* **Zod**
  * *Why we use it*: A schema-declaration and type-validation library. We use Zod to validate raw client input (request payloads) prior to repository executions. It also parses server environment variables on startup. Zod acts as a security barrier, blocking malformed payload injections.
* **Winston**
  * *Why we use it*: Standard console logging is transient and hard to trace in production. Winston is an advanced logger that outputs logs dynamically to clean files (`combined.log`, `error.log`, `exceptions.log`) while preserving readable console color formats during development.

---

## 🚀 Installation & Setup

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

## 🏃 Running the Project

### Start in development mode (with auto-reload):
```bash
npm run dev
```

### Start in production mode:
```bash
npm run start
```

---

## 🔌 API Endpoints

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
  * Log out the current session.
  * **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Logout successful. Please discard your JWT access token."
    }
    ```
