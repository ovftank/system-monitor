<?php

namespace App\Controllers;

use App\Config\DatabaseConnection;
use App\Services\JwtService;
use PDOException;
use Exception;

class AdminController
{
    private $db;

    public function __construct()
    {
        $this->db = DatabaseConnection::getInstance();
    }

    public function login(string $username, string $password): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT tk, mk FROM admin_accounts WHERE tk = ?", [$username]);
            $admin = $stmt->fetch();

            $errorMessage = '';

            if (!$admin) {
                $errorMessage = 'Không hợp lệ';
            } elseif ($admin['mk'] !== $password) {
                $errorMessage = 'Không hợp lệ';
            } else {
                $token = JwtService::encode([
                    'sub' => $admin['tk'],
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                ]);

                $result['success'] = true;
                $result['message'] = 'Đăng nhập thành công';
                $result['data'] = [
                    'token' => $token
                ];
            }

            if ($errorMessage !== '') {
                $result['message'] = $errorMessage;
            }

            return $result;
        } catch (PDOException $e) {
            error_log("Admin auth PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Admin auth error: " . $e->getMessage());
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
                $tokenUserAgent = $payload->user_agent ?? '';
                $currentUserAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

                if ($tokenUserAgent === $currentUserAgent) {
                    $result['success'] = true;
                    $result['message'] = 'Token hợp lệ';
                }
            }
        } catch (Exception $e) {
            // con-meo-xau
        }

        return $result;
    }

    public function getListUsers(): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT id, username, password, hwid, status, license_expire FROM accounts ORDER BY id DESC");
            $users = $stmt->fetchAll();

            if ($users !== false) {
                $result['success'] = true;
                $result['message'] = 'Đã load ' . count($users) . ' tài khoản';
                $result['data'] = [
                    'users' => $users,
                    'total' => count($users)
                ];
            } else {
                $result['message'] = 'Chưa có tài khoản nào';
            }
        } catch (PDOException $e) {
            error_log("Get users PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Get users error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function toggleAccountStatus(int $userId): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT status FROM accounts WHERE id = ?", [$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                $result['message'] = 'Không hợp lệ';
                return $result;
            }

            $newStatus = $user['status'] == 1 ? 0 : 1;

            $updateStmt = $this->db->query("UPDATE accounts SET status = ? WHERE id = ?", [$newStatus, $userId]);

            if ($updateStmt->rowCount() > 0) {
                $result['success'] = true;
                $result['message'] = $newStatus == 1 ? 'Đã active' : 'Đã deactive';
                $result['data'] = [
                    'user_id' => $userId,
                    'new_status' => $newStatus
                ];
            } else {
                $result['message'] = 'Lỗi không xác định';
            }
        } catch (PDOException $e) {
            error_log("Toggle account status PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Toggle account status error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function updateLicenseExpire(int $userId, int $licenseExpire): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT id FROM accounts WHERE id = ?", [$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                $result['message'] = 'Tài khoản không tồn tại';
                return $result;
            }

            $updateStmt = $this->db->query("UPDATE accounts SET license_expire = ? WHERE id = ?", [$licenseExpire, $userId]);

            if ($updateStmt->rowCount() > 0) {
                $result['success'] = true;
                $result['message'] = 'Đã cập nhật';
                $result['data'] = [
                    'user_id' => $userId,
                    'license_expire' => $licenseExpire
                ];
            } else {
                $result['message'] = 'Lỗi không xác định';
            }
        } catch (PDOException $e) {
            error_log("Update license expire PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Update license expire error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function resetHWID(int $userId): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT id FROM accounts WHERE id = ?", [$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                $result['message'] = 'Tài khoản không tồn tại';
                return $result;
            }

            $updateStmt = $this->db->query("UPDATE accounts SET hwid = NULL WHERE id = ?", [$userId]);

            if ($updateStmt->rowCount() > 0) {
                $result['success'] = true;
                $result['message'] = 'Đã reset HWID';
            } else {
                $result['message'] = 'Lỗi không xác định';
            }
        } catch (PDOException $e) {
            error_log("Reset HWID PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Reset HWID error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function deleteAccount(int $userId): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            $stmt = $this->db->query("SELECT id, username FROM accounts WHERE id = ?", [$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                $result['message'] = 'Tài khoản không tồn tại';
                return $result;
            }

            $deleteStmt = $this->db->query("DELETE FROM accounts WHERE id = ?", [$userId]);

            if ($deleteStmt->rowCount() > 0) {
                $result['success'] = true;
                $result['message'] = 'Đã xóa tài khoản ' . $user['username'];
                $result['data'] = [
                    'user_id' => $userId,
                    'username' => $user['username']
                ];
            } else {
                $result['message'] = 'Lỗi không xác định';
            }
        } catch (PDOException $e) {
            error_log("Delete account PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Delete account error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function changePassword(string $newPassword): array
    {
        $result = [
            'success' => false,
            'message' => ''
        ];

        try {
            if (empty($newPassword)) {
                $result['message'] = 'Mật khẩu không được để trống';
                return $result;
            }

            $updateStmt = $this->db->query("UPDATE admin_accounts SET mk = ? WHERE tk = ?", [$newPassword, 'admin']);

            if ($updateStmt->rowCount() > 0) {
                $result['success'] = true;
                $result['message'] = 'Đổi mật khẩu thành công';
            } else {
                $result['message'] = 'Lỗi không xác định';
            }
        } catch (PDOException $e) {
            error_log("Change password PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Change password error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function createAccount(string $username, string $password, int $licenseExpire): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            if (empty($username) || empty($password)) {
                $result['message'] = 'Username và mật khẩu không được để trống';
                return $result;
            }

            $stmt = $this->db->query("SELECT id FROM accounts WHERE username = ?", [$username]);
            $existingUser = $stmt->fetch();

            if ($existingUser) {
                $result['message'] = 'Username đã tồn tại';
                return $result;
            }

            $insertStmt = $this->db->query(
                "INSERT INTO accounts (username, password, hwid, status, license_expire) VALUES (?, ?, NULL, 1, ?)",
                [$username, $password, $licenseExpire]
            );

            if ($insertStmt->rowCount() > 0) {
                $newUserId = (int)$this->db->query("SELECT LAST_INSERT_ID() as id")->fetch()['id'];
                $result['success'] = true;
                $result['message'] = 'Đã tạo tài khoản thành công';
                $result['data'] = [
                    'user_id' => $newUserId,
                    'username' => $username
                ];
            } else {
                $result['message'] = 'Lỗi không xác định';
            }
        } catch (PDOException $e) {
            error_log("Create account PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Create account error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }

    public function updateAccount(int $userId, string $username, string $password): array
    {
        $result = [
            'success' => false,
            'message' => '',
            'data' => null
        ];

        try {
            if (empty($username) || empty($password)) {
                $result['message'] = 'Username và mật khẩu không được để trống';
            } else {
                $stmt = $this->db->query("SELECT id FROM accounts WHERE id = ?", [$userId]);
                $user = $stmt->fetch();

                if (!$user) {
                    $result['message'] = 'Tài khoản không tồn tại';
                } else {
                    $checkStmt = $this->db->query("SELECT id FROM accounts WHERE username = ? AND id != ?", [$username, $userId]);
                    $existingUser = $checkStmt->fetch();

                    if ($existingUser) {
                        $result['message'] = 'Username đã tồn tại';
                    } else {
                        $updateStmt = $this->db->query(
                            "UPDATE accounts SET username = ?, password = ? WHERE id = ?",
                            [$username, $password, $userId]
                        );

                        if ($updateStmt->rowCount() > 0) {
                            $result['success'] = true;
                            $result['message'] = 'Đã cập nhật tài khoản';
                            $result['data'] = [
                                'user_id' => $userId,
                                'username' => $username
                            ];
                        } else {
                            $result['message'] = 'Lỗi không xác định';
                        }
                    }
                }
            }
        } catch (PDOException $e) {
            error_log("Update account PDO error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        } catch (Exception $e) {
            error_log("Update account error: " . $e->getMessage());
            $result['message'] = 'Lỗi không xác định';
        }

        return $result;
    }
}
