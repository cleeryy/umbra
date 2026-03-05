# Umbra PiVPN Manager

A secure, modern web interface for managing PiVPN configurations built with Go backend and Next.js frontend.

## 🚀 Features

- 🔐 **JWT Authentication** - Secure login system with token-based authentication
- 📱 **Mobile-First Design** - Responsive interface optimized for phones
- ⚡ **High Performance** - Fast Go backend with Gin framework
- 🎨 **Modern UI** - Clean interface built with Tailwind CSS
- 🔒 **Security First** - Proper permissions and security best practices
- 🔄 **Real-time Monitoring** - Live VPN service status updates
- 👥 **Client Management** - Create, view, and delete VPN clients
- ⚙️ **Service Control** - Restart WireGuard service
- 📦 **Dockerized** - Easy deployment with Docker Compose
- 🔄 **CI/CD Pipeline** - Automated builds and deployments

## 🏗️ Architecture

- **Backend**: Go with Gin framework
- **Frontend**: Next.js 16 with React 19
- **Authentication**: JWT tokens with bcrypt
- **Database**: File-based (PiVPN configs)
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- PiVPN installed on the host system
- WireGuard configurations in `/etc/wireguard/`

### Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/cleeryy/umbra.git
   cd umbra
   ```

2. **Copy environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Default Credentials

- **Username**: `admin`
- **Password**: `admin`

> ⚠️ Change default credentials in production!

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
go mod tidy

# Run locally
go run cmd/api/main.go
```

### Frontend Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Building for Production

```bash
# Build both services
docker-compose build

# Deploy
docker-compose up -d
```

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- Token expiration (24 hours)
- Secure password hashing with bcrypt
- Automatic token refresh

### API Security
- CORS protection
- Input validation
- Rate limiting ready
- Secure headers

### Container Security
- Non-root user execution
- Read-only volume mounts
- Minimal base images
- Security scanning

## 📊 API Documentation

### Authentication

**POST /api/login**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

### Protected Endpoints (Require Authorization Header: `Bearer <token>`)

**GET /api/status**
- Get VPN service status

**POST /api/restart**
- Restart WireGuard service

**GET /api/clients**
- List all VPN clients

**GET /api/clients/:name**
- Get client configuration

**POST /api/clients**
```json
{
  "name": "client-name"
}
```

**DELETE /api/clients/:name**
- Delete client

**GET /api/clients/:name/qr**
- Generate QR code for mobile client

**GET /api/health**
- Health check endpoint

## 🐳 Docker Deployment

### Environment Variables

**Backend (.env)**
```env
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Volume Mounts

The backend container mounts `/etc/wireguard` to access PiVPN configurations:

```yaml
volumes:
  - /etc/wireguard:/etc/wireguard:ro
```

## 🔄 CI/CD Pipeline

The project includes GitHub Actions workflows that:
- Build Docker images on push
- Push images to GitHub Container Registry
- Run security scans
- Deploy to production (manual trigger)

### Image Tags

- `ghcr.io/cleeryy/umbra-backend:latest`
- `ghcr.io/cleeryy/umbra-frontend:latest`

## 🛠️ Configuration

### Custom Authentication

To add custom users, modify the `ValidateCredentials` method in `backend/internal/auth/manager.go`:

```go
func (m *Manager) ValidateCredentials(username, password string) bool {
    // Add your custom logic here
    // Integrate with database or environment variables
    return username == "your-user" && password == "your-password"
}
```

### Client Name Validation

Client names are validated for security:
- Only letters, numbers, hyphens, and underscores
- Maximum 50 characters
- No special characters

## 🔍 Monitoring & Logging

### Backend Logging

- Structured logging with logrus
- Log levels: INFO, WARN, ERROR
- Automatic log rotation

### Health Checks

- `/api/health` endpoint
- Service status monitoring
- Automatic restart on failure

## 🚨 Troubleshooting

### Common Issues

1. **Permission denied errors**
   ```bash
   # Ensure Docker has access to WireGuard directory
   sudo chmod 755 /etc/wireguard
   ```

2. **PiVPN commands not found**
   - Verify PiVPN is installed on the host
   - The container relies on host PiVPN installation

3. **Authentication failures**
   - Check JWT_SECRET environment variable
   - Verify token expiration

4. **Service restart fails**
   - Check WireGuard service status
   - Verify systemd availability

### Logs

View container logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines

- Follow Go and React best practices
- Add tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

MIT License - see LICENSE file for details

## 🔒 Security

### Reporting Vulnerabilities

If you discover a security vulnerability, please email security@example.com

### Security Best Practices

- Use strong JWT secrets
- Change default credentials
- Regular security updates
- Network segmentation
- Backup configurations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/cleeryy/umbra/issues)
- **Documentation**: This README
- **Community**: GitHub Discussions

## 🏆 Credits

Built with:
- [Go](https://golang.org/) - Backend language
- [Gin](https://github.com/gin-gonic/gin) - HTTP framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Docker](https://docker.com/) - Containerization

---

**Umbra PiVPN Manager** - Secure VPN management made simple 🚀