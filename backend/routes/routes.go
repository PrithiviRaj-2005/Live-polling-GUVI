package routes

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"live-polling-tool/controllers"
)

func authRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		userID, ok := controllers.ParseToken(strings.TrimPrefix(header, "Bearer "))
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Please sign in to continue"})
			return
		}
		c.Set("userId", userID)
		c.Next()
	}
}

func Register(router *gin.Engine) {
	auth := &controllers.AuthController{}
	polls := &controllers.PollController{}
	api := router.Group("/api")
	api.POST("/auth/signup", auth.Signup)
	api.POST("/auth/login", auth.Login)
	api.GET("/auth/me", authRequired(), auth.Me)
	api.POST("/polls", authRequired(), polls.Create)
	api.GET("/polls/:id", polls.Get)
	api.POST("/polls/:id/vote", polls.Vote)
	api.GET("/polls/:id/stream", polls.Stream)
}
