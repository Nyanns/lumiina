package main

import (
	"fmt"

	"github.com/sandi/lumiina/config"
)

func main() {
	cfg := config.LoadConfig()
	db := config.ConnectDB(cfg)
	if db != nil {
		fmt.Printf("Lumiina Server is ready %v", db)
	}
}
