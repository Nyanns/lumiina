run:	
		@echo "menyalakan mesin Lumina..."
		go run cmd/api/main.go

lint:	
		@echo "Sedang Memeriksa Kode..."
		golangci-lint run

psql:
		@echo "Masuk ke terminal PostgreSQL..."
		docker exec -it lumiina-postgres psql -U postgres -d lumiina_db


build:	
		@echo "Membangun binary aplikasi..."
		go build -o bin/api cmd/api/main.go

test:	
		@echo "Menjalankan testing..."
		go test -v ./...

migrate-up:
		@echo "Membangun tabel database..."
		migrate -path db/migrations -database "postgresql://postgres:lumina_rahasia@localhost:5432/lumiina_db?sslmode=disable" -verbose up

migrate-down:
		@echo "Menghancurkan tabel database (Mundur 1 langkah)..."
		migrate -path db/migrations -database "postgresql://postgres:lumina_rahasia@localhost:5432/lumiina_db?sslmode=disable" -verbose down 1
