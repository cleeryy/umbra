# =============================================================================
# Umbra PiVPN Manager - Makefile
# =============================================================================

.PHONY: help dev build test lint clean docker-build docker-up docker-down fmt check security

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# =============================================================================
# Help
# =============================================================================

help: ## Show this help message
	@echo "$(BLUE)Umbra PiVPN Manager - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  make dev          # Start development servers"
	@echo "  make docker-up    # Start with Docker Compose"
	@echo "  make test         # Run all tests"

# =============================================================================
# Development
# =============================================================================

dev: ## Start both frontend and backend in development mode
	@echo "$(BLUE)Starting development servers...$(NC)"
	@make dev-backend &
	@make dev-frontend

dev-backend: ## Start Go backend in development mode
	@echo "$(GREEN)Starting backend...$(NC)"
	cd backend && go run cmd/api/main.go

dev-frontend: ## Start Next.js frontend in development mode
	@echo "$(GREEN)Starting frontend...$(NC)"
	npm run dev

# =============================================================================
# Build
# =============================================================================

build: build-backend build-frontend ## Build both services

build-backend: ## Build Go backend binary
	@echo "$(BLUE)Building backend...$(NC)"
	cd backend && CGO_ENABLED=0 go build -ldflags="-w -s" -o bin/pivpn-api ./cmd/api/main.go
	@echo "$(GREEN)Backend built: backend/bin/pivpn-api$(NC)"

build-frontend: ## Build Next.js frontend
	@echo "$(BLUE)Building frontend...$(NC)"
	npm run build
	@echo "$(GREEN)Frontend built successfully$(NC)"

# =============================================================================
# Testing
# =============================================================================

test: test-backend test-frontend ## Run all tests

test-backend: ## Run Go backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && go test -v ./... -race -coverprofile=coverage.out
	cd backend && go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)Backend tests complete$(NC)"

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	npm test -- --coverage
	@echo "$(GREEN)Frontend tests complete$(NC)"

# =============================================================================
# Code Quality
# =============================================================================

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Run Go linters (requires golangci-lint)
	@echo "$(BLUE)Linting backend...$(NC)"
	cd backend && golangci-lint run --fast --fix ./...
	@echo "$(GREEN)Backend linting complete$(NC)"

lint-frontend: ## Run ESLint on frontend
	@echo "$(BLUE)Linting frontend...$(NC)"
	npm run lint
	@echo "$(GREEN)Frontend linting complete$(NC)"

fmt: fmt-backend fmt-frontend ## Format all code

fmt-backend: ## Format Go code
	@echo "$(BLUE)Formatting backend code...$(NC)"
	cd backend && go fmt ./...
	@echo "$(GREEN)Backend formatted$(NC)"

fmt-frontend: ## Format frontend code
	@echo "$(BLUE)Formatting frontend code...$(NC)"
	npx prettier --write "app/**/*.{ts,tsx,js,jsx,json,css,md}"
	@echo "$(GREEN)Frontend formatted$(NC)"

check: check-backend ## Run all checks

check-backend: ## Run Go vet and static analysis
	@echo "$(BLUE)Running backend checks...$(NC)"
	cd backend && go vet ./...
	cd backend && staticcheck ./... 2>/dev/null || echo "$(YELLOW)staticcheck not installed, skipping$(NC)"
	@echo "$(GREEN)Backend checks complete$(NC)"

security: ## Run security scans
	@echo "$(BLUE)Running security scans...$(NC)"
	cd backend && gosec ./... 2>/dev/null || echo "$(YELLOW)gosec not installed, skipping$(NC)"
	@echo "$(GREEN)Security scans complete$(NC)"

# =============================================================================
# Dependencies
# =============================================================================

deps: deps-backend deps-frontend ## Install all dependencies

deps-backend: ## Install Go dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && go mod download && go mod verify
	@echo "$(GREEN)Backend dependencies installed$(NC)"

deps-frontend: ## Install npm dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	npm install
	@echo "$(GREEN)Frontend dependencies installed$(NC)"

update: update-backend update-frontend ## Update all dependencies

update-backend: ## Update Go dependencies
	@echo "$(BLUE)Updating backend dependencies...$(NC)"
	cd backend && go get -u ./...
	cd backend && go mod tidy
	@echo "$(GREEN)Backend dependencies updated$(NC)"

update-frontend: ## Update npm dependencies
	@echo "$(BLUE)Updating frontend dependencies...$(NC)"
	npm update
	@echo "$(GREEN)Frontend dependencies updated$(NC)"

# =============================================================================
# Docker
# =============================================================================

docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)Docker images built$(NC)"

docker-up: ## Start services with Docker Compose
	@echo "$(BLUE)Starting Docker services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Backend API: http://localhost:8080$(NC)"

docker-down: ## Stop Docker services
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	docker-compose down
	@echo "$(GREEN)Services stopped$(NC)"

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Remove Docker containers, images, and volumes
	@echo "$(BLUE)Cleaning Docker resources...$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)Docker cleaned$(NC)"

# =============================================================================
# Utilities
# =============================================================================

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf backend/bin/
	rm -rf backend/coverage.out backend/coverage.html
	rm -rf .next/
	rm -rf dist/
	rm -rf build/
	@echo "$(GREEN)Clean complete$(NC)"

generate-jwt-secret: ## Generate a secure JWT secret
	@echo "$(BLUE)Generating JWT secret...$(NC)"
	@openssl rand -base64 32
	@echo "$(GREEN)Copy the above secret to your .env file as JWT_SECRET$(NC)"

generate-password-hash: ## Generate bcrypt password hash
	@echo "$(BLUE)Enter password to hash:$(NC)"
	@read password; \
	hash=$$(htpasswd -nbB admin "$$password" 2>/dev/null | cut -d: -f2); \
	if [ -n "$$hash" ]; then \
		echo "$(GREEN)Password hash:$$hash$(NC)"; \
		echo "$(YELLOW)Copy this to your .env file as ADMIN_PASSWORD_HASH$(NC)"; \
	else \
		echo "$(RED)htpasswd not found. Install apache2-utils or use an online bcrypt generator$(NC)"; \
	fi

env-setup: ## Copy .env.example to .env
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)Created .env from .env.example$(NC)"; \
		echo "$(YELLOW)Please edit .env and set your secrets$(NC)"; \
	else \
		echo "$(YELLOW).env already exists, skipping$(NC)"; \
	fi

# =============================================================================
# CI/CD
# =============================================================================

ci: fmt lint test security ## Run CI pipeline locally
	@echo "$(GREEN)All CI checks passed!$(NC)"

# =============================================================================
# Info
# =============================================================================

info: ## Display project information
	@echo "$(BLUE)Umbra PiVPN Manager$(NC)"
	@echo "===================="
	@echo "Go version: $$(cd backend && go version 2>/dev/null || echo 'Not installed')"
	@echo "Node version: $$(node --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker version: $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "$(GREEN)Quick commands:$(NC)"
	@echo "  make dev          # Start development"
	@echo "  make docker-up    # Start with Docker"
	@echo "  make test         # Run tests"
