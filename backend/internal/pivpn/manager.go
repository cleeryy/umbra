package pivpn

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/sirupsen/logrus"
)

type Manager struct {
	configPath string
}

type Client struct {
	Name       string `json:"name"`
	ConfigFile string `json:"config_file"`
	Status     string `json:"status,omitempty"`
	CreatedAt  string `json:"created_at,omitempty"`
}

type Status struct {
	VPNStatus string `json:"vpn_status"`
	Details   string `json:"details"`
	Clients   int    `json:"clients_count"`
}

func NewManager(configPath string) *Manager {
	return &Manager{
		configPath: configPath,
	}
}

func (m *Manager) GetStatus() (*Status, error) {
	cmd := exec.Command("systemctl", "status", "wg-quick@wg0")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return &Status{
			VPNStatus: "stopped",
			Details:   string(output),
		}, nil
	}

	status := "stopped"
	if strings.Contains(string(output), "active (running)") {
		status = "running"
	}

	// Get client count
	clients, _ := m.ListClients()

	return &Status{
		VPNStatus: status,
		Details:   string(output),
		Clients:   len(clients),
	}, nil
}

func (m *Manager) RestartService() error {
	cmd := exec.Command("systemctl", "restart", "wg-quick@wg0")
	output, err := cmd.CombinedOutput()
	if err != nil {
		logrus.Errorf("Failed to restart service: %v, output: %s", err, output)
		return fmt.Errorf("failed to restart service: %v", err)
	}
	return nil
}

func (m *Manager) ListClients() ([]Client, error) {
	clients := []Client{}

	files, err := os.ReadDir(m.configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config directory: %v", err)
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		name := file.Name()
		if strings.HasSuffix(name, ".conf") && name != "wg0.conf" {
			clientName := strings.TrimSuffix(name, ".conf")

			// Get file info for creation time
			info, _ := file.Info()
			createdAt := ""
			if info != nil {
				createdAt = info.ModTime().Format("2006-01-02 15:04:05")
			}

			clients = append(clients, Client{
				Name:       clientName,
				ConfigFile: name,
				CreatedAt:  createdAt,
			})
		}
	}

	return clients, nil
}

func (m *Manager) GetClientConfig(name string) (string, error) {
	configPath := filepath.Join(m.configPath, name+".conf")
	content, err := os.ReadFile(configPath)
	if err != nil {
		return "", fmt.Errorf("client config not found: %v", err)
	}

	return string(content), nil
}

func (m *Manager) CreateClient(name string) error {
	// Validate client name
	if !isValidClientName(name) {
		return fmt.Errorf("invalid client name: must contain only letters, numbers, and hyphens")
	}

	// Check if client already exists
	configPath := filepath.Join(m.configPath, name+".conf")
	if _, err := os.Stat(configPath); err == nil {
		return fmt.Errorf("client %s already exists", name)
	}

	// Use pivpn command to create client
	cmd := exec.Command("pivpn", "-a", "-n", name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		logrus.Errorf("Failed to create client: %v, output: %s", err, output)
		return fmt.Errorf("failed to create client: %v", err)
	}

	logrus.Infof("Created client %s", name)
	return nil
}

func (m *Manager) DeleteClient(name string) error {
	// Use pivpn command to remove client
	cmd := exec.Command("pivpn", "-r", "-n", name)
	output, err := cmd.CombinedOutput()
	if err != nil {
		logrus.Errorf("Failed to delete client: %v, output: %s", err, output)
		return fmt.Errorf("failed to delete client: %v", err)
	}

	logrus.Infof("Deleted client %s", name)
	return nil
}

func (m *Manager) GenerateQRCode(name string) (string, error) {
	configPath := filepath.Join(m.configPath, name+".conf")
	content, err := os.ReadFile(configPath)
	if err != nil {
		return "", fmt.Errorf("client config not found: %v", err)
	}

	// For now, return the config content
	// In production, integrate with a QR code generation library
	return string(content), nil
}

// isValidClientName validates client names
func isValidClientName(name string) bool {
	if len(name) == 0 || len(name) > 50 {
		return false
	}

	// Allow letters, numbers, hyphens, and underscores
	for _, char := range name {
		if !((char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '-' || char == '_') {
			return false
		}
	}

	return true
}
