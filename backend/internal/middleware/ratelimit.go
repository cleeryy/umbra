package middleware

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/time/rate"
)

// RateLimiter holds rate limiters per IP
type RateLimiter struct {
	visitors map[string]*rate.Limiter
	limit    rate.Limit
	burst    int
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rps float64, burst int) *RateLimiter {
	return &RateLimiter{
		visitors: make(map[string]*rate.Limiter),
		limit:    rate.Limit(rps),
		burst:    burst,
	}
}

// getLimiter returns a rate limiter for the given IP
func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	limiter, exists := rl.visitors[ip]
	if !exists {
		limiter = rate.NewLimiter(rl.limit, rl.burst)
		rl.visitors[ip] = limiter
	}
	return limiter
}

// ParseRateLimit parses rate limit from environment variable
// Format: "requests:burst" e.g., "10:20"
func ParseRateLimit(env string) (float64, int) {
	defaultRPS := 10.0
	defaultBurst := 20

	val := os.Getenv(env)
	if val == "" {
		return defaultRPS, defaultBurst
	}

	parts := strings.Split(val, ":")
	if len(parts) != 2 {
		return defaultRPS, defaultBurst
	}

	rps, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return defaultRPS, defaultBurst
	}

	burst, err := strconv.Atoi(parts[1])
	if err != nil {
		return defaultRPS, defaultBurst
	}

	return rps, burst
}

// RateLimit middleware limits requests per IP
func RateLimit() gin.HandlerFunc {
	rps, burst := ParseRateLimit("RATE_LIMIT")
	limiter := NewRateLimiter(rps, burst)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		l := limiter.getLimiter(ip)

		if !l.Allow() {
			logrus.WithFields(logrus.Fields{
				"ip":     ip,
				"path":   c.Request.URL.Path,
				"method": c.Request.Method,
			}).Warn("Rate limit exceeded")

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests. Please try again later.",
			})
			return
		}

		c.Next()
	}
}

// RateLimitByPath applies different rate limits for different paths
func RateLimitByPath(limits map[string]*rate.Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		path := c.Request.URL.Path

		// Find matching limiter
		var limiter *rate.Limiter
		for prefix, l := range limits {
			if strings.HasPrefix(path, prefix) {
				limiter = l
				break
			}
		}

		// Default limiter if no match
		if limiter == nil {
			limiter = rate.NewLimiter(10, 20)
		}

		if !limiter.Allow() {
			logrus.WithFields(logrus.Fields{
				"ip":     ip,
				"path":   path,
				"method": c.Request.Method,
			}).Warn("Path-specific rate limit exceeded")

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests for this endpoint. Please try again later.",
			})
			return
		}

		c.Next()
	}
}

// LoginRateLimit specifically limits login attempts
func LoginRateLimit() gin.HandlerFunc {
	// Stricter limits for login: 5 requests per minute
	limiter := NewRateLimiter(0.083, 5) // 5 per minute (5/60)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		l := limiter.getLimiter(ip)

		if !l.Allow() {
			logrus.WithFields(logrus.Fields{
				"ip":     ip,
				"path":   c.Request.URL.Path,
				"method": c.Request.Method,
			}).Warn("Login rate limit exceeded")

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many login attempts",
				"message":     "Please wait before trying again.",
				"retry_after": 60,
			})
			return
		}

		c.Next()
	}
}

// Timeout middleware adds request timeout
func Timeout(duration time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set timeout on the request context
		ctx, cancel := context.WithTimeout(c.Request.Context(), duration)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)

		// Use a channel to detect if handler completed
		finished := make(chan struct{})
		go func() {
			c.Next()
			close(finished)
		}()

		select {
		case <-finished:
			// Handler completed normally
			return
		case <-ctx.Done():
			// Timeout occurred
			c.AbortWithStatusJSON(http.StatusRequestTimeout, gin.H{
				"error":   "Request timeout",
				"message": "The request took too long to complete.",
			})
			return
		}
	}
}

// RequestSizeLimit limits request body size
func RequestSizeLimit(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)
		c.Next()
	}
}
