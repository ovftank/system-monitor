<?php
header('Content-Type: application/json');

$host = '103.130.216.142';
$db   = 'sppcvnfh_tool';
$user = 'sppcvnfh_admin';
$pass = 'La_Chuoi_Xanh_591';
$jwt_secret = 'con-meo-bu';
define('INPUT_STREAM', 'php://input');

function base64UrlEncode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data)
{
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 4 - (strlen($data) % 4)));
}

function generateJWT($payload, $secret)
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $header_encoded = base64UrlEncode(json_encode($header));
    $payload_encoded = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $secret, true);
    $signature_encoded = base64UrlEncode($signature);

    return "$header_encoded.$payload_encoded.$signature_encoded";
}

function verifyJWT($token, $secret)
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    list($header_encoded, $payload_encoded, $signature_encoded) = $parts;
    $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $secret, true);
    $signature_encoded_verify = base64UrlEncode($signature);

    if (!hash_equals($signature_encoded, $signature_encoded_verify)) {
        return null;
    }

    $payload = json_decode(base64UrlDecode($payload_encoded), true);
    return (isset($payload['exp']) && $payload['exp'] < time()) ? null : $payload;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    if ($method === 'POST' && strpos($path, '/api/auth/login') !== false) {
        $input = json_decode(file_get_contents(INPUT_STREAM), true);

        if (!isset($input['username']) || !isset($input['password']) || !isset($input['hwid'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Không hợp lệ']);
            exit;
        }

        $username = $input['username'];
        $password = $input['password'];
        $hwid = $input['hwid'];

        $stmt = $pdo->prepare("SELECT id, username, hwid, status, license_expire FROM accounts WHERE username = ? AND password = ?");
        $stmt->execute([$username, $password]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$account) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Tài khoản hoặc mật khẩu không đúng']);
            exit;
        }

        if ($account['hwid'] !== null && $account['hwid'] !== $hwid) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'HWID không khớp']);
            exit;
        }

        if ($account['hwid'] === null) {
            $stmt = $pdo->prepare("UPDATE accounts SET hwid = ? WHERE id = ?");
            $stmt->execute([$hwid, (int)$account['id']]);
        }

        if ((int)$account['status'] === 0) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Tài khoản chưa được kích hoạt']);
            exit;
        }

        if ((int)$account['license_expire'] < time()) {
            $stmt = $pdo->prepare("UPDATE accounts SET status = 0 WHERE id = ?");
            $stmt->execute([(int)$account['id']]);
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Tài khoản đã hết hạn']);
            exit;
        }

        $token_exp = time() + (24 * 60 * 60);
        $payload = [
            'id' => (int)$account['id'],
            'username' => $account['username'],
            'iat' => time(),
            'exp' => $token_exp
        ];

        $token = generateJWT($payload, $jwt_secret);

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'token' => $token,
            'expires_at' => $token_exp
        ]);
        exit;
    }

    if ($method === 'POST' && strpos($path, '/api/auth/register') !== false) {
        $input = json_decode(file_get_contents(INPUT_STREAM), true);

        if (!isset($input['username']) || !isset($input['password']) || !isset($input['hwid'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Không hợp lệ']);
            exit;
        }

        $username = $input['username'];
        $password = $input['password'];
        $hwid = $input['hwid'];
        $license_expire = time() + (6 * 30 * 24 * 60 * 60);

        try {
            $stmt = $pdo->prepare("INSERT INTO accounts (username, password, hwid, status, license_expire) VALUES (?, ?, ?, 0, ?)");
            $stmt->execute([$username, $password, $hwid, $license_expire]);
            $account_id = $pdo->lastInsertId();

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Đăng kí thành công!\n Liên hệ admin để kích hoạt tài khoản!',
                'account_id' => (int)$account_id,
                'username' => $username
            ]);
            exit;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['status' => 'error', 'message' => 'Tài khoản đã tồn tại']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Đăng kí thất bại']);
            }
            exit;
        }
    }

    if ($method === 'POST' && strpos($path, '/api/auth/status') !== false) {
        $input = json_decode(file_get_contents(INPUT_STREAM), true);
        $token = $input['token'] ?? '';

        if (!$token) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Không hợp lệ']);
            exit;
        }

        $payload = verifyJWT($token, $jwt_secret);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Token không hợp lệ']);
            exit;
        }

        $account_id = $payload['id'];

        $stmt = $pdo->prepare("SELECT id, username, status, hwid, license_expire FROM accounts WHERE id = ?");
        $stmt->execute([$account_id]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$account) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Tài khoản không tồn tại']);
            exit;
        }

        if ((int)$account['license_expire'] < time()) {
            $stmt = $pdo->prepare("UPDATE accounts SET status = 0 WHERE id = ?");
            $stmt->execute([(int)$account['id']]);
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Tài khoản đã hết hạn']);
            exit;
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'account_status' => (int)$account['status'],
            'license_expire' => (int)$account['license_expire']
        ]);
        exit;
    }

    http_response_code(404);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    exit;
}
