package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"umbra-pivpn/internal/api"
	"umbra-pivpn/internal/auth"
	"umbra-pivpn/internal/middleware"
	"umbra-pivpn/internal/pivpn"
)

func main() {
	// Set up structured logging
	setupLogging()

	// Get configuration from environment
	config := loadConfig()

	// Validate critical configuration
	if config.JWTSecret == "" {
		logrus.Fatal("JWT_SECRET environment variable is required")
	}

	if config.AdminUsername == "" || config.AdminPassword == "" {
		logrus.Fatal("ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required")
	}

	// Initialize auth manager with secure credentials
	authManager := auth.NewManager(config.JWTSecret, config.AdminUsername, config.AdminPassword)

	// Initialize PiVPN manager
	pivpnManager := pivpn.NewManager(config.WireGuardPath)

	// Set Gin mode based on environment
	if config.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.New()

	// Add recovery middleware
	router.Use(gin.Recovery())

	// Add structured logging middleware
	router.Use(structuredLogger())

	// Add CORS middleware with proper configuration
	router.Use(corsMiddleware(config.CORSOrigins))

	// Add rate limiting
	router.Use(middleware.RateLimit())

	// Add request size limit (10MB)
	router.Use(middleware.RequestSizeLimit(10 * 1024 * 1024))

	// Add timeout middleware
	timeoutDuration := parseDuration(config.RequestTimeout, 30*time.Second)
	router.Use(middleware.Timeout(timeoutDuration))

	// Set up API routes with authentication
	api.SetupRoutes(router, pivpnManager, authManager)

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + config.Port,
		Handler:      router,
		ReadTimeout:  timeoutDuration,
		WriteTimeout: timeoutDuration,
		IdleTimeout:  120 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logrus.WithFields(logrus.Fields{
			"port":    config.Port,
			"env":     config.Environment,
			"version": "1.0.0",
		}).Info("Starting Umbra PiVPN Web Manager API server")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("Shutting down server...")

	// Create a context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Shutdown the server
	if err := srv.Shutdown(ctx); err != nil {
		logrus.WithError(err).Fatal("Server forced to shutdown")
	}

	logrus.Info("Server exited gracefully")
}

// Config holds application configuration
type Config struct {
	Port           string
	JWTSecret      string
	AdminUsername  string
	AdminPassword  string
	CORSOrigins    []string
	Environment    string
	LogLevel       string
	RequestTimeout string
	WireGuardPath  string
}

// loadConfig loads configuration from environment variables
func loadConfig() Config {
	return Config{
		Port:           getEnv("PORT", "8080"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		AdminUsername:  os.Getenv("ADMIN_USERNAME"),
		AdminPassword:  os.Getenv("ADMIN_PASSWORD"),
		CORSOrigins:    parseCORSOrigins(os.Getenv("CORS_ORIGINS")),
		Environment:    getEnv("ENVIRONMENT", "development"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		RequestTimeout: getEnv("REQUEST_TIMEOUT", "30"),
		WireGuardPath:  getEnv("WIREGUARD_CONFIG_PATH", "/etc/wireguard"),
	}
}

// getEnv gets environment variable or returns default
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// parseCORSOrigins parses comma-separated CORS origins
func parseCORSOrigins(origins string) []string {
	if origins == "" {
		return []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	}
	return splitAndTrim(origins, ",")
}

// splitAndTrim splits string by separator and trims whitespace
func splitAndTrim(s, sep string) []string {
	parts := make([]string, 0)
	for _, part := range splitString(s, sep) {
		trimmed := trimString(part)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}

// splitString splits a string by separator
func splitString(s, sep string) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if i < len(s)-len(sep)+1 && s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
		}
	}
	result = append(result, s[start:])
	return result
}

// trimString removes whitespace from start and end
func trimString(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}

// setupLogging configures structured logging
func setupLogging() {
	logrus.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	logrus.SetOutput(os.Stdout)

	// Set log level
	level := getEnv("LOG_LEVEL", "info")
	parsedLevel, err := logrus.ParseLevel(level)
	if err != nil {
		logrus.SetLevel(logrus.InfoLevel)
		logrus.WithError(err).Warn("Invalid LOG_LEVEL, defaulting to info")
	} else {
		logrus.SetLevel(parsedLevel)
	}
}

// structuredLogger returns Gin middleware for structured logging
func structuredLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logrus.WithFields(logrus.Fields{
			"method":    param.Method,
			"path":      param.Path,
			"status":    param.StatusCode,
			"latency":   param.Latency,
			"client_ip": param.ClientIP,
			"error":     param.ErrorMessage,
		}).Info("HTTP request")
		return ""
	})
}

// corsMiddleware returns CORS middleware with proper configuration
func corsMiddleware(allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin || allowedOrigin == "*" {
				allowed = true
				break
			}
		}

		// Set CORS headers
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// parseDuration parses duration string with fallback
func parseDuration(s string, fallback time.Duration) time.Duration {
	seconds, err := time.ParseDuration(s + "s")
	if err != nil {
		return fallback
	}
	return seconds
}
