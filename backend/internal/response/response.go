package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	OK               = 0
	InvalidParams    = 40001
	Unauthorized     = 40101
	Forbidden        = 40301
	NotFound         = 40401
	Conflict         = 40901
	InternalError    = 50001
	ContentBlocked   = 50011
	AIRequestBlocked = 50021
)

type Body struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Body{Code: OK, Message: "ok", Data: data})
}
func Error(c *gin.Context, status int, code int, message string) {
	c.JSON(status, Body{Code: code, Message: message, Data: gin.H{}})
}
