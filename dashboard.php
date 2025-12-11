<?php
require_once __DIR__ . '/autoload.php';

use App\Config;

Config::requireAdmin();
$pdo = Config::getPDO();

$q = $_GET['q'] ?? '';

$query = "SELECT * FROM accounts WHERE 1=1";
$params = [];

if (!empty($q)) {
    $query .= " AND username LIKE ?";
    $params[] = "%$q%";
}

$query .= " ORDER BY id DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$accounts = $stmt->fetchAll(\PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>‎</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js"></script>
</head>

<body class="bg-white">
    <header class="border-b border-black bg-white py-4 px-6">
        <div class="flex items-center justify-between max-w-6xl mx-auto">
            <div class="border-r border-black pr-4">
                <img src="https://github.com/ovftank.png" alt="Logo" class="h-10 w-10 rounded">
            </div>
            <a href="api/logout.php" class="border border-black bg-black text-white px-4 py-2 font-semibold rounded hover:bg-white hover:text-black">
                Logout
            </a>
        </div>
    </header>

    <main class="max-w-6xl mx-auto py-6">
        <div class="mb-6">
            <div class="flex gap-3 mb-6">
                <input type="text" name="q" placeholder="Search..." class="flex-1 px-4 py-2 border border-black rounded bg-white text-black" value="<?php echo htmlspecialchars($q); ?>" hx-get="api/search.php" hx-target="tbody" hx-trigger="input changed delay:300ms" hx-swap="innerHTML">
                <a href="/dashboard.php" class="bg-white text-black px-6 py-2 font-semibold rounded hover:bg-black hover:text-white border border-black">
                    Reset
                </a>
            </div>
        </div>

        <div class="border border-black bg-white overflow-hidden rounded">
            <div class="overflow-x-auto max-h-[calc(100vh-189px)] overflow-y-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-black bg-black">
                            <th class="sticky top-0 z-10 px-4 py-3 text-left text-white font-semibold text-sm bg-black">ID</th>
                            <th class="sticky top-0 z-10 px-4 py-3 text-left text-white font-semibold text-sm bg-black">Username</th>
                            <th class="sticky top-0 z-10 px-4 py-3 text-left text-white font-semibold text-sm bg-black">Password</th>
                            <th class="sticky top-0 z-10 px-4 py-3 text-left text-white font-semibold text-sm bg-black">HWID</th>
                            <th class="sticky top-0 z-10 px-4 py-3 text-left text-white font-semibold text-sm bg-black">License</th>
                            <th class="sticky top-0 z-10 px-4 py-3 text-left text-white font-semibold text-sm bg-black">Status</th>
                            <th class="sticky top-0 z-10 px-4 py-3 text-left text-white font-semibold text-sm bg-black">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($accounts as $account):
                            $license_date = date('Y-m-d\TH:i', $account['license_expire']);
                        ?>
                            <tr class="border-b border-gray-200 hover:bg-gray-50" id="account-<?php echo $account['id']; ?>">
                                <td class="px-4 py-3 text-sm"><?php echo htmlspecialchars($account['id']); ?></td>
                                <td class="px-4 py-3 text-sm font-medium"><?php echo htmlspecialchars($account['username']); ?></td>
                                <td class="px-4 py-3 text-sm font-mono text-gray-600"><?php echo htmlspecialchars($account['password']); ?></td>
                                <td class="px-4 py-3 text-sm text-gray-600"><?php echo htmlspecialchars($account['hwid'] ?? '-'); ?></td>
                                <td class="px-4 py-3 text-sm">
                                    <form hx-patch="api/update-license.php?id=<?php echo $account['id']; ?>" hx-trigger="change from input" hx-swap="none" class="m-0">
                                        <input type="datetime-local" name="datetime" class="border border-black rounded px-2 py-1 text-xs" value="<?php echo htmlspecialchars($license_date); ?>">
                                    </form>
                                </td>
                                <td class="px-4 py-3 text-sm">
                                    <input type="checkbox" <?php echo $account['status'] ? 'checked' : ''; ?> hx-patch="api/toggle-status.php?id=<?php echo $account['id']; ?>" hx-target="#account-<?php echo $account['id']; ?>" hx-swap="outerHTML transition:true" hx-trigger="change" class="w-5 h-5 cursor-pointer appearance-none border border-black rounded checked:bg-black checked:border-black accent-black">
                                </td>
                                <td class="px-4 py-3 text-sm flex gap-2">
                                    <button hx-patch="api/reset-hwid.php?id=<?php echo $account['id']; ?>" hx-target="#account-<?php echo $account['id']; ?>" hx-swap="outerHTML transition:true" class="border border-black bg-white text-black px-3 py-1 text-xs font-semibold rounded hover:bg-black hover:text-white">
                                        Reset
                                    </button>
                                    <button hx-delete="api/delete-account.php?id=<?php echo $account['id']; ?>" hx-target="#account-<?php echo $account['id']; ?>" hx-swap="outerHTML swap:1s transition:true" class="border border-black bg-black text-white px-3 py-1 text-xs font-semibold rounded hover:bg-white hover:text-black">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php if (empty($accounts)): ?>
                    <div class="px-4 py-8 text-center text-gray-600">
                        No accounts found.
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </main>
</body>

</html>