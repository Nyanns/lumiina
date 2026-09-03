# 📜 Error Handling Specification — Lumiina API

This document specifies the standard error response structure, correlation tracking, and HTTP status code mappings.

---

## 1. Standard Error Envelope

All API errors return a consistent, machine-readable JSON structure inspired by RFC 7807:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Title is required and must be between 3 and 100 characters",
    "request_id": "d3b62afb-0abc-4361-af98-9915257aa909"
  }
}
```

### Fields Definition
| Field | Type | Description |
|---|---|---|
| `code` | string | Machine-readable application error code (UPPER_SNAKE_CASE). |
| `message` | string | Human-readable explanation suitable for display or logging. |
| `request_id` | string | Unique UUID generated for tracing the request across server logs. |

---

## 2. HTTP Status Code Mapping

| Status Code | Semantic Meaning | Common Scenarios |
|---|---|---|
| `400 Bad Request` | Malformed JSON or invalid schema | Missing required fields, invalid format |
| `401 Unauthorized` | Missing or invalid authentication token | Expired JWT, tampered signature |
| `403 Forbidden` | Valid token, but lacks required permissions | Non-author editing another user's artwork |
| `404 Not Found` | Target resource does not exist | Artwork, user, or comment not found |
| `409 Conflict` | Unique constraint violation | Username or email already registered |
| `413 Payload Too Large` | Upload exceeds maximum size | Artwork image file larger than 20MB |
| `415 Unsupported Media Type` | Disallowed MIME type | Non-image upload (e.g. PDF, executable) |
| `429 Too Many Requests` | Rate limit window exceeded | More than 10 auth attempts in 1 minute |
| `500 Internal Server Error` | Unhandled server exception | Database failure, cloud upload error |
| `503 Service Unavailable` | Critical dependency offline | PostgreSQL or Redis down during healthcheck |

---

## 3. Distributed Tracing with Correlation IDs

Every incoming request is assigned an `X-Request-ID` header by `RequestIDMiddleware`. If a client sends an existing `X-Request-ID`, it is preserved and echoed in the response headers.

When troubleshooting client-reported issues:
1. Obtain the `request_id` from the client response.
2. Query server logs by `request_id` to correlate the exact execution path:
   ```bash
   docker compose logs api | grep "d3b62afb-0abc-4361-af98-9915257aa909"
   ```
