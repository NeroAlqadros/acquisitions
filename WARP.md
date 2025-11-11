# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview

- Stack: Node.js (ESM) + Express 5, Drizzle ORM (Postgres via Neon serverless), Zod, Winston, Morgan, Helmet, CORS, Cookie Parser, Bcrypt, JSON Web Tokens.
- Entry: src/index.js loads dotenv and src/server.js, which starts the Express app from src/app.js.
- HTTP surface:
  - GET / → simple text response
  - GET /health → JSON status, uptime
  - GET /api → JSON heartbeat
  - /api/auth: POST /sign-up, /sign-in, /sign-out
- Data flow (auth): routes/auth.routes.js → controllers/auth.controller.js → services/auth.service.js → db via Drizzle (src/config/database.js, src/models/user.model.js). Validation with Zod; password hashing with bcrypt; session via JWT in an HTTP-only cookie.
- Logging: Winston logger (src/config/logger.js). Morgan HTTP logs are piped into Winston (combined) and persisted to logs/combined.log and logs/error.log, plus console in non-production.
- Module aliases: package.json "imports" maps to #config/_, #models/_, #routes/_, #services/_, #utils/_, #validations/_.
  - Note: there is a likely typo: "#constrollers/_" → should be "#controllers/_" if you intend to use an alias for controllers. Code currently imports controllers with relative paths.

Commands

- Install deps (lockfile present):
  - npm ci # for clean installs
  - npm install # for local iterative work
- Run the dev server (reloads on change):
  - npm run dev # node --watch src/index.js
- Lint and format:
  - npm run lint
  - npm run lint:fix
  - npm run format
  - npm run format:check
- Database (Drizzle): set DATABASE_URL in .env, then
  - npm run db:generate # emit SQL/migrations from schema
  - npm run db:migrate # apply migrations
  - npm run db:studio # Drizzle Studio UI
- Tests:
  - No test runner is configured (no "test" script, no tests/ folder). ESLint includes globals for a jest-like environment under tests/\*_/_.js, but tests are not present.

Environment

- Copy .env.example → .env and set values:
  - Required: DATABASE_URL (Postgres/Neon connection string)
  - Common: PORT, NODE_ENV, LOG_LEVEL, JWT_SECRET
- Notes:
  - The sample shows "NODE_ENV:development" (with a colon). In .env files it should be "NODE_ENV=development".
  - src/utils/jwt.js falls back to a default secret if JWT_SECRET is not set. For non-local usage, set JWT_SECRET explicitly.

Architecture details (for quick orientation)

- Express app (src/app.js) sets up helmet, cors, JSON/urlencoded parsing, cookie-parser, and morgan→winston. Routes mounted at /api/auth.
- Persistence: src/config/database.js initializes Neon HTTP client and Drizzle; schema in src/models/user.model.js (users table with id, name, email unique, password hash, role, timestamps).
- Service layer: src/services/auth.service.js handles hashing/compare, user lookup and insert using Drizzle, and error shaping. Returns user objects without password.
- Controller layer: src/controllers/auth.controller.js validates requests (Zod schemas in src/validations/auth.validation.js), orchestrates services, signs JWT (src/utils/jwt.js), sets/clears cookie (src/utils/cookies.js), and returns DTOs.
- Utilities: cookies (HTTP-only, strict, short max-age), jwt (sign/verify with expiry), format (Zod error formatting).

Windows-specific note

- eslint.config.js enforces 'linebreak-style': 'unix'. On Windows check your Git CRLF settings or adjust this rule if you encounter line-ending lint errors.
