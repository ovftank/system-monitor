<?php
require_once __DIR__ . '/autoload.php';

session_start();

if (isset($_SESSION['admin_user'])) {
    header("Location: /dashboard.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js"></script>
</head>

<body class="bg-white">
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-md border border-black overflow-hidden rounded">
            <div class="border-b border-black px-6 py-6 flex justify-center">
                <img src="https://github.com/ovftank.png" alt="Logo" class="h-12 w-12 rounded">
            </div>

            <div class="p-6">
                <form hx-post="api/login.php" class="space-y-4">
                    <input
                        autofocus
                        type="text"
                        name="tk"
                        required
                        autocomplete="username"
                        class="w-full px-4 py-2 border border-black rounded bg-white text-black"
                        placeholder="Username">

                    <input
                        type="password"
                        name="mk"
                        required
                        autocomplete="current-password"
                        class="w-full px-4 py-2 border border-black rounded bg-white text-black"
                        placeholder="Password">

                    <button
                        type="submit"
                        class="w-full bg-black text-white font-semibold py-2 px-4 rounded cursor-pointer hover:bg-white hover:text-black border border-black">
                        Login
                    </button>
                </form>
            </div>
        </div>
    </div>
</body>

</html>