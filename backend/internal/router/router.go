package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"kunzong/backend/internal/ai"
	"kunzong/backend/internal/auth"
	"kunzong/backend/internal/config"
	"kunzong/backend/internal/handler"
	"kunzong/backend/internal/hotspot"
	"kunzong/backend/internal/middleware"
	"kunzong/backend/internal/moderation"
	"kunzong/backend/internal/repository"
	"kunzong/backend/internal/service"
)

func New(cfg config.Config, db *gorm.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(cors.New(cors.Config{AllowOrigins: cfg.CORSOrigins, AllowMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"}, AllowHeaders: []string{"Authorization", "Content-Type"}, AllowCredentials: true, MaxAge: 12 * time.Hour}))

	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.JWTTTL)
	repo := repository.New(db)
	checker := moderation.NewChecker()
	provider := ai.NewArkProvider(cfg.ArkAPIKey, cfg.ArkBaseURL, cfg.ArkModel)
	hotspotWorker := hotspot.NewWorker(cfg, repo, provider, checker)
	h := handler.New(service.New(repo, jwtManager, checker, provider, hotspotWorker))
	authRequired := middleware.Auth(jwtManager)

	r.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/register", h.Register)
		v1.POST("/auth/login", h.Login)
		v1.POST("/auth/refresh", h.Refresh)
		v1.POST("/auth/logout", authRequired, h.Logout)
		v1.GET("/auth/me", authRequired, h.Me)

		v1.GET("/users/:id", h.UserByID)
		v1.GET("/me/posts", authRequired, h.MyPosts)
		v1.GET("/me/favorites", authRequired, h.MyFavorites)
		v1.GET("/me/reports", authRequired, h.MyReports)

		v1.GET("/posts", h.ListPosts)
		v1.POST("/posts", authRequired, h.CreatePost)
		v1.GET("/posts/:id", h.GetPost)
		v1.PATCH("/posts/:id", authRequired, h.UpdatePost)
		v1.DELETE("/posts/:id", authRequired, h.DeletePost)
		v1.GET("/posts/:id/comments", h.ListComments)
		v1.POST("/posts/:id/comments", authRequired, h.CreateComment)
		v1.POST("/posts/:id/like", authRequired, h.LikePost)
		v1.DELETE("/posts/:id/like", authRequired, h.UnlikePost)
		v1.POST("/posts/:id/favorite", authRequired, h.FavoritePost)
		v1.DELETE("/posts/:id/favorite", authRequired, h.UnfavoritePost)

		v1.PATCH("/comments/:id", authRequired, h.UpdateComment)
		v1.DELETE("/comments/:id", authRequired, h.DeleteComment)
		v1.POST("/reports", authRequired, h.CreateReport)

		v1.POST("/media/upload", authRequired, h.UploadMedia)
		v1.GET("/media/:id", h.GetMedia)

		v1.POST("/ai/conversations", authRequired, h.CreateAIConversation)
		v1.GET("/ai/conversations", authRequired, h.ListAIConversations)
		v1.GET("/ai/conversations/:id/messages", authRequired, h.AIMessages)
		v1.POST("/ai/conversations/:id/messages", authRequired, h.SendAIMessage)
		v1.POST("/ai/hotspots/generate", authRequired, h.GenerateHotspotDraft)

		admin := v1.Group("/admin", authRequired, middleware.IsModeratorOrAdmin())
		admin.GET("/moderation/jobs", h.ModerationJobs)
		admin.POST("/moderation/jobs/:id/review", h.ReviewModerationJob)
		admin.GET("/reports", h.AdminReports)
		admin.POST("/reports/:id/resolve", h.ResolveReport)
	}
	return r
}
