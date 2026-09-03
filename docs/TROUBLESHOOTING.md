# 🔍 Troubleshooting Guide — Lumiina Backend

This guide covers resolution steps for common operational issues encountered during development and production.

---

## 1. 🛑 Server Startup Aborts (`os.Exit(1)`)

### Symptom: `Configuration validation failed`
```text
{"time":"...","level":"ERROR","msg":"Configuration validation failed","error":"configuration validation failed:\n - JWT_SECRET length is 24, must be at least 32 characters..."}
```
**Cause**: The application employs a strict **Fail-Fast** startup gate. Insecure or missing environment variables halt initialization immediately.
**Resolution**:
1. Check your `.env` file.
2. Ensure `JWT_SECRET` has at least 32 characters.
3. Ensure `CLOUDINARY_SECRET` starts with `cloudinary://`.
4. Ensure `DB_HOST`, `DB_NAME`, and `DB_USER` are defined.

---

## 2. 🗄️ Database Connection Issues

### Symptom: `Failed to connect to database`
```text
{"time":"...","level":"ERROR","msg":"Failed to connect to database"}
```
**Diagnosis Steps**:
1. **Check container status**:
   ```bash
   docker compose ps lumiina_postgres
   ```
2. **Test port connectivity**:
   ```bash
   nc -zv localhost 5432
   ```
3. **Verify credentials via psql**:
   ```bash
   make psql
   ```
4. **Network isolation in Docker**: If running API natively (`make run`), `DB_HOST` must be `localhost`. If running via Docker Compose, `DB_HOST` must be `postgres`.

---

## 3. 🌐 CORS Blocked in Browser

### Symptom: `Access to fetch at ... has been blocked by CORS policy`
**Cause**: The request `Origin` header does not match any entry in the allowed origins whitelist.
**Resolution**:
1. Check `ALLOWED_ORIGINS` in your `.env` file.
2. Ensure your frontend client URL (e.g. `http://localhost:5173`) is listed:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://lumiina.art
   ```
3. Restart the server/container to apply the new configuration.

---

## 4. ⏳ Rate Limiting: `429 Too Many Requests`

### Symptom: Auth requests return HTTP 429
```json
{"error":"Too many requests. Please slow down."}
```
Response headers:
```http
Retry-After: 48
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
```
**Cause**: More than 10 requests within a 60-second window originated from the same IP address on auth endpoints.
**Resolution**:
1. Wait until `Retry-After` seconds expire.
2. For testing, flush the rate-limit keys in Redis:
   ```bash
   docker exec -it lumiina_redis redis-cli FLUSHDB
   ```

---

## 5. ☁️ Cloudinary Upload Failures

### Symptom: `Invalid signature` or upload timeouts
**Diagnosis Steps**:
1. Verify the format in `.env`: `cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>`
2. Test network connectivity from inside the container:
   ```bash
   docker exec -it lumiina_api wget -qO- https://api.cloudinary.com
   ```
3. Inspect Cloudinary account storage and plan quotas.
