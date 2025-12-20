<?php

namespace App\Config;

class ApiResponse
{
    private static function createResponse(
        bool $success,
        string $message,
        mixed $data = null
    ): array {
        $response = [
            'success' => $success,
            'message' => $message
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return $response;
    }

    private static function outputJson(array $response, int $httpCode = 200): void
    {
        header('Content-Type: application/json');
        http_response_code($httpCode);

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(string $message = 'Thành công', mixed $data = null, int $httpCode = 200): void
    {
        $response = self::createResponse(true, $message, $data);
        self::outputJson($response, $httpCode);
    }

    public static function error(string $message = 'Lỗi', int $httpCode = 400): void
    {
        $response = self::createResponse(false, $message);
        self::outputJson($response, $httpCode);
    }
}
