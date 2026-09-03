# 3. Redis Atomic Rate Limiting and Ephemeral Token Management

Date: 2026-09-04

## Status
Accepted

## Context
Authentication endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`) are prime targets for credential stuffing, brute-force attacks, and denial-of-service. In-memory rate limiting is insufficient for distributed multi-replica deployments. Furthermore, single-use tokens (email verification, password reset, JWT revocation) must have strict time-to-live (TTL) expiration.

## Decision
We leverage Redis as an in-memory data store for both ephemeral token lifecycle and distributed rate limiting:
1. **Atomic Rate Limiting**: Uses Redis transactions (`TxPipeline`) with `INCR` and conditional `EXPIRE` on first hit, avoiding race conditions without heavy Lua scripting. Returns RFC standard headers (`Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`).
2. **Ephemeral Single-Use Tokens**:
   - Verification tokens: Stored with 24-hour TTL. Deleted immediately upon successful verification.
   - Password reset tokens: Stored with 15-minute TTL.
   - JWT Revocation: Revoked JWT IDs (`jti`) or token hashes are stored in Redis until token expiration time.

## Consequences
- Protects auth routes from brute-force attacks across any number of horizontal API replicas.
- Zero leftover database bloat from expired verification links.
- **Trade-off**: Hard dependency on Redis availability. Redis failure triggers safe fallback or graceful degradation handled in healthcheck probes (`/readyz`).
