<?php
require_once __DIR__ . '/../autoload.php';

use App\Config;

Config::requireAdmin();

$pdo = Config::getPDO();
$account_id = $_GET['id'] ?? null;
$datetime = $_GET['datetime'] ?? null;

if (!$account_id || !$datetime) {
    http_response_code(400);
    exit;
}

$license_expire = strtotime($datetime);

$stmt = $pdo->prepare("UPDATE accounts SET license_expire = ? WHERE id = ?");
$stmt->execute([$license_expire, (int)$account_id]);

http_response_code(200);
