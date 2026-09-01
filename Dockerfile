# ==========================================
# Stage 1: Build & Compile Binary (Builder)
# ==========================================
FROM golang:alpine AS builder

WORKDIR /app

# Install git jika ada dependensi yang butuh git
RUN apk add --no-cache git

# Copy dependensi terlebih dahulu untuk optimasi Docker layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy seluruh source code
COPY . .

# Compile static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main cmd/api/main.go

# ==========================================
# Stage 2: Final Minimalist Runtime (Runner)
# ==========================================
FROM alpine:3.19

WORKDIR /app

# Install root certificates untuk koneksi HTTPS (Cloudinary, SMTP)
RUN apk --no-cache add ca-certificates tzdata

# Salin HANYA file binary dari Stage 1
COPY --from=builder /app/main .

# Salin folder migrations jika diperlukan runtime migration
COPY db/migrations ./db/migrations

# Buka port 8080 untuk lalu lintas jaringan
EXPOSE 8080

# Health check probe for Docker / Kubernetes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/livez || exit 1

# Jalankan aplikasi saat container start
CMD ["./main"]

