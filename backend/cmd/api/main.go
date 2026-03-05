package main

import (
	"log"
	"os"
	"umbra-pivpn/internal/api"
	"umbra-pivpn/internal/auth"
	"umbra-pivpn/internal/pivpn"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {
	// Set up logging
	logrus.SetLevel(logrus.InfoLevel)
	logrus.SetOutput(os.Stdout)

	// Initialize JWT secret
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-super-secret-jwt-key-change-in-production"
		logrus.Warn("Using default JWT secret - change in production!")
	}

	// Initialize auth manager
	authManager := auth.NewManager(jwtSecret)

	// Initialize PiVPN manager
	pivpnManager := pivpn.NewManager("/etc/wireguard")

	// Create router
	router := gin.Default()

	// Enable CORS for frontend
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Set up API routes with authentication
	api.SetupRoutes(router, pivpnManager, authManager)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logrus.Infof("Starting Umbra PiVPN Web Manager API server on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
