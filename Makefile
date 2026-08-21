run:	
		@echo "menyalakan mesin Lumina..."
		go run cmd/api/main.go

lint:	
		@echo "Sedang Memeriksa Kode..."
		golangci-lint run

