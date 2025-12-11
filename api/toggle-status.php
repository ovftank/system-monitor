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

$stmt = $pdo->prepare("SELECT status FROM accounts WHERE id = ?");
$stmt->execute([$id]);
$account = $stmt->fetch(\PDO::FETCH_ASSOC);

if (!$account) {
    http_response_code(404);
    exit;
}

$newStatus = $account['status'] ? 0 : 1;
$stmt = $pdo->prepare("UPDATE accounts SET status = ? WHERE id = ?");
$stmt->execute([$newStatus, $id]);

$stmt = $pdo->prepare("SELECT * FROM accounts WHERE id = ?");
$stmt->execute([$id]);
$updated = $stmt->fetch(\PDO::FETCH_ASSOC);

$license_date = date('Y-m-d\TH:i', $updated['license_expire']);
?>
<tr class="border-b border-gray-200 hover:bg-gray-50" id="account-<?php echo $updated['id']; ?>">
    <td class="px-4 py-3 text-sm"><?php echo htmlspecialchars($updated['id']); ?></td>
    <td class="px-4 py-3 text-sm font-medium"><?php echo htmlspecialchars($updated['username']); ?></td>
    <td class="px-4 py-3 text-sm font-mono text-gray-600"><?php echo htmlspecialchars($updated['password']); ?></td>
    <td class="px-4 py-3 text-sm text-gray-600"><?php echo htmlspecialchars($updated['hwid'] ?? '-'); ?></td>
    <td class="px-4 py-3 text-sm">
        <form hx-patch="api/update-license.php?id=<?php echo $updated['id']; ?>" hx-trigger="change from input" hx-swap="none" class="m-0">
            <input type="datetime-local" name="datetime" class="border border-black rounded px-2 py-1 text-xs" value="<?php echo htmlspecialchars($license_date); ?>">
        </form>
    </td>
    <td class="px-4 py-3 text-sm">
        <input type="checkbox" <?php echo $updated['status'] ? 'checked' : ''; ?> hx-patch="api/toggle-status.php?id=<?php echo $updated['id']; ?>" hx-target="#account-<?php echo $updated['id']; ?>" hx-swap="outerHTML transition:true" hx-trigger="change" class="w-5 h-5 cursor-pointer appearance-none border border-black rounded checked:bg-black checked:border-black accent-black">
    </td>
    <td class="px-4 py-3 text-sm flex gap-2">
        <button hx-patch="api/reset-hwid.php?id=<?php echo $updated['id']; ?>" hx-target="#account-<?php echo $updated['id']; ?>" hx-swap="outerHTML transition:true" class="border border-black bg-white text-black px-3 py-1 text-xs font-semibold rounded hover:bg-black hover:text-white">
            Reset
        </button>
        <button hx-delete="api/delete-account.php?id=<?php echo $updated['id']; ?>" hx-target="#account-<?php echo $updated['id']; ?>" hx-swap="outerHTML swap:1s transition:true" class="border border-black bg-black text-white px-3 py-1 text-xs font-semibold rounded hover:bg-white hover:text-black">
            Delete
        </button>
    </td>
</tr>
