package main

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"live-polling-tool/config"
	"live-polling-tool/routes"
)

func main() {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		panic("Error loading .env file")
	}

	config.ConnectMongoDB()
	config.ConnectRedis()

	router := gin.Default()
	router.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		frontendURL := os.Getenv("FRONTEND_URL")

		allowed := false
		if origin != "" {
			if frontendURL == "*" {
				allowed = true
			} else {
				for _, allowedOrigin := range strings.Split(frontendURL, ",") {
					if strings.TrimSpace(allowedOrigin) == origin {
						allowed = true
						break
					}
				}
				if !allowed && (strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:")) {
					allowed = true
				}
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		} else if frontendURL != "" && !strings.Contains(frontendURL, ",") {
			c.Header("Access-Control-Allow-Origin", frontendURL)
		} else {
			c.Header("Access-Control-Allow-Origin", "http://localhost:5174")
		}

		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Vary", "Origin")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})
	routes.Register(router)

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Live Polling API is running!",
		})
	})

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	port := os.Getenv("PORT")
	if strings.TrimSpace(port) == "" {
		port = "8080"
	}
	router.Run(":" + port)
}
