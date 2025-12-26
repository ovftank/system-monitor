<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Controllers\AdminController;
use App\Controllers\AppController;
use App\Config\ApiResponse;

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];

$path = str_replace('/api', '', $path);
$path = trim($path, '/');

$segments = explode('/', $path);

function verifyAdminJwtToken(AdminController $adminAuth)
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        ApiResponse::error('Token không hợp lệ', 401);
        exit;
    }

    $token = $matches[1];
    $verifyResult = $adminAuth->verifyToken($token);

    if (!$verifyResult['success']) {
        ApiResponse::error('Token không hợp lệ', 401);
        exit;
    }

    return $token;
}

try {
    if (empty($segments[0])) {
        ApiResponse::error('Invalid endpoint', 404);
        exit;
    }

    if ($segments[0] === 'admin') {
        if (count($segments) < 2) {
            ApiResponse::error('Không hợp lệ', 404);
            exit;
        }

        $action = $segments[1];
        $adminAuth = new AdminController();

        if ($action === 'login') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['username']) || !isset($input['password'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->login($input['username'], $input['password']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'verify-token') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            $token = verifyAdminJwtToken($adminAuth);
            ApiResponse::success('Token hợp lệ');
        } elseif ($action === 'get-list-users') {
            if ($method !== 'GET') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);
            $result = $adminAuth->getListUsers();

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'toggle-account-status') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['user_id']) || !is_numeric($input['user_id'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->toggleAccountStatus((int)$input['user_id']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'update-license-expire') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['user_id']) || !is_numeric($input['user_id'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            if (!isset($input['license_expire']) || !is_numeric($input['license_expire'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->updateLicenseExpire((int)$input['user_id'], (int)$input['license_expire']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'reset-hwid') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['user_id']) || !is_numeric($input['user_id'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->resetHWID((int)$input['user_id']);

            if ($result['success']) {
                ApiResponse::success($result['message']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'delete-account') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['user_id']) || !is_numeric($input['user_id'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->deleteAccount((int)$input['user_id']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'change-password') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['new_password'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->changePassword($input['new_password']);

            if ($result['success']) {
                ApiResponse::success($result['message']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'create-account') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['username']) || !isset($input['password']) || !isset($input['license_expire'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->createAccount($input['username'], $input['password'], (int)$input['license_expire']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'update-account') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            verifyAdminJwtToken($adminAuth);

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['user_id']) || !is_numeric($input['user_id']) || !isset($input['username']) || !isset($input['password'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $adminAuth->updateAccount((int)$input['user_id'], $input['username'], $input['password']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } else {
            ApiResponse::error('Không hợp lệ', 404);
        }
    } elseif ($segments[0] === 'app') {
        if (count($segments) < 2) {
            ApiResponse::error('Không hợp lệ', 404);
            exit;
        }

        $action = $segments[1];
        $appAuth = new AppController();

        if ($action === 'login') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['username']) || !isset($input['password']) || !isset($input['hwid'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $appAuth->login($input['username'], $input['password'], $input['hwid']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'register') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['username']) || !isset($input['password']) || !isset($input['hwid'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $appAuth->register($input['username'], $input['password'], $input['hwid']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                ApiResponse::error($result['message']);
            }
        } elseif ($action === 'verify-token') {
            if ($method !== 'POST') {
                ApiResponse::error('Không hợp lệ', 405);
                exit;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['token'])) {
                ApiResponse::error('Không hợp lệ');
                exit;
            }

            $result = $appAuth->verifyToken($input['token']);

            if ($result['success']) {
                ApiResponse::success($result['message'], $result['data']);
            } else {
                if (isset($result['data'])) {
                    header('Content-Type: application/json');
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'message' => $result['message'],
                        'data' => $result['data']
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    exit;
                } else {
                    ApiResponse::error($result['message'], 401);
                }
            }
        } else {
            ApiResponse::error('Không hợp lệ', 404);
        }
    } else {
        ApiResponse::error('Không hợp lệ', 404);
    }
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    ApiResponse::error('Lỗi không xác định', 500);
}
