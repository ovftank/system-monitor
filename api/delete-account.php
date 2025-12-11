<?php
require_once __DIR__ . '/../autoload.php';

use App\Config;

Config::requireAdmin();

$pdo = Config::getPDO();
$id = $_GET['id'] ?? '';

if (!$id) {
    http_response_code(400);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM accounts WHERE id = ?");
$stmt->execute([$id]);

http_response_code(200);
