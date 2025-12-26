<?php

namespace App\Controllers;

use App\Config\DatabaseConnection;
use App\Services\JwtService;
use PDOException;
use Exception;

class AppController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseConnection::getInstance();
    }

    public function register(string $username, string $password, string $hwid): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT username FROM accounts WHERE username = ?", [$username]);
            if ($stmt->fetch()) {
                $result['message'] = 'Tên đăng nhập đã tồn tại';
                return $result;
            }

            $stmt = $this->db->query("SELECT username FROM accounts WHERE hwid = ?", [$hwid]);
            if ($stmt->fetch()) {
                $result['message'] = 'Không thể tạo mới';
                return $result;
            }

            $licenseExpire = time() + (3 * 24 * 60 * 60);
            $insertStmt = $this->db->query("INSERT INTO accounts (username, password, hwid, status, license_expire) VALUES (?, ?, ?, 0, ?)", [
                $username,
                $password,
                $hwid,
                $licenseExpire
            ]);

            if ($insertStmt->rowCount() > 0) {
                $result['success'] = true;
                $result['message'] = 'Đăng ký thành công';
            } else {
                $result['message'] = 'Lỗi không xác định';
            }
        } catch (PDOException $e) {
            error_log("App register PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("App register error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function verifyToken(string $token): array
    {
        $result = [
            'success' => false,
            'message' => 'Token không hợp lệ'
        ];

        try {
            $payload = JwtService::decode($token);

            if ($payload !== null) {
                $stmt = $this->db->query("SELECT id, username, hwid, status, license_expire FROM accounts WHERE username = ?", [$payload->username]);
                $user = $stmt->fetch();

                if ($user && $user['status'] == 1 && $user['hwid'] === $payload->hwid && time() <= $user['license_expire']) {
                    $result['success'] = true;
                    $result['message'] = 'Token hợp lệ';
                    $result['data'] = [
                        'username' => $user['username'],
                        'license_expire' => $user['license_expire']
                    ];
                } elseif (!$user) {
                    $result['message'] = 'Tài khoản không tồn tại';
                } elseif ($user['status'] != 1) {
                    $result['message'] = 'Tài khoản chưa được kích hoạt';
                } elseif (time() > $user['license_expire']) {
                    $result['message'] = 'License đã hết hạn';
                    $result['data'] = [
                        'username' => $user['username'],
                        'license_expire' => $user['license_expire']
                    ];
                } else {
                    $result['message'] = 'Thiết bị không hợp lệ';
                }
            }
        } catch (Exception $e) {
            // con-meo-xau
        }

        return $result;
    }

    public function login(string $username, string $password, string $hwid): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT id, username, password, hwid, status, license_expire FROM accounts WHERE username = ?", [$username]);
            $user = $stmt->fetch();

            $errorMessage = '';

            if (!$user) {
                $errorMessage = 'Không hợp lệ';
            } elseif ($user['password'] !== $password) {
                $errorMessage = 'Không hợp lệ';
            } elseif ($user['status'] == 0) {
                $errorMessage = 'Tài khoản chưa được kích hoạt';
            } elseif (time() > $user['license_expire']) {
                $errorMessage = 'License đã hết hạn';
            } elseif (!empty($user['hwid']) && $user['hwid'] !== $hwid) {
                $errorMessage = 'Không thể xác thực thiết bị';
            } else {
                if (empty($user['hwid'])) {
                    $this->db->query("UPDATE accounts SET hwid = ? WHERE id = ?", [$hwid, $user['id']]);
                }

                $token = JwtService::encode([
                    'username' => $user['username'],
                    'hwid' => $hwid
                ]);

                $result['success'] = true;
                $result['message'] = 'Đăng nhập thành công';
                $result['data'] = $token;
            }

            if ($errorMessage !== '') {
                $result['message'] = $errorMessage;
            }

            return $result;
        } catch (PDOException $e) {
            error_log("App login PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("App login error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }
}
