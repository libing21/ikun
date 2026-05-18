package middleware

import (
	"github.com/gin-gonic/gin"
	"kunzong/backend/internal/auth"
	"kunzong/backend/internal/model"
	"kunzong/backend/internal/response"
	"net/http"
	"strings"
)

const (
	ContextUserID = "user_id"
	ContextRole   = "role"
)

func Auth(jwtManager *auth.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Error(c, http.StatusUnauthorized, response.Unauthorized, "missing bearer token")
			c.Abort()
			return
		}
		claims, err := jwtManager.Parse(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			response.Error(c, http.StatusUnauthorized, response.Unauthorized, "invalid token")
			c.Abort()
			return
		}
		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextRole, claims.Role)
		c.Next()
	}
}
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := map[string]bool{}
	for _, role := range roles {
		allowed[role] = true
	}
	return func(c *gin.Context) {
		role, _ := c.Get(ContextRole)
		roleText, _ := role.(string)
		if !allowed[roleText] {
			response.Error(c, http.StatusForbidden, response.Forbidden, "permission denied")
			c.Abort()
			return
		}
		c.Next()
	}
}
func IsModeratorOrAdmin() gin.HandlerFunc { return RequireRole(model.RoleModerator, model.RoleAdmin) }
func CurrentUserID(c *gin.Context) uint64 {
	value, _ := c.Get(ContextUserID)
	id, _ := value.(uint64)
	return id
}
func CurrentRole(c *gin.Context) string {
	value, _ := c.Get(ContextRole)
	role, _ := value.(string)
	return role
}
