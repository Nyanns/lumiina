# 🎨 Lumiina API — High-Performance Anime Fan Art Platform

[![Lumiina CI Pipeline](https://github.com/Nyanns/lumiina/actions/workflows/ci.yml/badge.svg)](https://github.com/Nyanns/lumiina/actions/workflows/ci.yml)
[![Go Version](https://img.shields.io/badge/Go-1.21%2B-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Lumiina** is an enterprise-grade backend service powering a Pixiv-inspired anime fan art sharing community. Built with idiomatic Go (Golang), Clean Architecture, and hardened for production reliability, cybersecurity resilience, and sub-millisecond response latency.

---

## 🌟 Key Architectural Features

- **Clean Layered Architecture**: Strict dependency flow (`Handler` → `Service` → `Repository` → `Model`) with zero circular imports.
- **Cybersecurity & Defense-in-Depth**:
  - Magic byte MIME detection (`http.DetectContentType`) preventing disguised executable uploads.
  - Rate limiting with atomic Redis transactions (`TxPipeline`) for brute-force mitigation.
  - Ephemeral single-use crypto tokens for email activation and password reset.
  - Anti-account enumeration protection across authentication endpoints.
  - HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options).
- **High-Throughput Caching & SRE**:
  - Redis cache with `singleflight.Group` to prevent cache stampedes under high concurrent load.
  - Standard library `log/slog` structured JSON logging.
  - POSIX signal handling (`SIGINT`, `SIGTERM`) with 5-second graceful shutdown drain.
  - Health check probes (`/livez`, `/readyz`).
- **Cloud Media Engine**: Cloudinary integration for automated image storage and CDN distribution.
- **Full Containerization & CI/CD**:
  - Multi-stage Dockerfile producing a tiny **~19 MB** production image with `CGO_ENABLED=0`.
  - Automated GitHub Actions testing pipeline on every push & pull request.

---

## 🛠️ Tech Stack

- **Language**: Go (v1.21+)
- **Framework**: [Gin Web Framework](https://github.com/gin-gonic/gin)
- **Database**: PostgreSQL 15 & GORM ORM
- **Cache & Ephemeral Store**: Redis 7
- **Migrations**: `golang-migrate`
- **Documentation**: Swagger / OpenAPI 2.0 via `swaggo/swag`
- **Testing**: `testify` (Suite & Mocking)

---

## 🚀 Quick Start (Docker Compose)

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Go](https://go.dev/dl/) (optional, if running natively)

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
PORT=8080
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=lumiina_db
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_SECRET=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
APP_BASE_URL=http://localhost:8080
```

### 3. Spin Up the Full Stack
Run the entire ecosystem (PostgreSQL, Redis, Lumiina API) with one command:
```bash
make docker-up
```
Or natively:
```bash
docker compose up -d --build
```

---

## 📖 Interactive API Documentation (Swagger)

Once the server is running, explore and test all endpoints via the interactive Swagger UI:

👉 **[http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)**

### API Overview Table

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register new user & send activation email | ❌ |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT Bearer token | ❌ |
| `GET` | `/api/v1/auth/verify-email` | Activate user account via verification token | ❌ |
| `POST` | `/api/v1/auth/forgot-password` | Request 15-min password reset token | ❌ |
| `POST` | `/api/v1/auth/reset-password` | Reset password using valid reset token | ❌ |
| `GET` | `/api/v1/artworks` | Get paginated artwork feed, search & tag filter | ❌ |
| `GET` | `/api/v1/artworks/:id` | Get artwork details with tags & author | ❌ |
| `POST` | `/api/v1/artworks` | Upload fan art image (`multipart/form-data`) | ✅ |
| `PUT` | `/api/v1/artworks/:id` | Update artwork title & description | ✅ |
| `DELETE` | `/api/v1/artworks/:id` | Delete artwork (Author / Admin only) | ✅ |
| `GET` | `/api/v1/artworks/:id/comments` | Get paginated comments for artwork | ❌ |
| `POST` | `/api/v1/artworks/:id/comments` | Post comment (HTML sanitized) | ✅ |
| `DELETE` | `/api/v1/comments/:id` | Delete comment (Author / Admin only) | ✅ |
| `GET` | `/api/v1/users/me` | Get currently authenticated user profile | ✅ |
| `GET` | `/api/v1/users/search` | Search artists/users by username keyword | ❌ |
| `GET` | `/api/v1/users/:id` | Get public artist profile & their uploaded artworks | ❌ |
| `GET` | `/livez` | Liveness health probe | ❌ |
| `GET` | `/readyz` | Readiness health probe | ❌ |

---

## 🧪 Testing & Quality Assurance

Run the automated test suite with race detector:
```bash
make test-race
```

Regenerate Swagger annotations:
```bash
make swagger
```

---

## 📁 Project Structure

```text
lumiina/
├── .github/workflows/ci.yml # Automated CI Pipeline (GitHub Actions)
├── cmd/api/main.go          # Application Entrypoint & Graceful Shutdown
├── config/                  # Database, Redis, and Environment Config
├── db/migrations/           # PostgreSQL Schema Migrations (golang-migrate)
├── docs/                    # OpenAPI / Swagger Generated Specifications
├── internal/
│   ├── handler/             # HTTP Handlers (Gin Web Transport Layer)
│   ├── middleware/          # Security, Auth, Rate Limiter, Timeout Middlewares
│   ├── model/               # Domain Models & Request/Response DTOs
│   ├── pkg/                 # Cloudinary & SMTP Mailer Integrations
│   ├── repository/          # GORM Database Operations & Queries
│   └── service/             # Business Logic & Security Sanitization
├── Dockerfile               # Production Multi-Stage Container Definition
├── docker-compose.yml       # Multi-Service Orchestration Specification
└── Makefile                 # Developer Task Automation Commands
```
