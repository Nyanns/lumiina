# Contributing to Lumiina

Thank you for your interest in contributing to **Lumiina**! To maintain enterprise-grade reliability and high-performance engineering, all contributions must adhere to the standards outlined below.

---

## Gitflow and Branching Strategy

- **`main`**: Production releases only. Protected branch.
- **`develop`**: Primary integration branch for active development.
- **`feature/<name>`**: Feature branches branched from `develop`.
- **`fix/<name>`**: Bugfix branches branched from `develop`.
- **`perf/<name>`**: Performance optimization branches.

### Branch Lifecycle
1. Branch off `develop`: `git checkout -b feature/my-new-feature develop`
2. Commit small, logical changes following **Conventional Commits**.
3. Push to origin and open a Pull Request targeting `develop`.

---

## Conventional Commits Standard

All commit messages must follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

- `feat`: New user-facing feature or endpoint
- `fix`: Bug fix
- `perf`: Performance improvement (queries, caching, allocations)
- `refactor`: Structural refactor with zero behavior changes
- `test`: Adding or updating test suites
- `docs`: Documentation updates only
- `chore`: Dependency updates, tooling, build scripts

*Examples:*
- `feat(artwork): implement cursor-based pagination for feed`
- `fix(auth): mitigate timing attack on password comparison`
- `perf(db): add pg_trgm GIN index on artwork title`

---

## Local Testing and Verification Gates

Before submitting a PR, verify that all quality gates pass locally:

```bash
# 1. Run all backend unit tests with race detector
make test-race

# 2. Run Go vet static analysis
go vet ./...

# 3. Verify frontend production build
cd web && npm run build && cd ..

# 4. Verify Docker Compose configuration
docker compose config

# 5. Regenerate Swagger documentation (if API routes or DTOs changed)
make swagger
```

---

## Security and Performance Principles

1. **Defense-in-Depth**: Always validate request inputs and sanitize HTML content (`html.EscapeString`).
2. **Timing Attacks**: Use `crypto/subtle.ConstantTimeCompare` and dummy bcrypt operations for credential checks.
3. **Database Performance**: Never use unscoped queries or string-interpolated SQL. Always leverage prepared statements and proper composite/GIN indexes.
4. **Fail-Fast Configuration**: Never introduce silent fallback secrets. All mandatory secrets must be strictly checked in `config.go:Validate()`.
