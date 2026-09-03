# 🚀 Deployment Guide — Lumiina Backend

This guide outlines production deployment procedures, database migration strategies, and healthcheck verification.

---

## 1. 🏗️ Local & Staging Deployment (Docker Compose)

### Quick Start
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Configure mandatory production secrets in .env:
#    - JWT_SECRET (must be >= 32 characters)
#    - CLOUDINARY_SECRET (must start with cloudinary://)
#    - DB_PASSWORD

# 3. Start services with auto-build:
make docker-up

# 4. View container status:
docker compose ps

# 5. Follow live logs:
make docker-logs
```

---

## 2. 🗄️ Database Migration Strategy

All database schema evolutions are managed via versioned migration files in `db/migrations/` using `golang-migrate`.

### Migration Inventory
- `000001_create_users_table`: User authentication, roles, and verification status.
- `000002_create_artworks_table`: Artwork metadata, user foreign keys, and tags.
- `000003_create_tags_table`: Normalized tag storage and many-to-many relationship mapping.
- `000004_create_comments_table`: Threaded user comments on artworks.
- `000005_add_performance_indexes`: Composite B-Tree and GIN Trigram (`pg_trgm`) indexes.

### Running Migrations
```bash
# Apply all pending migrations:
make migrate-up

# Rollback the last migration step:
make migrate-down

# Manual CLI execution:
migrate -path db/migrations -database "$DATABASE_URL" -verbose up
```

> **Production Recommendation**: Run migrations in your CI/CD deployment pipeline *before* switching traffic to new container instances (Blue-Green / Rolling deployment), preventing race conditions between older and newer schema requirements.

---

## 3. ☁️ Cloud & Platform Deployment (Render, Fly.io, or VPS)

### Environment Variables Matrix
Set the following environment variables in your cloud dashboard:
| Variable | Mandatory | Description | Example |
|---|---|---|---|
| `PORT` | Yes | HTTP listening port | `8080` |
| `DB_HOST` | Yes | PostgreSQL host | `aws-0-ap-southeast-1.pooler.supabase.com` |
| `DB_PORT` | Yes | PostgreSQL port | `5432` or `6543` |
| `DB_NAME` | Yes | Database name | `postgres` |
| `DB_USER` | Yes | Database username | `postgres.your_project` |
| `DB_PASSWORD` | Yes | Database password | `StrongSecret123!` |
| `JWT_SECRET` | Yes | Token signing key (>= 32 chars) | `v3ry_s3cur3_pr0duct10n_k3y_32ch4rs` |
| `CLOUDINARY_SECRET` | Yes | Cloudinary connection URI | `cloudinary://key:secret@cloud` |
| `REDIS_HOST` | Yes | Redis server host | `redis-cluster.upstash.io` |
| `REDIS_PORT` | Yes | Redis server port | `6379` |
| `REDIS_PASSWORD` | Optional | Redis password | `secret` |
| `ALLOWED_ORIGINS` | Yes | Allowed frontend origins | `https://lumiina.art,https://www.lumiina.art` |

### Production Dockerfile
The provided `Dockerfile` uses a multi-stage build:
- Stage 1 (`builder`): Compiles Go static binary with `-ldflags="-w -s"` on Alpine.
- Stage 2 (`runner`): Stripped Alpine runtime (~19MB) executing under non-root `appuser`.

---

## 4. 🩺 Healthcheck & Zero-Downtime Probes

Configure your load balancer or container orchestrator with these probes:

### Liveness Probe (`GET /livez`)
- Verifies HTTP server is responsive.
- Expected HTTP status: `200 OK`
- Interval: 10s, Timeout: 2s

### Readiness Probe (`GET /readyz`)
- Verifies active database connection (`PingContext`) and Redis connectivity (`Ping`).
- Expected HTTP status: `200 OK`
- Returns:
  ```json
  {"database":"ok","redis":"ok","status":"ready"}
  ```
- If either PostgreSQL or Redis is unreachable, returns `503 Service Unavailable` with degraded component status.
