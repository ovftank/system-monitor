<?php

namespace App\Config;

use PDO;
use PDOException;
use LogicException;
use UnexpectedValueException;

class DatabaseConnection
{
    private static $instance = null;
    private $connection;

    private $host = 'localhost';
    private $username = '';
    private $password = '';
    private $database = '';
    private $charset = 'utf8mb4';

    private function __construct()
    {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->database};charset={$this->charset}";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true,
                PDO::ATTR_TIMEOUT => 30,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}",
                PDO::MYSQL_ATTR_MULTI_STATEMENTS => false,
            ];

            $this->connection = new PDO($dsn, $this->username, $this->password, $options);

            $this->connection->exec("SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new UnexpectedValueException("Unable to connect to database", 0, $e);
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function query(string $sql, array $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage() . " SQL: " . $sql);
            throw new UnexpectedValueException("Query execution failed", 0, $e);
        }
    }

    private function __clone()
    {
        throw new LogicException("Cannot clone a singleton instance");
    }

    public function __wakeup()
    {
        throw new LogicException("Cannot unserialize singleton");
    }
}
