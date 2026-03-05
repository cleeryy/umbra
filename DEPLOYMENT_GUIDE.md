# 🚀 Umbra PiVPN Manager - Deployment Guide

## ✅ Migration Complete!

Your PiVPN web manager has been successfully migrated to your repository with enhanced security, CI/CD, and modern architecture.

## 🎯 What's Been Added

### 🔐 Security Features
- **JWT Authentication** with token-based login
- **Secure password hashing** using bcrypt
- **Protected API endpoints** with middleware
- **CORS protection** and input validation
- **Non-root container execution**

### 🏗️ Architecture
- **Go Backend** with Gin framework
- **Next.js Frontend** with React 18
- **Dockerized** deployment
- **GitHub Actions CI/CD** pipeline

### 📱 User Interface
- **Mobile-first responsive design**
- **Modern UI** with Tailwind CSS
- **Real-time status updates**
- **Intuitive client management**

## 🚀 Quick Deployment

### Option 1: Docker Compose (Recommended)
```bash
git clone https://github.com/cleeryy/umbra.git
cd umbra
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

### Option 2: Manual Development
```bash
# Backend
cd backend
go mod tidy
go run cmd/api/main.go

# Frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Default Credentials
- **Username**: `admin`
- **Password**: `admin`

> ⚠️ Change these credentials in production!

## 📊 Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## 🔄 CI/CD Pipeline

The GitHub Actions workflow will:
- Build Docker images automatically
- Push to GitHub Container Registry
- Run security scans
- Ready for production deployment

### Docker Image URLs
- `ghcr.io/cleeryy/umbra-backend:latest`
- `ghcr.io/cleeryy/umbra-frontend:latest`

## 🎉 Next Steps

1. **Test the deployment** - Access the UI and verify functionality
2. **Configure security** - Change default credentials and JWT secret
3. **Set up monitoring** - Add logging and health checks
4. **Deploy to production** - Use the CI/CD pipeline

## 📞 Support

- **Documentation**: Check README.md for comprehensive guides
- **Issues**: Use GitHub Issues for bug reports
- **Security**: Report vulnerabilities via email

---

**Your PiVPN web manager is now enterprise-ready!** 🚀

Built with security, performance, and mobile-first design in mind.