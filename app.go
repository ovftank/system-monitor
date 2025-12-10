package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/StackExchange/wmi"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Sensor struct {
	Name       string  `json:"name"`
	SensorType string  `json:"sensorType"`
	Value      float64 `json:"value"`
	Unit       string  `json:"unit"`
}

type Hardware struct {
	Name         string   `json:"name"`
	HardwareType string   `json:"hardwareType"`
	Sensors      []Sensor `json:"sensors"`
}

type ClientData struct {
	HostName string     `json:"hostName"`
	LocalIP  string     `json:"localIP"`
	Hardware []Hardware `json:"hardware"`
}

type Client struct {
	ClientId string     `json:"clientId"`
	Data     ClientData `json:"data"`
}

type MonitorResponse struct {
	TotalClients int      `json:"totalClients"`
	Clients      []Client `json:"clients"`
}

type Config struct {
	ServerIP string
	DelayMs  int
}

type AuthResponse struct {
	Status    string `json:"status"`
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
	Message   string `json:"message"`
}

type RegisterResponse struct {
	Status    string `json:"status"`
	Message   string `json:"message"`
	AccountID int    `json:"account_id"`
	Username  string `json:"username"`
}

type CheckTokenResponse struct {
	Status        string `json:"status"`
	AccountStatus int    `json:"account_status"`
	LicenseExpire int64  `json:"license_expire"`
	Message       string `json:"message"`
}

type App struct {
	ctx      context.Context
	config   *Config
	client   *http.Client
	tickStop chan struct{}
}

func NewApp() *App {
	return &App{
		config: LoadConfig(),
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.tickStop = make(chan struct{})
	go a.startMonitorTicker()
}

func (a *App) Shutdown(ctx context.Context) {
	close(a.tickStop)
}

func (a *App) startMonitorTicker() {
	currentDelay := time.Duration(a.config.DelayMs) * time.Millisecond
	ticker := time.NewTicker(currentDelay)
	defer ticker.Stop()

	for {
		select {
		case <-a.tickStop:
			return
		case <-ticker.C:
			newDelay := time.Duration(a.config.DelayMs) * time.Millisecond
			if newDelay != currentDelay {
				ticker.Stop()
				ticker = time.NewTicker(newDelay)
				currentDelay = newDelay
			}
			runtime.EventsEmit(a.ctx, "monitorUpdate")
		}
	}
}

func LoadConfig() *Config {
	configPath := filepath.Join(getAppDir(), "config.ini")
	config := &Config{
		ServerIP: "127.0.0.1",
		DelayMs:  1000,
	}

	if _, err := os.Stat(configPath); err != nil {
		SaveConfig(config)
		return config
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return config
	}

	lines := strings.Split(string(data), "\n")
	validLines := []string{}
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "#") && !strings.HasPrefix(line, ";") {
			validLines = append(validLines, line)
		}
	}

	if len(validLines) > 0 {
		config.ServerIP = validLines[0]
	}
	if len(validLines) > 1 {
		if delay, err := strconv.Atoi(validLines[1]); err == nil && delay > 0 {
			config.DelayMs = delay
		}
	}

	return config
}

func SaveConfig(config *Config) error {
	configPath := filepath.Join(getAppDir(), "config.ini")
	content := fmt.Sprintf("# System Monitor Config\n# Server IP\n%s\n# Refresh delay (ms)\n%d\n",
		config.ServerIP, config.DelayMs)
	return os.WriteFile(configPath, []byte(content), 0644)
}

func (a *App) GetConfig() *Config {
	return a.config
}

func (a *App) UpdateConfig(serverIP string, delayMs int) {
	if delayMs < 100 {
		delayMs = 100
	}
	a.config.ServerIP = serverIP
	a.config.DelayMs = delayMs
	SaveConfig(a.config)
}

func (a *App) GetMonitorData() *MonitorResponse {
	url := fmt.Sprintf("http://%s:6886/api/monitor", a.config.ServerIP)
	resp, err := a.client.Get(url)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var data MonitorResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return nil
	}

	return &data
}

func (a *App) GetRefreshDelay() int {
	return a.config.DelayMs
}

func getAppDir() string {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "."
	}
	appDir := filepath.Join(dir, "SystemMonitorView")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return "."
	}
	return appDir
}

type Win32_ComputerSystemProduct struct {
	UUID string
}

func (a *App) GetHWID() string {
	var dst []Win32_ComputerSystemProduct
	if err := wmi.Query("SELECT UUID FROM Win32_ComputerSystemProduct", &dst); err != nil {
		return ""
	}
	if len(dst) == 0 {
		return ""
	}
	return dst[0].UUID
}

func (a *App) Register(username, password string) *RegisterResponse {
	hwid := a.GetHWID()

	payload := map[string]string{
		"username": username,
		"password": password,
		"hwid":     hwid,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil
	}

	resp, err := a.client.Post(
		"https://tool.superpc.vn/api/auth/register",
		"application/json",
		strings.NewReader(string(body)),
	)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var regResp RegisterResponse
	if err := json.Unmarshal(respBody, &regResp); err != nil {
		return nil
	}

	return &regResp
}

func (a *App) Login(username, password string) *AuthResponse {
	hwid := a.GetHWID()

	payload := map[string]string{
		"username": username,
		"password": password,
		"hwid":     hwid,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil
	}

	resp, err := a.client.Post(
		"https://tool.superpc.vn/api/auth/login",
		"application/json",
		strings.NewReader(string(body)),
	)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var authResp AuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		return nil
	}

	if authResp.Token == "" {
		return nil
	}

	return &authResp
}

func (a *App) CheckToken(token string) *CheckTokenResponse {
	if token == "" {
		return nil
	}

	payload := map[string]string{
		"token": token,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil
	}

	req, err := http.NewRequest("POST", "https://tool.superpc.vn/api/auth/status", strings.NewReader(string(body)))
	if err != nil {
		return nil
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	var checkResp CheckTokenResponse
	if err := json.Unmarshal(respBody, &checkResp); err != nil {
		return nil
	}

	if checkResp.Status != "success" || checkResp.AccountStatus != 1 {
		return nil
	}

	return &checkResp
}
