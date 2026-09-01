.PHONY: run build test test-race lint psql docker-up docker-down docker-logs docker-build swagger migrate-up migrate-down

run:
	@echo "Starting Lumiina API..."
	go run cmd/api/main.go

build:
	@echo "Building binary..."
	go build -ldflags="-w -s" -o bin/api cmd/api/main.go

test:
	@echo "Running unit tests..."
	go test -v ./...

test-race:
	@echo "Running unit tests with data race detector..."
	go test -v -race ./...

lint:
	@echo "Running linter..."
	golangci-lint run ./...

swagger:
	@echo "Generating Swagger documentation..."
	swag init -g cmd/api/main.go

docker-up:
	@echo "Starting Docker Compose services..."
	docker compose up -d

docker-down:
	@echo "Stopping Docker Compose services..."
	docker compose down

docker-logs:
	@echo "Following Docker Compose logs..."
	docker compose logs -f

docker-build:
	@echo "Building production Docker image..."
	docker build -t lumiina-api:latest .

psql:
	@echo "Entering PostgreSQL shell..."
	docker exec -it lumiina_postgres psql -U postgres -d lumiina_db

migrate-up:
	@echo "Applying database migrations..."
	migrate -path db/migrations -database "postgresql://postgres:lumina_rahasia@localhost:5432/lumiina_db?sslmode=disable" -verbose up

migrate-down:
	@echo "Rolling back 1 migration step..."
	migrate -path db/migrations -database "postgresql://postgres:lumina_rahasia@localhost:5432/lumiina_db?sslmode=disable" -verbose down 1

web-dev:
	@echo "Starting Vite React frontend..."
	cd web && npm run dev

web-build:
	@echo "Building frontend production assets..."
	cd web && npm run build


