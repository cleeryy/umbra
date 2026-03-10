package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

type Manager struct {
	jwtSecret     string
	adminUser     string
	adminPass     string
	adminPassHash string
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func NewManager(jwtSecret, adminUsername, adminPassword string) *Manager {
	m := &Manager{
		jwtSecret: jwtSecret,
		adminUser: adminUsername,
	}

	passHash := os.Getenv("ADMIN_PASSWORD_HASH")
	if passHash != "" {
		m.adminPassHash = passHash
		logrus.Info("Using bcrypt password hash from environment")
	} else if adminPassword != "" {
		m.adminPass = adminPassword
		hash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err == nil {
			m.adminPassHash = string(hash)
			logrus.Warn("ADMIN_PASSWORD_HASH not set. Generated hash for security.")
			logrus.Warn("Set ADMIN_PASSWORD_HASH in production for better security.")
		}
	}

	return m
}

func (m *Manager) ValidateCredentials(username, password string) bool {
	if username != m.adminUser {
		return false
	}

	if m.adminPassHash != "" {
		err := bcrypt.CompareHashAndPassword([]byte(m.adminPassHash), []byte(password))
		return err == nil
	}

	return password == m.adminPass
}

func (m *Manager) GenerateToken(username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "umbra-pivpn",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(m.jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (m *Manager) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(m.jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func (m *Manager) HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func (m *Manager) CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
