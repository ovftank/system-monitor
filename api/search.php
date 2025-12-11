<?php
require_once __DIR__ . '/../autoload.php';

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

foreach ($accounts as $account):
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
    <?php
endforeach;

if (empty($accounts)) {
    echo '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-600">Không tìm thấy tài khoản nào.</td></tr>';
}
