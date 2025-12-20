<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\BeforeValidException;
use Firebase\JWT\SignatureInvalidException;
use Exception;

class JwtService
{
    private static string $secretKey = 'secret-key-is-con-meo-xau-vai-ca-lon-nhe';
    private static string $algorithm = 'HS256';
    private static int $expirationTime = 604800;

    public static function encode(array $payload): string
    {
        try {
            $now = time();

            $payload['iss'] = 'con-meo-xau';
            $payload['iat'] = $now;
            $payload['exp'] = $now + self::$expirationTime;

            error_log('JWT encode payload: ' . json_encode($payload));
            $token = JWT::encode($payload, self::$secretKey, self::$algorithm);
            error_log('JWT encode success: ' . substr($token, 0, 50) . '...');

            return $token;
        } catch (Exception $e) {
            error_log('JWT encode error: ' . $e->getMessage());
            throw $e;
        }
    }

    public static function decode(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key(self::$secretKey, self::$algorithm));
        } catch (ExpiredException $e) {
            error_log('JWT expired: ' . $e->getMessage());
        } catch (BeforeValidException $e) {
            error_log('JWT not yet valid: ' . $e->getMessage());
        } catch (SignatureInvalidException $e) {
            error_log('JWT signature invalid: ' . $e->getMessage());
        } catch (Exception $e) {
            error_log('JWT decode error: ' . $e->getMessage());
        }

        return null;
    }
}
