<?php
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
// Cache-busting: the browser gets a new URL whenever a file changes.
function assetVersion(string $path): string {
    $fullPath = dirname(__DIR__) . $path;
    return is_file($fullPath) ? (string) filemtime($fullPath) : '0';
}
$adminCss = '/admin/css/admin.css';
$adminJs = '/admin/js/admin.js';
$authJs = '/js/auth.js';
$configJs = '/js/config.js';
$imports = [
    $authJs => $authJs . '?v=' . assetVersion($authJs),
    $configJs => $configJs . '?v=' . assetVersion($configJs),
];
?>
<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>4ty Admin</title><link rel="stylesheet" href="<?= htmlspecialchars($adminCss . '?v=' . assetVersion($adminCss), ENT_QUOTES, 'UTF-8') ?>"></head><body>
<header><strong>4ty <span>Admin</span></strong><a href="/">← Hírportál</a></header>
<main><section id="loading" class="panel"><h1>Jogosultság ellenőrzése…</h1></section>
<section id="login" class="panel" hidden><h1>Admin belépés</h1><p>Csak jóváhagyott adminisztrátoroknak.</p><form id="login-form"><label>E-mail<input id="email" type="email" autocomplete="username" required></label><label>Jelszó<input id="password" type="password" autocomplete="current-password" required></label><button type="submit">Belépés</button></form><p id="login-error" role="alert"></p></section>
<section id="denied" class="panel" hidden><h1>Nincs adminjogosultság</h1><p>A fiókod nem szerepel az adminisztrátorok között.</p><button id="logout-denied">Kijelentkezés</button></section>
<section id="dashboard" hidden><div class="hero"><h1>Vezérlőpult</h1><button id="logout">Kijelentkezés</button></div><p id="admin-email"></p><nav class="tabs"><button type="button" id="tab-overview" class="tab active">Áttekintés</button><button type="button" id="tab-sources" class="tab">Hírforrások</button></nav><div id="overview-view"><div class="cards"><article><h2>Hírforrások</h2><p>Hamarosan</p></article><article><h2>Cikkek</h2><p>Hamarosan</p></article><article><h2>Beküldések</h2><p>Hamarosan</p></article><article><h2>Rendszerállapot</h2><p>Hamarosan</p></article></div><p class="note">A források aktiválása és letiltása adminjogosultsághoz kötött.</p></div><div id="sources-view" hidden><div class="hero"><h2>Hírforrások</h2><button type="button" id="refresh-sources">Frissítés</button></div><p id="sources-status" role="status"></p><label for="source-search">Keresés név, kategória vagy URL alapján<input id="source-search" type="search" placeholder="Forrás keresése"></label><div class="table-wrap"><table><thead><tr><th>Név</th><th>Kategória</th><th>Típus</th><th>Feed URL</th><th>Állapot</th><th>Művelet</th></tr></thead><tbody id="sources-body"></tbody></table></div><div class="pagination"><button type="button" id="sources-prev">Előző</button><span id="sources-page"></span><button type="button" id="sources-next">Következő</button></div><p class="note">Az aktív állapot a sources_catalog.is_active mezőből származik. A worker feldolgozási állapotát később kötjük be.</p></div></section>
</main><script type="importmap"><?= json_encode(['imports' => $imports], JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?></script>
<script type="module" src="<?= htmlspecialchars($adminJs . '?v=' . assetVersion($adminJs), ENT_QUOTES, 'UTF-8') ?>"></script></body></html>
