package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/StackExchange/wmi"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed wails.json
var wailsJSON string

type Sensor struct {
	Name       string  `json:"Name"`
	SensorType string  `json:"SensorType"`
	Value      float64 `json:"Value"`
	Unit       string  `json:"Unit"`
}

type Hardware struct {
	Name         string   `json:"Name"`
	HardwareType string   `json:"HardwareType"`
	Sensors      []Sensor `json:"Sensors"`
}

type ClientData struct {
	HostName  string     `json:"HostName"`
	LocalIP   string     `json:"LocalIP"`
	Timestamp int64      `json:"Timestamp"`
	Hardware  []Hardware `json:"Hardware"`
}

type Client struct {
	ClientId string     `json:"ClientId"`
	Data     ClientData `json:"Data"`
}

type MonitorResponse struct {
	TotalClients int      `json:"TotalClients"`
	Clients      []Client `json:"Clients"`
}

type Config struct {
	ServerIP string
	DelayMs  int
}

type AuthResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    string `json:"data,omitempty"`
}

type RegisterResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

type CheckTokenResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

type WailsConfig struct {
	Info struct {
		CompanyName    string `json:"companyName"`
		ProductName    string `json:"productName"`
		ProductVersion string `json:"productVersion"`
		Copyright      string `json:"copyright"`
		Comments       string `json:"comments"`
	} `json:"info"`
}

type AppInfo struct {
	CompanyName    string `json:"companyName"`
	ProductName    string `json:"productName"`
	ProductVersion string `json:"productVersion"`
	Copyright      string `json:"copyright"`
	Comments       string `json:"comments"`
}

type UpdateCheckResult struct {
	HasUpdate  bool   `json:"hasUpdate"`
	NewVersion string `json:"newVersion"`
	Error      string `json:"error,omitempty"`
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
		client: &http.Client{Timeout: 30 * time.Second},
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
		return &RegisterResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	resp, err := a.client.Post(
		"https://tool.superpc.vn/api/app/register",
		"application/json",
		strings.NewReader(string(body)),
	)
	if err != nil {
		return &RegisterResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return &RegisterResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	var regResp RegisterResponse
	if err := json.Unmarshal(respBody, &regResp); err != nil {
		return &RegisterResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
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
		return &AuthResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	resp, err := a.client.Post(
		"https://tool.superpc.vn/api/app/login",
		"application/json",
		strings.NewReader(string(body)),
	)
	if err != nil {
		return &AuthResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return &AuthResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	var authResp AuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		return &AuthResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	return &authResp
}

func (a *App) CheckToken(token string) *CheckTokenResponse {
	if token == "" {
		return &CheckTokenResponse{
			Success: false,
			Message: "Token không hợp lệ",
		}
	}

	payload := map[string]string{
		"token": token,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return &CheckTokenResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	req, err := http.NewRequest("POST", "https://tool.superpc.vn/api/app/verify-token", strings.NewReader(string(body)))
	if err != nil {
		return &CheckTokenResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.client.Do(req)
	if err != nil {
		return &CheckTokenResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return &CheckTokenResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	var checkResp CheckTokenResponse
	if err := json.Unmarshal(respBody, &checkResp); err != nil {
		return &CheckTokenResponse{
			Success: false,
			Message: "Lỗi không xác định",
		}
	}

	return &checkResp
}

func (a *App) OpenBrowser(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}

func (a *App) GetAppVersion() string {
	var config WailsConfig
	if err := json.Unmarshal([]byte(wailsJSON), &config); err != nil {
		return ""
	}
	return config.Info.ProductVersion
}

func (a *App) GetAppInfo() *AppInfo {
	var config WailsConfig
	if err := json.Unmarshal([]byte(wailsJSON), &config); err != nil {
		return nil
	}
	return &AppInfo{
		CompanyName:    config.Info.CompanyName,
		ProductName:    config.Info.ProductName,
		ProductVersion: config.Info.ProductVersion,
		Copyright:      config.Info.Copyright,
		Comments:       config.Info.Comments,
	}
}

const (
	remoteConfigURL = "https://raw.githubusercontent.com/ovftank/system-monitor/refs/heads/view/wails.json"
	downloadURL     = "https://github.com/ovftank/system-monitor/releases/download/v%s/system-monitor-amd64-installer.exe"
)

func (a *App) CheckForUpdates() *UpdateCheckResult {
	currentVersion := a.GetAppVersion()

	resp, err := http.Get(remoteConfigURL)
	if err != nil {
		return &UpdateCheckResult{
			HasUpdate:  false,
			NewVersion: currentVersion,
			Error:      fmt.Sprintf("failed to fetch remote config: %v", err),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &UpdateCheckResult{
			HasUpdate:  false,
			NewVersion: currentVersion,
			Error:      fmt.Sprintf("remote config returned status: %d", resp.StatusCode),
		}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return &UpdateCheckResult{
			HasUpdate:  false,
			NewVersion: currentVersion,
			Error:      fmt.Sprintf("failed to read remote config: %v", err),
		}
	}

	var remoteConfig WailsConfig
	if err := json.Unmarshal(body, &remoteConfig); err != nil {
		return &UpdateCheckResult{
			HasUpdate:  false,
			NewVersion: currentVersion,
			Error:      fmt.Sprintf("failed to parse remote config: %v", err),
		}
	}

	if remoteConfig.Info.ProductVersion != currentVersion {
		return &UpdateCheckResult{
			HasUpdate:  true,
			NewVersion: remoteConfig.Info.ProductVersion,
		}
	}

	return &UpdateCheckResult{
		HasUpdate:  false,
		NewVersion: currentVersion,
	}
}

func (a *App) DownloadUpdate(version string) (string, error) {
	url := fmt.Sprintf(downloadURL, version)

	tempDir := os.TempDir()
	setupPath := filepath.Join(tempDir, fmt.Sprintf("system-monitor-update-%s.exe", version))

	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to download update: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download failed with status: %d", resp.StatusCode)
	}

	file, err := os.Create(setupPath)
	if err != nil {
		return "", fmt.Errorf("failed to create update file: %v", err)
	}
	defer file.Close()

	_, err = io.Copy(file, resp.Body)
	if err != nil {
		os.Remove(setupPath)
		return "", fmt.Errorf("failed to save update file: %v", err)
	}

	return setupPath, nil
}

func (a *App) InstallUpdate(setupPath string) error {
	batchPath := filepath.Join(os.TempDir(), "system-monitor-update.bat")

	batchContent := fmt.Sprintf(`@echo off
timeout /t 2 /nobreak >nul
start "" /wait "%s" /S
del "%s"
del "%%~f0"
`, setupPath, batchPath)

	if err := os.WriteFile(batchPath, []byte(batchContent), 0644); err != nil {
		return fmt.Errorf("failed to create update script: %v", err)
	}

	cmd := exec.Command("cmd", "/c", batchPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start update script: %v", err)
	}

	runtime.Quit(a.ctx)

	return nil
}
