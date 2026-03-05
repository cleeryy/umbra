package api

import (
	"net/http"
	"strings"
	"umbra-pivpn/internal/auth"
	"umbra-pivpn/internal/pivpn"

	"github.com/gin-gonic/gin"
)

type ClientRequest struct {
	Name string `json:"name" binding:"required"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func SetupRoutes(router *gin.Engine, pivpnManager *pivpn.Manager, authManager *auth.Manager) {
	api := router.Group("/api")
	{
		// Authentication endpoints
		api.POST("/login", func(c *gin.Context) {
			var req LoginRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
				return
			}

			if !authManager.ValidateCredentials(req.Username, req.Password) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
				return
			}

			token, err := authManager.GenerateToken(req.Username)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"token":   token,
				"message": "Login successful",
			})
		})

		// Protected routes
		protected := api.Group("/")
		protected.Use(AuthMiddleware(authManager))
		{
			// Status endpoints
			protected.GET("/status", func(c *gin.Context) {
				status, err := pivpnManager.GetStatus()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, status)
			})

			protected.POST("/restart", func(c *gin.Context) {
				err := pivpnManager.RestartService()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"message": "Service restarted successfully"})
			})

			// Client management
			protected.GET("/clients", func(c *gin.Context) {
				clients, err := pivpnManager.ListClients()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"clients": clients})
			})

			protected.GET("/clients/:name", func(c *gin.Context) {
				name := c.Param("name")
				config, err := pivpnManager.GetClientConfig(name)
				if err != nil {
					c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"config": config})
			})

			protected.POST("/clients", func(c *gin.Context) {
				var req ClientRequest
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
					return
				}

				err := pivpnManager.CreateClient(req.Name)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"message": "Client created successfully"})
			})

			protected.DELETE("/clients/:name", func(c *gin.Context) {
				name := c.Param("name")
				err := pivpnManager.DeleteClient(name)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"message": "Client deleted successfully"})
			})

			// QR code generation for mobile clients
			protected.GET("/clients/:name/qr", func(c *gin.Context) {
				name := c.Param("name")
				qrCode, err := pivpnManager.GenerateQRCode(name)
				if err != nil {
					c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"qr_code": qrCode})
			})

			// Health check
			protected.GET("/health", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "umbra-pivpn"})
			})
		}

		// Public health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "umbra-pivpn"})
		})
	}
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware(authManager *auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := authManager.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Add username to context
		c.Set("username", claims.Username)
		c.Next()
	}
}
