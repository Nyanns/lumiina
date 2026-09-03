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
| Runtime | Go 1.24+ |
| HTTP Framework | [Gin](https://github.com/gin-gonic/gin) |
| Database & ORM | PostgreSQL 15/16 with `pg_trgm`, [GORM](https://gorm.io/) |
| Cache & Ephemeral Store | Redis 7 |
| Image Hosting | Cloudinary SDK |
| Email Service | Standard `net/smtp` |
| Migrations | [golang-migrate](https://github.com/golang-migrate/migrate) |
| Documentation | OpenAPI 2.0 / Swagger ([swaggo/swag](https://github.com/swaggo/swag)) |
| Testing | [testify](https://github.com/stretchr/testify) (mock & suite) |
| Metrics & Monitoring | [Prometheus client_golang](https://github.com/prometheus/client_golang) |

---

## 📚 Documentation & Engineering Runbooks

- **[Architecture Decision Records (ADRs)](docs/adr/)**: Architectural rationale, trade-offs, and design choices.
  - [ADR 0001: Record Architecture Decisions](docs/adr/0001-record-architecture-decisions.md)
  - [ADR 0002: Clean Architecture and Dependency Inversion](docs/adr/0002-clean-architecture-and-dependency-inversion.md)
  - [ADR 0003: Redis Atomic Rate Limiting & Ephemeral Tokens](docs/adr/0003-redis-atomic-rate-limiting-and-ephemeral-tokens.md)
  - [ADR 0004: PostgreSQL Trigram GIN Indexes for Substring Search](docs/adr/0004-postgresql-trigram-gin-indexes-for-search.md)
- **[Deployment Runbook](docs/DEPLOYMENT.md)**: Production deployment instructions, cloud platform setup, and zero-downtime healthcheck probes.
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)**: Step-by-step diagnostics for database connection, fail-fast aborts, CORS, and Cloudinary.
- **[Error Handling Specification](docs/ERROR_HANDLING.md)**: Standardized RFC 7807-inspired JSON error envelopes and status code mappings.
- **[Contributing Guidelines](CONTRIBUTING.md)**: Gitflow branching rules, Conventional Commits, and PR checklists.

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Go 1.24+ (for native local development)

### 1. Environment Configuration
Copy the template and populate with your credentials:
```bash
cp .env.example .env
```
> **Notice**: The server enforces **Fail-Fast** startup validation. Missing mandatory variables (`JWT_SECRET` >= 32 chars, valid `CLOUDINARY_SECRET`) will intentionally halt the process with a descriptive error.

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

# Run test suite with data race detector
make test-race

# Regenerate Swagger documentation
make swagger
```

---

## API Standards & Reference

### Versioning Strategy
Lumiina follows **URL Path Versioning** (`/api/v1/`). Major breaking changes introduce a new path segment (`/api/v2/`), while non-breaking changes (additive fields, optional query parameters) are released backward-compatibly within the current version.

### Interactive Swagger UI
Interactive OpenAPI documentation is available at `/swagger/index.html` when the service is running:
**[http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)**

### Endpoints Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register new user and send activation email | Public (Rate Limited) |
| `POST` | `/api/v1/auth/login` | Authenticate credentials and return JWT token | Public (Rate Limited) |
| `GET` | `/api/v1/auth/verify-email` | Verify account via email token | Public |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | Public (Rate Limited) |
| `POST` | `/api/v1/auth/reset-password` | Set new password with reset token | Public (Rate Limited) |
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
| `GET` | `/readyz` | Readiness health probe (DB & Redis ping) | Public |
| `GET` | `/metrics` | Prometheus metrics scrape endpoint | Public |

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
