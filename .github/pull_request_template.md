## 📋 Description
Provide a concise summary of the changes introduced in this PR.

## 🎯 Type of Change
- [ ] `feat`: New feature (non-breaking change which adds functionality)
- [ ] `fix`: Bug fix (non-breaking change which fixes an issue)
- [ ] `perf`: Performance improvement (queries, caching, memory allocation)
- [ ] `refactor`: Code change that neither fixes a bug nor adds a feature
- [ ] `test`: Adding missing tests or correcting existing tests
- [ ] `docs`: Documentation updates only
- [ ] `chore`: Build/CI/dependency maintenance

## 🛡️ Enterprise Quality & Security Checklist
- [ ] **Tests**: New and existing unit tests pass locally (`make test` or `go test -race ./...`).
- [ ] **Lint**: Static analysis passes with zero warnings (`go vet ./...`).
- [ ] **Observability**: Handlers and errors propagate `context.Context` and `request_id`.
- [ ] **Security**: No secrets/credentials committed. Input validation sanitized against XSS/SQL injection.
- [ ] **Fail-Fast**: Any new required environment variables added to `config.go:Validate()` and `.env.example`.
- [ ] **Database**: Versioned SQL migrations included if database schema changed (`00000X_xxx.up.sql` / `down.sql`).
