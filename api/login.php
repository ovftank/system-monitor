<?php
require_once __DIR__ . '/../autoload.php';

use App\Config;

$pdo = Config::getPDO();
$tk = $_POST['tk'] ?? '';
$mk = $_POST['mk'] ?? '';

if (!$tk || !$mk) {
    http_response_code(400);
    exit;
}

$stmt = $pdo->prepare("SELECT mk FROM admin_accounts WHERE tk = ?");
$stmt->execute([$tk]);
$admin = $stmt->fetch(\PDO::FETCH_ASSOC);

if (!$admin || $admin['mk'] !== $mk) {
    http_response_code(401);
    exit;
}

session_start();
$_SESSION['admin_user'] = $tk;
header("HX-Redirect: /dashboard.php");
