package api

import (
	"net/http"
	"pivpn-web-manager/internal/auth"
	"pivpn-web-manager/internal/pivpn"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
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
			start := time.Now()

			var req LoginRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				logrus.WithFields(logrus.Fields{
					"error":     err.Error(),
					"client_ip": c.ClientIP(),
				}).Warn("Invalid login request")
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
				return
			}

			// Rate limiting check (basic implementation)
			if isRateLimited(c.ClientIP()) {
				logrus.WithFields(logrus.Fields{
					"client_ip": c.ClientIP(),
					"username":  req.Username,
				}).Warn("Rate limited login attempt")
				c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many requests"})
				return
			}

			if !authManager.ValidateCredentials(req.Username, req.Password) {
				logrus.WithFields(logrus.Fields{
					"client_ip": c.ClientIP(),
					"username":  req.Username,
					"duration":  time.Since(start).String(),
				}).Warn("Failed login attempt")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
				return
			}

			token, err := authManager.GenerateToken(req.Username)
			if err != nil {
				logrus.WithFields(logrus.Fields{
					"error":     err.Error(),
					"username":  req.Username,
					"client_ip": c.ClientIP(),
				}).Error("Failed to generate JWT token")
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
				return
			}

			logrus.WithFields(logrus.Fields{
				"username":  req.Username,
				"client_ip": c.ClientIP(),
				"duration":  time.Since(start).String(),
			}).Info("Successful login")

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

			// Health check endpoint is now public (moved outside protected routes)
		}

		// Public health check - moved outside protected routes
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

// Rate limiting implementation
var (
	loginAttempts = make(map[string]int)
	lastAttempt   = make(map[string]time.Time)
	mu            sync.RWMutex
)

func isRateLimited(ip string) bool {
	mu.Lock()
	defer mu.Unlock()

	now := time.Now()
	last, exists := lastAttempt[ip]

	// Reset counter if more than 1 minute has passed
	if exists && now.Sub(last) > time.Minute {
		loginAttempts[ip] = 0
	}

	// Check if rate limit exceeded (5 attempts per minute)
	if loginAttempts[ip] >= 5 {
		return true
	}

	loginAttempts[ip]++
	lastAttempt[ip] = now
	return false
}
