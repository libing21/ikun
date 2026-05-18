package main

import (
	"context"
	"log"

	"github.com/joho/godotenv"

	"kunzong/backend/internal/ai"
	"kunzong/backend/internal/config"
	"kunzong/backend/internal/database"
	"kunzong/backend/internal/hotspot"
	"kunzong/backend/internal/moderation"
	"kunzong/backend/internal/repository"
	"kunzong/backend/internal/router"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	db, err := database.Open(cfg.DBDriver, cfg.DatabaseDSN)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	repo := repository.New(db)
	checker := moderation.NewChecker()
	provider := ai.NewArkProvider(cfg.ArkAPIKey, cfg.ArkBaseURL, cfg.ArkModel)
	hotspot.NewWorker(cfg, repo, provider, checker).Start(context.Background())

	r := router.New(cfg, db)
	log.Printf("ikun API listening on %s", cfg.HTTPAddr)
	if err := r.Run(cfg.HTTPAddr); err != nil {
		log.Fatalf("run server: %v", err)
	}
}
