# 2. Clean Architecture and Dependency Inversion

Date: 2026-09-04

## Status
Accepted

## Context
As the Lumiina backend grew, coupling HTTP handlers directly with database queries or external cloud SDKs (Cloudinary, SMTP) would severely impede unit testing, make database migrations risky, and violate the Single Responsibility Principle.

## Decision
We enforce a strict 4-tier Clean Architecture:
```
[ HTTP Handler Layer ]  (Gin context, request binding, HTTP status codes)
         ↓
[ Service Layer ]       (Business logic, authorization rules, validation)
         ↓
[ Repository Interface] (Defined at the consumer/package boundary)
         ↓
[ Repository Impl ]     (GORM queries, SQL migrations, DB transactions)
```

Key rules:
1. Services depend strictly on **interfaces**, never on concrete repository structs.
2. Handlers never touch GORM directly.
3. Repositories handle database persistence and transactions only.

## Consequences
- **Testability**: Services can be unit-tested in isolation in milliseconds using mock implementations (`testify/mock`) without spinning up a database.
- **Maintainability**: Swapping database drivers or ORMs does not impact business logic or API contracts.
- **Trade-off**: Requires writing interface definitions and constructor wiring functions in `cmd/api/main.go`.
