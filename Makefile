.PHONY: run build test test-race lint fmt tidy clean coverage verify psql docker-up docker-down docker-logs docker-build swagger migrate-up migrate-down migrate-version web-dev web-build


run:
	@echo "Starting Lumiina API..."
	go run cmd/api/main.go

build:
	@echo "Building production binary..."
	go build -ldflags="-w -s" -o bin/api cmd/api/main.go

test:
	@echo "Running unit tests..."
	go test -v ./...

test-race:
	@echo "Running unit tests with data race detector..."
	go test -v -race ./...

coverage:
	@echo "Generating test coverage report..."
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out

coverage-html:
	@echo "Opening HTML test coverage report..."
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

fmt:
	@echo "Formatting Go code according to Uber / Google Go style..."
	gofmt -s -w .

tidy:
	@echo "Tidying module dependencies..."
	go mod tidy

clean:
	@echo "Cleaning binaries and build artifacts..."
	rm -rf bin/ tmp/ coverage.out coverage.html

verify: fmt tidy test-race
	@echo "All pre-commit quality gates passed successfully!"

lint:
	@echo "Running linter..."
	golangci-lint run ./...

swagger:
	@echo "Generating Swagger documentation..."
	swag init -g cmd/api/main.go

docker-up:
	@echo "Starting Docker Compose services (auto-building if code changed)..."
	docker compose up -d --build

docker-down:
	@echo "Stopping Docker Compose services..."
	docker compose down

docker-restart:
	@echo "Restarting Docker Compose services with fresh build..."
	docker compose down && docker compose up -d --build

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

migrate-version:
	@echo "Checking current database migration version..."
	migrate -path db/migrations -database "postgresql://postgres:lumina_rahasia@localhost:5432/lumiina_db?sslmode=disable" version

web-dev:
	@echo "Starting Vite React frontend..."
	cd web && (test -d node_modules || npm install) && npm run dev

web-build:
	@echo "Building frontend production assets..."
	cd web && npm run build



