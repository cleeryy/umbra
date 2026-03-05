# PiVPN Web Manager

A modern web interface for managing PiVPN configurations built with Go backend and Next.js frontend using Shadcn UI.

## Features

- 📱 **Mobile-first responsive design** - Perfect for phone management
- ⚡ **Fast Go backend** - High-performance API server
- 🎨 **Modern UI** - Built with Next.js and Shadcn UI components
- 🔒 **Real PiVPN integration** - Works with existing PiVPN installations
- 📊 **Real-time status monitoring** - Live VPN service status
- 👥 **Client management** - Create, view, and delete VPN clients
- ⚙️ **Service control** - Restart WireGuard service

## Architecture

- **Backend**: Go with Gin framework
- **Frontend**: Next.js 14 with Shadcn UI
- **Containerized**: Docker Compose for easy deployment
- **Mobile-friendly**: Responsive design optimized for phones

## Quick Start

### Prerequisites

- Docker and Docker Compose
- PiVPN installed on the host
- WireGuard configurations in `/etc/wireguard/`

### Deployment

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd pivpn-web-manager
   ```

2. **Build and deploy**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## API Endpoints

### Status Management
- `GET /api/status` - Get VPN service status
- `POST /api/restart` - Restart WireGuard service

### Client Management
- `GET /api/clients` - List all VPN clients
- `GET /api/clients/:name` - Get client configuration
- `POST /api/clients` - Create new client
- `DELETE /api/clients/:name` - Delete client
- `GET /api/clients/:name/qr` - Get QR code for mobile client

## Development

### Backend Development

```bash
cd /path/to/project

# Install dependencies
go mod tidy

# Run locally
go run cmd/api/main.go
```

### Frontend Development

```bash
cd frontend

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

## Configuration

### Environment Variables

**Backend (.env)**
```
PORT=8080
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Volume Mounts

The backend container mounts `/etc/wireguard` to access PiVPN configurations:

```yaml
volumes:
  - /etc/wireguard:/etc/wireguard:ro
```

## Security Considerations

- The backend runs with `NET_ADMIN` capabilities for WireGuard management
- WireGuard directory is mounted read-only
- Non-root user execution in containers
- CORS configured for frontend-backend communication

## Mobile Usage

The interface is specifically designed for mobile use:

- Touch-friendly buttons and controls
- Responsive layout adapts to phone screens
- Large text and clear visual hierarchy
- Quick actions for common operations

## Troubleshooting

### Common Issues

1. **Permission denied errors**
   - Ensure Docker has access to `/etc/wireguard`
   - Check file permissions on WireGuard configurations

2. **PiVPN commands not found**
   - Verify PiVPN is installed on the host
   - The container relies on host PiVPN installation

3. **Service restart fails**
   - Check if WireGuard service is running
   - Verify systemd is available in container

### Logs

View container logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub