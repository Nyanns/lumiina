# Lumiina API

[![CI Quality & Security Gates](https://github.com/Nyanns/lumiina/actions/workflows/ci.yml/badge.svg)](https://github.com/Nyanns/lumiina/actions/workflows/ci.yml)
[![CodeQL Security Analysis](https://github.com/Nyanns/lumiina/actions/workflows/codeql.yml/badge.svg)](https://github.com/Nyanns/lumiina/actions/workflows/codeql.yml)
[![Go Report Card](https://goreportcard.com/badge/github.com/Nyanns/lumiina)](https://goreportcard.com/report/github.com/Nyanns/lumiina)
[![Go Version](https://img.shields.io/badge/Go-1.24%2B-00ADD8?style=flat&logo=go)](https://go.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

High-performance, enterprise-grade backend REST API for **Lumiina**, an anime fan art sharing platform inspired by Pixiv. Engineered with Go 1.24, Gin, PostgreSQL (pg_trgm), GORM, Redis 7, and Cloudinary.

---

## Architecture & Enterprise Hardening

- **Layered Clean Architecture**: Strict unidirectional dependency flow (`Handler` -> `Service` -> `Repository Interface` -> `Model`). Fully mockable for unit testing.
- **Fail-Fast Configuration**:
  - Centralized `cfg.Validate()` executing strict startup verification.
  - Insecure default placeholders prohibited; `JWT_SECRET` strictly enforced to ≥ 32 characters for HMAC-SHA256 compliance.
  - Mandatory prefix verification on `CLOUDINARY_SECRET` (`cloudinary://...`).
- **Observability & Correlation Tracing**:
  - Automatic `X-Request-ID` injection via global middleware for end-to-end distributed tracing.
  - Standardized structured JSON logging using Go standard library `log/slog`.
- **Advanced API Security & Defense-in-Depth**:
  - Anti-timing attack mitigation using constant-time evaluation and pre-computed bcrypt canary hashes for non-existent users.
  - OWASP CORS strict whitelisting (`ALLOWED_ORIGINS`) preventing unauthorized credentials leakage.
  - Slowloris DoS mitigation via hardened `http.Server` timeouts (`ReadHeaderTimeout: 5s`, `MaxHeaderBytes: 1MB`).
  - Strict Content Security Policy (CSP), HSTS, and nosniff defense headers.
  - Ephemeral single-use tokens in Redis for email verification (24h TTL) and password reset (15m TTL).
  - Sliding window rate limiting via atomic Redis Lua pipelines.
- **High-Performance Database Engine**:
  - GIN Trigram (`pg_trgm`) full-text indexes supporting ultra-fast fuzzy substring search on artworks and usernames without full table scans.
  - Connection pool sizing tuned according to hardware saturation formulas (`MaxOpenConns: 50`, `MaxIdleConns: 25`, `ConnMaxLifetime: 15m`).
- **Quality Gates & CI/CD**:
  - Automated GitHub Actions CI pipeline running `golangci-lint`, race-detector test suite (`go test -v -race`), and atomic coverage reports.
  - Automated Static Application Security Testing (SAST) via GitHub CodeQL.
  - Dependabot automated weekly dependency vulnerability patching.


---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| Runtime | Go 1.21+ |
| HTTP Framework | [Gin](https://github.com/gin-gonic/gin) |
| Database & ORM | PostgreSQL 15, [GORM](https://gorm.io/) |
| Cache & Ephemeral Store | Redis 7 |
| Image Hosting | Cloudinary SDK |
| Email Service | Standard `net/smtp` |
| Migrations | [golang-migrate](https://github.com/golang-migrate/migrate) |
| Documentation | OpenAPI 2.0 / Swagger ([swaggo/swag](https://github.com/swaggo/swag)) |
| Testing | [testify](https://github.com/stretchr/testify) (mock & suite) |

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Go 1.21+ (for native local development)

### 1. Environment Configuration
Create a `.env` file in the root directory:

```env
PORT=8080
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=lumiina_db
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=replace_with_a_secure_random_key
CLOUDINARY_SECRET=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
APP_BASE_URL=http://localhost:8080
```

### 2. Run with Docker Compose
```bash
# Build and start all services in background
make docker-up

# View combined service logs
make docker-logs

# Stop services
make docker-down
```

### 3. Native Development
```bash
# Start API locally
make run

# Run test suite with race detector
make test-race

# Regenerate Swagger documentation
make swagger
```

---

## API Reference

Interactive OpenAPI documentation is available at `/swagger/index.html` when the service is running:

**[http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)**

### Endpoints Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register new user and send activation email | Public |
| `POST` | `/api/v1/auth/login` | Authenticate credentials and return JWT token | Public |
| `GET` | `/api/v1/auth/verify-email` | Verify account via email token | Public |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | Public |
| `POST` | `/api/v1/auth/reset-password` | Set new password with reset token | Public |
| `GET` | `/api/v1/artworks` | Get artwork feed with search and tag filters | Public |
| `GET` | `/api/v1/artworks/:id` | Get artwork by ID with author and tags | Public |
| `POST` | `/api/v1/artworks` | Upload artwork (`multipart/form-data`) | Bearer |
| `PUT` | `/api/v1/artworks/:id` | Update artwork title and description | Bearer |
| `DELETE` | `/api/v1/artworks/:id` | Delete artwork (Author or Admin) | Bearer |
| `GET` | `/api/v1/artworks/:id/comments` | List comments for an artwork | Public |
| `POST` | `/api/v1/artworks/:id/comments` | Post a comment on an artwork | Bearer |
| `DELETE` | `/api/v1/comments/:id` | Delete comment (Author or Admin) | Bearer |
| `GET` | `/api/v1/users/me` | Get authenticated user profile | Bearer |
| `GET` | `/api/v1/users/search` | Search users by username keyword (`?q=`) | Public |
| `GET` | `/api/v1/users/:id` | Get public artist profile with uploaded artworks | Public |
| `GET` | `/livez` | Liveness health probe | Public |
| `GET` | `/readyz` | Readiness health probe | Public |

---

## Project Structure

```text
lumiina/
├── .github/workflows/ci.yml # GitHub Actions CI pipeline
├── cmd/api/main.go          # Application entrypoint & HTTP server
├── config/                  # Configuration & database/Redis initialization
├── db/migrations/           # SQL migration files (golang-migrate)
├── docs/                    # Generated Swagger / OpenAPI documentation
├── internal/
│   ├── handler/             # Gin HTTP handlers
│   ├── middleware/          # Security, auth, rate limit, timeout middlewares
│   ├── model/               # Data models & DTOs
│   ├── pkg/                 # Cloudinary & SMTP email clients
│   ├── repository/          # GORM database queries
│   └── service/             # Business logic & input sanitization
├── Dockerfile               # Multi-stage production container
├── docker-compose.yml       # Local development multi-container orchestration
└── Makefile                 # Build, test, and container automation
```
