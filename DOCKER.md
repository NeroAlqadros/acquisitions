# Docker Setup Guide - Acquisitions App with Neon Database

This guide explains how to run the Acquisitions application using Docker with Neon Database in both **development** (with Neon Local) and **production** (with Neon Cloud) environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Setup (Neon Local)](#development-setup-neon-local)
- [Production Setup (Neon Cloud)](#production-setup-neon-cloud)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture

**Development Environment:**

- Uses **Neon Local** proxy running in Docker
- Creates ephemeral database branches automatically
- Application connects to `neon-local:5432` inside the Docker network
- Branch lifecycle tied to Docker container lifecycle

**Production Environment:**

- Connects directly to **Neon Cloud** database
- No local proxy needed
- Uses production-grade connection pooling
- Environment variables injected securely

---

## Prerequisites

1. **Docker Desktop** installed ([Windows](https://docs.docker.com/desktop/install/windows-install/) | [Mac](https://docs.docker.com/desktop/install/mac-install/) | [Linux](https://docs.docker.com/desktop/install/linux-install/))
2. **Neon Account** - Sign up at [console.neon.tech](https://console.neon.tech)
3. **Git** installed

### Get Neon Credentials

1. Log in to [Neon Console](https://console.neon.tech)
2. Go to **Project Settings → General**
   - Copy your `NEON_PROJECT_ID`
   - Copy your main branch ID (for `PARENT_BRANCH_ID`)
3. Go to **Settings → API Keys**
   - Create a new API key and copy `NEON_API_KEY`
4. Go to **Connection Details**
   - Copy your production `DATABASE_URL` (for production only)

---

## Development Setup (Neon Local)

### Step 1: Configure Environment Variables

Edit `.env.development` and add your Neon credentials:

```env
NEON_API_KEY=neon_api_xxxxxxxxxxxxxxxxxxxx
NEON_PROJECT_ID=proud-rain-12345678
PARENT_BRANCH_ID=br-main-12345678
DELETE_BRANCH=true
```

### Step 2: Start Development Environment

```bash
# Build and start services
docker-compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d
```

This will:

1. Start the **Neon Local** proxy container
2. Create an ephemeral database branch from your parent branch
3. Start your **application** container
4. Connect the app to the ephemeral database

### Step 3: Access the Application

- **Application**: http://localhost:3000
- **Database** (from host): `postgres://neon:npg@localhost:5432/neondb?sslmode=require`

### Step 4: Working with Neon Local

**Ephemeral Branches (Default):**

- A new branch is created each time you start the containers
- The branch is deleted when you stop the containers (`DELETE_BRANCH=true`)
- Perfect for clean testing environments

**Persistent Branches per Git Branch:**
If you want to persist a database branch per Git branch:

1. Set `DELETE_BRANCH=false` in `.env.development`
2. The branch will be preserved when you stop containers
3. Each Git branch gets its own database branch automatically

### Step 5: View Logs

```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f neon-local
```

### Step 6: Stop Development Environment

```bash
# Stop and remove containers (ephemeral branch will be deleted)
docker-compose -f docker-compose.dev.yml down

# Stop containers but keep them (doesn't delete branch)
docker-compose -f docker-compose.dev.yml stop
```

---

## Production Setup (Neon Cloud)

### Step 1: Configure Production Environment

Edit `.env.production` and set your production database URL:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgres://user:password@ep-xxxxx-xxxxx.region.aws.neon.tech/neondb?sslmode=require
```

**⚠️ SECURITY WARNING:**

- **NEVER commit `.env.production` with real credentials to Git**
- In production, inject `DATABASE_URL` via your deployment platform:
  - GitHub Actions secrets
  - AWS Secrets Manager / Parameter Store
  - GCP Secret Manager
  - Azure Key Vault
  - Docker secrets
  - Kubernetes secrets
  - Heroku Config Vars
  - Vercel/Netlify environment variables

### Step 2: Deploy to Production

**Local Testing (Production Mode):**

```bash
# Build and start in production mode
docker-compose -f docker-compose.prod.yml up --build

# Or detached mode
docker-compose -f docker-compose.prod.yml up -d
```

**Cloud Deployment:**

For cloud platforms, use the `Dockerfile` directly:

```bash
# Build image
docker build -t acquisitions-app:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=$DATABASE_URL \
  -e LOG_LEVEL=info \
  acquisitions-app:latest
```

### Step 3: Production Best Practices

1. **Use secrets management** - Never hardcode credentials
2. **Enable health checks** - The compose file includes a health endpoint check
3. **Monitor logs** - Mount `./logs` volume for persistent logging
4. **Set resource limits** - Add CPU/memory limits in production
5. **Use SSL/TLS** - Ensure `sslmode=require` in DATABASE_URL

---

## Environment Variables

### Development (.env.development)

| Variable           | Description                          | Required | Default        |
| ------------------ | ------------------------------------ | -------- | -------------- |
| `NODE_ENV`         | Environment mode                     | Yes      | `development`  |
| `PORT`             | Application port                     | No       | `3000`         |
| `LOG_LEVEL`        | Logging level                        | No       | `debug`        |
| `DATABASE_URL`     | Neon Local connection                | Yes      | Set in compose |
| `NEON_API_KEY`     | Neon API key                         | Yes      | -              |
| `NEON_PROJECT_ID`  | Neon project ID                      | Yes      | -              |
| `PARENT_BRANCH_ID` | Parent branch for ephemeral branches | No       | Default branch |
| `DELETE_BRANCH`    | Delete branch on container stop      | No       | `true`         |

### Production (.env.production)

| Variable       | Description           | Required | Default      |
| -------------- | --------------------- | -------- | ------------ |
| `NODE_ENV`     | Environment mode      | Yes      | `production` |
| `PORT`         | Application port      | No       | `3000`       |
| `LOG_LEVEL`    | Logging level         | No       | `info`       |
| `DATABASE_URL` | Neon Cloud connection | Yes      | -            |

---

## Common Commands

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Rebuild after code changes
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Run database migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Access app shell
docker-compose -f docker-compose.dev.yml exec app sh

# Stop everything
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart app
docker-compose -f docker-compose.prod.yml restart app

# Stop everything
docker-compose -f docker-compose.prod.yml down
```

### Database Operations

```bash
# Generate migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Cleanup

```bash
# Remove all containers, networks, volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove images
docker rmi acquisitions-app acquisitions-neon-local

# Clean up .neon_local directory
rm -rf .neon_local
```

---

## Troubleshooting

### Issue: Neon Local won't start

**Solution:**

1. Check your Neon credentials in `.env.development`
2. Ensure port 5432 is not already in use
3. Check Neon Local logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs neon-local
   ```

### Issue: App can't connect to database

**Solution:**

1. Wait for Neon Local health check to pass:
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```
2. Verify DATABASE_URL format
3. Check network connectivity:
   ```bash
   docker-compose -f docker-compose.dev.yml exec app ping neon-local
   ```

### Issue: Branch not deleted after stopping

**Solution:**

1. Check `DELETE_BRANCH` is set to `true` in `.env.development`
2. Use `down` instead of `stop`:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Issue: SSL certificate errors in development

**Solution:**

- The Neon Local proxy uses self-signed certificates
- The connection string includes `sslmode=require` which should work
- If issues persist, add SSL config to your database client

### Issue: Permission errors on Windows

**Solution:**

- Ensure Docker Desktop has access to your project directory
- Check File Sharing settings in Docker Desktop
- For `.git/HEAD` mount, ensure WSL2 integration is enabled

### Issue: Hot reload not working in development

**Solution:**

- The `src` directory is mounted as a volume
- Restart the app service:
  ```bash
  docker-compose -f docker-compose.dev.yml restart app
  ```
- Or rebuild:
  ```bash
  docker-compose -f docker-compose.dev.yml up --build app
  ```

---

## Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Branching Guide](https://neon.com/docs/guides/branching)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Neon Console](https://console.neon.tech)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT MODE                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐           ┌─────────────────┐            │
│  │              │  Docker   │                 │            │
│  │  Your App    ├──────────►│  Neon Local     │            │
│  │  Container   │  Network  │  Proxy          │            │
│  │              │           │  (Port 5432)    │            │
│  └──────────────┘           └────────┬────────┘            │
│                                       │                      │
│                                       │ Internet             │
└───────────────────────────────────────┼─────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │                 │
                              │  Neon Cloud     │
                              │  (Ephemeral     │
                              │   Branch)       │
                              │                 │
                              └─────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION MODE                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐                                            │
│  │              │                                            │
│  │  Your App    │                                            │
│  │  Container   │                                            │
│  │              │                                            │
│  └──────┬───────┘                                            │
│         │                                                     │
│         │ Internet                                            │
└─────────┼─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────┐
│                 │
│  Neon Cloud     │
│  (Production    │
│   Database)     │
│                 │
└─────────────────┘
```

---

**Happy Dockerizing! 🐳**
