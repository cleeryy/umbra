# 🌑 Umbra PiVPN Manager

> A modern, secure web interface for managing PiVPN configurations with Go backend and Next.js frontend.

[![CI](https://github.com/cleeryy/umbra/actions/workflows/ci.yml/badge.svg)](https://github.com/cleeryy/umbra/actions/workflows/ci.yml)
[![Docker](https://github.com/cleeryy/umbra/actions/workflows/docker.yml/badge.svg)](https://github.com/cleeryy/umbra/actions/workflows/docker.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

### 🔐 Security
- **JWT Authentication** with secure token management
- **bcrypt Password Hashing** for credential storage
- **Rate Limiting** on API endpoints
- **CORS Protection** with configurable origins
- **Request Size Limits** to prevent DoS attacks
- **Input Validation** on all user inputs
- **Graceful Shutdown** handling

### 🎨 User Experience
- **Mobile-first Responsive Design** - Perfect for phone management
- **Real-time Status Updates** - Live VPN service status with auto-refresh
- **Loading States** - Clear feedback during async operations
- **Error Boundaries** - Graceful error handling
- **Smooth Animations** - Polished UI transitions
- **Dark Mode Support** - Automatic theme switching

### 🏗️ Architecture
- **Go Backend** (v1.23) with Gin framework
- **Next.js 14 Frontend** with App Router
- **Dockerized Deployment** with multi-stage builds
- **GitHub Actions CI/CD** with security scanning
- **Structured Logging** with logrus
- **Health Checks** for container orchestration

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- PiVPN installed on the host
- WireGuard configurations in `/etc/wireguard/`

### Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/cleeryy/umbra.git
cd umbra

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your settings (see Configuration section)

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/health

## 🔧 Configuration

### Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

```env
# Server
PORT=8080
LOG_LEVEL=info

# Security - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
# OR use bcrypt hash: ADMIN_PASSWORD_HASH=$2y$10$...

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Rate Limiting (requests:burst)
RATE_LIMIT=10:20

# Request Timeout (seconds)
REQUEST_TIMEOUT=30

# PiVPN
WIREGUARD_CONFIG_PATH=/etc/wireguard
WIREGUARD_INTERFACE=wg0

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Generate Secure JWT Secret

```bash
make generate-jwt-secret
# OR
openssl rand -base64 32
```

### Generate Password Hash

```bash
make generate-password-hash
# OR
htpasswd -nbB admin yourpassword | cut -d: -f2
```

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Run in development mode
go run cmd/api/main.go

# Run tests
go test -v ./...

# Build binary
make build-backend
```

### Frontend Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

### Makefile Commands

```bash
make dev          # Start both services in development
make build        # Build both services
make test         # Run all tests
make lint         # Run all linters
make docker-up    # Start with Docker Compose
make docker-down  # Stop Docker services
ci                # Run full CI pipeline locally
```

## 📚 API Documentation

### Authentication

```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Login successful"
}
```

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |
| POST | `/api/login` | User login | No |
| GET | `/api/status` | VPN service status | Yes |
| POST | `/api/restart` | Restart WireGuard service | Yes |
| GET | `/api/clients` | List all clients | Yes |
| GET | `/api/clients/:name` | Get client config | Yes |
| POST | `/api/clients` | Create new client | Yes |
| DELETE | `/api/clients/:name` | Delete client | Yes |
| GET | `/api/clients/:name/qr` | Get client QR code | Yes |

## 🔒 Security Considerations

- **Never commit** the `.env` file or any secrets
- Change default credentials before deploying to production
- Use a strong, randomly generated JWT secret
- Configure CORS origins to match your domain
- Enable HTTPS in production
- The backend container requires `NET_ADMIN` capability for WireGuard management
- WireGuard directory is mounted read-only for security

## 🧪 Testing

### Backend Tests

```bash
cd backend
go test -v ./...
go test -race -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Frontend Tests

```bash
npm test
npm test -- --coverage
```

### Security Scanning

```bash
# Go security scanner
cd backend && gosec ./...

# Docker vulnerability scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD:/tmp/.cache/ aquasec/trivy image umbra-backend:latest
```

## 📦 Deployment

### Docker Images

Images are automatically built and pushed to GitHub Container Registry:

```bash
docker pull ghcr.io/cleeryy/umbra-backend:latest
docker pull ghcr.io/cleeryy/umbra-frontend:latest
```

### Kubernetes (coming soon)

Helm charts will be provided for Kubernetes deployment.

## 📊 Monitoring

### Health Endpoints

- **Backend**: `GET /api/health`
- **Docker**: Built-in health checks

### Logs

Structured JSON logging is enabled. View logs:

```bash
# Docker Compose
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes
kubectl logs -f deployment/umbra-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure:
- Tests pass (`make test`)
- Linting passes (`make lint`)
- Security scans pass
- Documentation is updated

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PiVPN](https://pivpn.io/) - The WireGuard/OpenVPN installer
- [Gin](https://gin-gonic.com/) - Go web framework
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

- **Documentation**: [docs.umbra.dev](https://docs.umbra.dev) (coming soon)
- **Issues**: [GitHub Issues](https://github.com/cleeryy/umbra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cleeryy/umbra/discussions)

---

**Built with ❤️ for the PiVPN community**
