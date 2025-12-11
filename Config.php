<?php

namespace App;

class Config
{
    const DB_HOST = 'localhost';
    const DB_NAME = '';
    const DB_USER = '';
    const DB_PASS = '';

    public static function getPDO(): \PDO
    {
        try {
            return new \PDO(
                "mysql:host=" . self::DB_HOST . ";dbname=" . self::DB_NAME . ";charset=utf8mb4",
                self::DB_USER,
                self::DB_PASS,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
        } catch (\PDOException $e) {
            http_response_code(500);
            exit;
        }
    }

    public static function requireAdmin(): void
    {
        session_start();
        if (!isset($_SESSION['admin_user'])) {
            http_response_code(401);
            exit;
        }
    }
}
