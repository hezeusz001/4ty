<!DOCTYPE html>
<html lang="hu" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>4ty.hu — A te híroldalad. Te döntöd el, mi fér bele.</title>
<meta name="description" content="Személyre szabott hír- és médiafolyam, nyílt podcast lejátszó, független 4ty Reflektor elemzések, tiszta nézet.">

<!-- YouTube Képek villámgyors elő-kapcsolódása és gyorsítótárazása -->
<link rel="preconnect" href="https://i.ytimg.com">
<link rel="dns-prefetch" href="https://i.ytimg.com">

<link rel="icon" type="image/png" href="./logo.png">
<link rel="manifest" href="./manifest.json">
<meta name="theme-color" content="#F6F6F5">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="4ty">

<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
darkMode: 'class',
theme: {
extend: {
screens: { 'xs': '380px' },
fontFamily: {
sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
},
colors: {
brand: { red: '#475569', redHover: '#334155', gold: '#D97706', spotify: '#1DB954' }
}
}
}
}
</script>
<link rel="stylesheet" href="./css/modern-ui.css?v=<?= filemtime(__DIR__ . '/css/modern-ui.css') ?>">
<style>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.line-clamp-2 {
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
}
.article-body p {
margin-bottom: 1.25rem;
line-height: 1.8;
}
audio {
filter: contrast(1.1);
border-radius: 8px;
}
</style>

<script>
window.openSettingsModal = window.openSettingsModal || function() {
const m = document.getElementById('settingsModal');
if (m) m.classList.remove('hidden');
};
window.closeSettingsModal = window.closeSettingsModal || function() {
const m = document.getElementById('settingsModal');
if (m) m.classList.add('hidden');
};
window.closeReaderModal = window.closeReaderModal || function() {
const m = document.getElementById('readerModal');
if (m) m.classList.add('hidden');
};
window.toggleControlDrawer = function() {
const drawer = document.getElementById('controlDrawer');
if (drawer) drawer.classList.toggle('hidden');
};
</script>
</head>
<body class="bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 antialiased font-sans min-h-screen selection:bg-neutral-300 dark:selection:bg-neutral-800 transition-colors duration-200">

<div class="w-full max-w-md md:max-w-3xl lg:max-w-6xl mx-auto min-h-screen border-x border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 flex flex-col relative transition-all duration-200 shadow-xl">

<!-- ========================================== -->
<!-- FAGYASZTOTT (STICKY) FELSŐ VEZÉRLŐ KONTÉNER -->
<!-- ========================================== -->
<div class="sticky top-0 z-40 bg-white dark:bg-neutral-950 shadow-sm">

<!-- Fejléc (Sticky Header) -->
<header class="bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-900 px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2">

<div class="flex items-center gap-2 cursor-pointer shrink-0 min-w-0" onclick="window.resetToHome && window.resetToHome()">
<img src="./logo.png" alt="4ty Logo" class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-sm shrink-0 object-contain transition-transform active:scale-95 select-none"/>
<div id="mobileWeather" class="mobile-weather" onclick="event.stopPropagation()">
  <button id="mobileWeatherButton" type="button" aria-label="Részletes időjárás" aria-expanded="false"><span id="mobileWeatherIcon">☁️</span><span class="weather-compact-text"><strong id="mobileWeatherTemp">Időjárás</strong><small id="mobileWeatherSummary">Betöltés…</small></span><span class="weather-chevron">⌄</span></button>
  <div id="mobileWeatherPanel" hidden>
    <div class="weather-detail-head"><div><strong id="mobileWeatherPlace">Helyi időjárás</strong><small id="mobileWeatherCondition">Aktuális időjárás</small></div><span id="mobileWeatherBigIcon">☁️</span></div>
    <div class="weather-detail-temperature"><strong id="mobileWeatherBigTemp">--°C</strong><span id="mobileWeatherFeels">Hőérzet: --°C</span></div>
    <div class="weather-stats"><div>💧 <small>Páratartalom</small><strong id="mobileWeatherHumidity">--%</strong></div><div>💨 <small>Szél</small><strong id="mobileWeatherWind">-- km/h</strong></div><div>🌧️ <small>Eső esélye</small><strong id="mobileWeatherRain">--%</strong></div></div>
    <div class="weather-hours-title">Következő órák</div><div id="mobileWeatherHours" class="weather-hours"></div>
    <details class="weather-city-change"><summary>Város módosítása</summary><form id="mobileWeatherForm"><input id="mobileWeatherCity" type="text" placeholder="Pl. Budapest" autocomplete="address-level2" required maxlength="90"><button type="submit">OK</button></form></details>
    <small id="mobileWeatherStatus" role="status">Időjárás betöltése…</small>
  </div>
</div>
<div class="flex flex-col justify-center min-w-0">
<div class="flex items-center gap-1.5">
<span id="feedCountBadge" class="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded shrink-0">0 db</span>
</div>
<span class="text-[10px] sm:text-[11px] text-neutral-400 font-medium tracking-tight truncate max-w-[135px] xs:max-w-[170px] sm:max-w-none">Te döntöd el, mi fér bele.</span>
</div>
</div>

<div id="headerNameday" class="header-nameday" onclick="event.stopPropagation()" aria-label="Mai dátum és névnap">
  <span class="header-nameday-date" id="headerTodayDate">📅 Dátum</span>
  <span class="header-nameday-name" id="headerTodayName">Névnap betöltése…</span>
</div>

<div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
<!-- Frissítés gomb -->
<button id="refreshFeedBtn" class="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap" title="Friss hírfolyam betöltése">
<span id="refreshIcon" class="inline-block">🔄</span> <span class="hidden sm:inline">Frissítés</span>
</button>

<button id="antiClickbaitBtn" class="text-xs px-2 py-1 rounded border border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold transition-all cursor-pointer whitespace-nowrap" title="Kattintásvadász címek átírása tiszta címekre">
🎯 <span class="hidden sm:inline">Tiszta címek</span>
</button>

<button onclick="window.toggleControlDrawer()" class="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap" title="AI témaválasztó és rendezés">
<span>✨</span> <span class="hidden sm:inline">Rendezés</span>
</button>

<button id="themeToggleBtn" class="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer" title="Téma váltása">☀️</button>
<button id="hideReadBtn" class="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer" title="Olvasottak elrejtése">👁️</button>

<button onclick="window.openSettingsModal && window.openSettingsModal()" class="text-xs px-2.5 py-1 rounded bg-[#475569] hover:bg-[#334155] text-white font-semibold flex items-center gap-1 transition-colors shadow-sm cursor-pointer whitespace-nowrap" title="Forráskönyvtár és beállítások">
<span>⚙️</span> <span class="hidden sm:inline">Vezérlőpult</span>
</button>
</div>
</header>

<!-- LENYÍLÓ FIÓK -->
<div id="controlDrawer" class="hidden border-b border-neutral-200 dark:border-neutral-900 bg-neutral-50/95 dark:bg-neutral-900/90 transition-all">
<section class="border-b border-neutral-200 dark:border-neutral-800 py-3 px-4 lg:px-6">
<div class="space-y-2">
<div class="flex items-center justify-between text-xs">
<span class="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5"><span>✨</span> <span>Milyen témák érdekelnek ma?</span></span>
<span class="text-[10px] text-neutral-500">Egy mondat, és az AI átrendezi a lapot</span>
</div>
<form onsubmit="window.handleAiCurator ? window.handleAiCurator(event) : event.preventDefault()" class="relative flex items-center">
<input id="aiPromptInput" type="text" placeholder="pl. Pénz, tőzsde és tech elemzések..." class="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#475569] pr-24 transition-all shadow-sm"/>
<button type="submit" id="aiCuratorBtn" class="absolute right-1 px-3 py-1.5 rounded-lg bg-[#475569] hover:bg-[#334155] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"><span>Összerakás</span> <span>⚡</span></button>
</form>
</div>
</section>

<div class="px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
<div class="flex items-center gap-1.5 flex-wrap">
<span class="text-neutral-400 font-medium">Rendezés:</span>
<button id="sortModeChrono" class="sort-pill px-2.5 py-1 rounded font-semibold border transition-all cursor-pointer bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white" data-mode="chrono">⏱️ Időrend</button>
<button id="sortModeCurated" class="sort-pill px-2.5 py-1 rounded font-medium border transition-all cursor-pointer bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400" data-mode="curated">✨ Értékelt</button>
<button id="sortModeReflektor" class="sort-pill px-2.5 py-1 rounded font-medium border transition-all cursor-pointer bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400" data-mode="reflektor">💡 Reflektor</button>
</div>

<!-- Gyors némító gombok -->
<div class="flex items-center gap-1">
<button id="quickMutePolitics" class="text-[11px] px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap" title="Politikai hírek elrejtése">🏛️ Politika ✕</button>
<button id="quickMuteSport" class="text-[11px] px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap" title="Sporthírek elrejtése">⚽ Sport ✕</button>
<button id="quickMuteBulvar" class="text-[11px] px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap" title="Bulvárhírek elrejtése">🎭 Bulvár ✕</button>
</div>
</div>
</div>

<!-- FŐ PILLÉR VÁLASZTÓ -->
<div class="grid grid-cols-2 p-1.5 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-850 text-xs sm:text-sm font-semibold">
<button id="pillarNewsBtn" onclick="window.switchPillar && window.switchPillar('news')" class="py-2 rounded text-center transition-all bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm flex items-center justify-center gap-2 font-bold cursor-pointer"><span>📰</span> <span>Hírek & Reflektor</span></button>
<button id="pillarVideoBtn" onclick="window.switchPillar && window.switchPillar('video')" class="py-2 rounded text-center transition-all text-neutral-500 hover:text-black dark:hover:text-white flex items-center justify-center gap-2 cursor-pointer"><span>🎧</span> <span>Média, Podcast & YT</span></button>
</div>

<!-- HÍREK Alkategória sáv (Hírek Hub gombbal) -->
<div id="newsSubNav" class="px-4 lg:px-6 py-2 border-b border-neutral-200 dark:border-neutral-900 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs bg-white dark:bg-neutral-950">
<button data-cat="all" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-black text-white dark:bg-white dark:text-black border-black dark:border-white">Összes rovat</button>
<button data-cat="reflektor" class="cat-pill shrink-0 px-3 py-1 rounded font-semibold border transition-colors bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">💡 4ty Reflektor (<span id="reflektorCountHeader">0</span>)</button>
<button data-cat="news_hub" class="cat-pill shrink-0 px-3 py-1 rounded font-semibold border transition-colors bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">✨ Hírek Hub & Beküldő</button>
<button data-cat="saved" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">🔖 Mentett hírek (<span id="savedCountHeader">0</span>)</button>
<button data-cat="gazdasag" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Gazdaság</button>
<button data-cat="tech" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Tech</button>
<button data-cat="auto" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Autó & Mobilitás</button>
<button data-cat="tudomany" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Tudomány</button>
<button data-cat="politika" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Közélet</button>
<button data-cat="sport" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Sport</button>
<button data-cat="bulvar" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Kult / Bulvár</button>
<button data-cat="kultura" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Kultúra</button>
<button data-cat="gaming" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Gaming</button>
<button data-cat="eletmod" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Életmód</button>
<button data-cat="csalad" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Gyerek / Család</button>
<button data-cat="idojaras" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Időjárás</button>
<button data-cat="nemzetkozi" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Nemzetközi</button>
<button data-cat="bunugy" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Bűnügy</button>
<button data-cat="egyeb" class="cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">Általános / Vegyes</button>
</div>

<!-- HÍRKERESŐ – kliensoldali, a már betöltött hírek között keres -->
<div id="newsSearchBar" class="px-3 sm:px-4 lg:px-6 py-2 border-b border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950">
  <div class="relative flex items-center">
    
    <input id="newsSearchInput" type="search" autocomplete="off"
      placeholder="Keresés a hírek és források között…"
      class="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#475569] transition-all">
    <button id="newsSearchClearBtn" type="button" class="hidden absolute right-2.5 text-neutral-400 hover:text-[#475569] text-sm font-bold px-1" title="Keresés törlése">✕</button>
  </div>
</div>

<!-- MÉDIA & PODCAST Alkategória sáv (Média Hub gombbal) -->
<div id="videoSubNav" class="hidden px-3 sm:px-4 lg:px-6 py-2 border-b border-neutral-200 dark:border-neutral-900 flex flex-wrap items-center justify-between gap-2 text-xs bg-white dark:bg-neutral-950">
<div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
<button data-vcat="video" class="vcat-pill shrink-0 px-2.5 py-1 rounded font-semibold border transition-colors bg-[#475569] text-white border-[#475569]">🎬 Videók</button>
<button data-vcat="podcast" class="vcat-pill shrink-0 px-2.5 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">🎙️ Podcastok</button>
<button data-vcat="my_videos" class="vcat-pill shrink-0 px-2.5 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">📺 Saját Videók</button>
<button data-vcat="my_podcasts" class="vcat-pill shrink-0 px-2.5 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">🎧 Saját Podcastok</button>
<button data-vcat="media_hub" class="vcat-pill shrink-0 px-2.5 py-1 rounded font-semibold border transition-colors bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">✨ Média Hub & Beküldő</button>
<button data-vcat="saved" class="vcat-pill shrink-0 px-2.5 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">🔖 Mentett (<span id="savedMediaCountHeader">0</span>)</button>
</div>

<button id="toggleShortsBtn" class="shrink-0 px-2.5 py-1 rounded border transition-all cursor-pointer font-bold whitespace-nowrap text-neutral-500 border-neutral-300 dark:border-neutral-800">
📱 Shorts: <span id="shortsStateText">KI</span>
</button>
</div>

</div>
<!-- ========================================== -->
<!-- FAGYASZTOTT RÉSZ VÉGE -->
<!-- ========================================== -->

<!-- Toast visszajelzés -->
<div id="toastNotification" class="hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-neutral-900 text-white text-xs px-4 py-2 rounded shadow-2xl border border-neutral-700 transition-opacity">Értesítés</div>

<!-- Fő Hírfolyam Konténer -->
<main id="newsFeed" class="flex-1"></main>

<!-- Lábléc -->
<footer id="feedFooter" class="p-6 text-center border-t border-neutral-200 dark:border-neutral-900 mt-auto space-y-2">
<div class="w-2.5 h-2.5 bg-emerald-500 rounded-full mx-auto mb-2 animate-pulse"></div>
<p class="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Összes mai friss hír, podcast és Reflektor elemzés feldolgozva.</p>
<p class="text-[11px] text-neutral-400 dark:text-neutral-600">4ty.hu — A te híroldalad. Te döntöd el, mi fér bele.</p>
</footer>

<!-- 4TY REFLEKTOR OLVASÓMODÁL -->
<div id="readerModal" class="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-md p-2 sm:p-6 flex items-center justify-center overflow-y-auto">
<div class="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
<div class="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur">
<span class="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">💡 4TY REFLEKTOR</span>
<button onclick="window.closeReaderModal && window.closeReaderModal()" class="text-neutral-500 hover:text-black dark:hover:text-white text-xl font-bold cursor-pointer">✕</button>
</div>
<div id="readerContent" class="p-6 sm:p-10 overflow-y-auto font-sans leading-relaxed text-neutral-800 dark:text-neutral-200"></div>
</div>
</div>

<!-- BEÁLLÍTÁSOK / VEZÉRLŐPULT MODÁL -->
<div id="settingsModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
<div class="bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
<div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
<div>
<h3 class="text-base font-bold text-black dark:text-white">Forráskönyvtár & Vezérlőpult</h3>
<p class="text-xs text-neutral-500">A te híroldalad. Te döntöd el, mi fér bele.</p>
</div>

</div>

<div class="p-4 space-y-5 overflow-y-auto no-scrollbar">
<!-- BIZTONSÁGI MENTÉS & ESZKÖZVÁLTÁS -->
<div class="p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2.5">
<span class="block text-xs font-bold text-black dark:text-white uppercase tracking-wider">💾 Fiók & Adatok (Eszközváltás)</span>
<div class="flex flex-col sm:flex-row gap-2">
<button onclick="window.exportUserAccountBackup && window.exportUserAccountBackup()" class="flex-1 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold transition-colors cursor-pointer">📥 Mentés fájlba</button>
<label class="flex-1 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center">
📤 Visszaállítás
<input type="file" accept=".json" onchange="window.importUserAccountBackup && window.importUserAccountBackup(event)" class="hidden">
</label>
</div>
</div>

<div class="p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2.5">
<span class="block text-xs font-bold text-black dark:text-white uppercase tracking-wider">🚫 Hírtémák Egykattintásos Elrejtése</span>
<div class="flex flex-col gap-2">
<button id="modalMutePoliticsBtn" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer"><span>🏛 Közélet & Politika</span><span id="statePolitics" class="text-[11px] px-2 py-0.5 rounded font-mono"></span></button>
<button id="modalMuteSportBtn" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer"><span>⚽ Sport</span><span id="stateSport" class="text-[11px] px-2 py-0.5 rounded font-mono"></span></button>
<button id="modalMuteBulvarBtn" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer"><span>🎭 Bulvár</span><span id="stateBulvar" class="text-[11px] px-2 py-0.5 rounded font-mono"></span></button>
<div id="settingsAllCategoryMutes" class="grid grid-cols-1 sm:grid-cols-2 gap-2"></div>
</div>
</div>

<div class="p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
<span class="text-xs font-bold text-black dark:text-white uppercase tracking-wider block">🗂️️ Főoldali Rovatok Sorrendje</span>
<div id="sectionOrderContainer" class="space-y-1.5 pt-1"></div>
</div>

<div class="p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
<span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">📚 Követett Lapok & Források</span>
<div id="catalogList" class="mt-2 space-y-2"><p class="text-xs text-neutral-400 italic">Források betöltése folyamatban...</p></div>
</div>
</div>

<div class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col gap-2">
<button onclick="window.closeSettingsModal && window.closeSettingsModal()" class="w-full py-2.5 bg-[#475569] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">Mentés & Bezárás</button>
<button type="button" onclick="window.resetAllSettings && window.resetAllSettings()" class="w-full py-1.5 text-[11px] text-neutral-400 hover:text-red-500 transition-colors cursor-pointer">🔄 Beállítások visszaállítása alaphelyzetbe</button>
</div>
</div>
</div>

<!-- EGYÉNI MEGERŐSÍTŐ MODÁL -->
<div id="confirmModal" class="hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-sm p-4 flex items-center justify-center transition-opacity">
<div class="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4" onclick="event.stopPropagation()">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 text-red-500 text-lg">🚫</div>
<div>
<h4 class="text-sm font-bold text-neutral-900 dark:text-white">Forrás elrejtése</h4>
<p id="confirmModalText" class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">Biztosan elrejted a lapot?</p>
</div>
</div>
<div class="flex items-center gap-2 pt-2">
<button id="confirmCancelBtn" class="flex-1 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">Mégse</button>
<button id="confirmOkBtn" class="flex-1 py-2 rounded-xl text-xs font-bold bg-[#475569] hover:bg-[#334155] text-white transition-colors cursor-pointer shadow-sm">Igen, elrejtem</button>
</div>
</div>
</div>

</div>

<?php
// A modulok URL-je automatikusan követi a fájlok módosítási idejét.
$moduleImports = [];
foreach (glob(__DIR__ . '/js/*.js') as $modulePath) {
    $moduleName = basename($modulePath, '.js');
    $moduleImports['4ty/' . $moduleName] = './js/' . $moduleName . '.js?v=' . filemtime($modulePath);
}
?>
<script type="importmap"><?= json_encode(['imports' => $moduleImports], JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?></script>
<script type="module">
import { initApp } from '4ty/app';
initApp();
</script>
<script defer src="./js/modern-ui.js?v=<?= filemtime(__DIR__ . '/js/modern-ui.js') ?>"></script>

<script>
/* v8.17.4: desktop-only UI refinements; original controls and handlers stay intact. */
document.addEventListener('DOMContentLoaded', () => {
  const desktop = window.matchMedia('(min-width:1024px)');
  const search = document.getElementById('newsSearchBar');
  const drawer = document.getElementById('controlDrawer');
  const settings = document.getElementById('settingsModal');
  const header = document.querySelector('header');
  const searchAnchor = search?.nextSibling;
  const searchParent = search?.parentNode;
  const drawerAnchor = drawer?.nextSibling;
  const drawerParent = drawer?.parentNode;
  const modalPanel = settings?.firstElementChild;
  let searchSlot, settingsSlot;
  function apply() {
    if (!search || !drawer || !header || !modalPanel) return;
    if (desktop.matches) {
      if (!searchSlot) { searchSlot = document.createElement('div'); searchSlot.id='desktopSearchSlot'; header.appendChild(searchSlot); }
      searchSlot.appendChild(search);
      if (!settingsSlot) { settingsSlot=document.createElement('section');settingsSlot.id='desktopSortSettings'; settingsSlot.innerHTML='<h4>Szűrők és rendezés</h4>'; modalPanel.insertBefore(settingsSlot,modalPanel.children[1] || null); }
      // A régi rendezőpanel nem kerül a Beállításokba.
      drawer.classList.add('hidden');
    } else {
      if (search.parentNode !== searchParent) searchParent?.insertBefore(search,searchAnchor);
      if (drawer.parentNode !== drawerParent) drawerParent?.insertBefore(drawer,drawerAnchor);
      drawer.classList.add('hidden');
      searchSlot?.remove(); searchSlot=null;
      settingsSlot?.remove();settingsSlot=null;
    }
  }
  apply(); desktop.addEventListener('change',apply);
  /* v8.17.4: desktop navigation. Keep the four media tabs in the CONTENT toolbar. */
  const sidebar = document.getElementById('modernDesktopNav');
  const desktopOnly = () => window.matchMedia('(min-width:1024px)').matches;
  const jump = (pillar, category) => {
    if (!desktopOnly()) return;
    hideDesktopSettings();
    window.switchPillar?.(pillar);
    document.querySelector(pillar === 'news' ? `#newsSubNav .cat-pill[data-cat="${category}"]` : `#videoSubNav .vcat-pill[data-vcat="${category}"]`)?.click();
    window.scrollTo({top:0,behavior:'smooth'});
  };
  /* Settings are rendered inside the main page, retaining the existing form and handlers. */
  const settingsModal=document.getElementById('settingsModal');
  const feed=document.getElementById('newsFeed');
  const settingsHome=settingsModal?.parentNode;
  const settingsNext=settingsModal?.nextSibling;
  const originalOpen=window.openSettingsModal;
  const originalClose=window.closeSettingsModal;
  const showDesktopSettings=()=>{
    if(!settingsModal || !feed?.parentElement)return;
    window.closeSavedLibrary?.();
    (document.getElementById('modernContentLayout') || feed).before(settingsModal);
    settingsModal.classList.remove('hidden');
    window.__4tyRefreshSettings?.();
    document.body.classList.add('desktop-settings-page');
    document.body.classList.remove('overflow-hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  };
  function hideDesktopSettings(){
    if(!settingsModal)return;
    document.body.classList.remove('desktop-settings-page');
    settingsModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
  window.openSettingsModal=function(){if(desktopOnly())showDesktopSettings();else originalOpen?.();};
  window.closeSettingsModal=function(){if(desktopOnly())hideDesktopSettings();else originalClose?.();};
  if (sidebar) {
    sidebar.querySelector('.v8-media-links')?.remove();
    document.getElementById('desktopNewsShortcuts')?.remove();
    document.getElementById('desktopMediaLinks')?.remove();
    document.getElementById('desktopHubNav')?.remove();
    sidebar.querySelector('[data-modern-view="saved"]')?.classList.add('desktop-nav-hidden');
    const hub=document.createElement('details');hub.id='desktopHubNav';hub.className='desktop-v8174-hub';
    const head=document.createElement('summary');head.className='desktop-v8174-heading';head.innerHTML='<span aria-hidden="true">✦</span><span>Beküldő Hub</span><span class="desktop-hub-chevron" aria-hidden="true">⌄</span>';hub.appendChild(head);
    for(const [pillar,cat,label] of [['news','news_hub','Hírek'],['video','media_hub','Média']]){
      const btn=document.createElement('button');btn.type='button';btn.className='desktop-v8174-link';btn.textContent=label;
      btn.addEventListener('click',()=>jump(pillar,cat));hub.appendChild(btn);
    }
    sidebar.querySelector('[data-modern-view="video"]')?.after(hub);
    sidebar.querySelectorAll('[data-modern-view="news"],[data-modern-view="video"]').forEach(el=>el.addEventListener('click',hideDesktopSettings));
  }
  desktop.addEventListener('change',()=>{
    if(!desktop.matches){hideDesktopSettings();if(settingsModal && settingsHome && settingsModal.parentNode!==settingsHome)settingsHome.insertBefore(settingsModal,settingsNext);}
  });
  /* Keep theme control modern without changing its existing click handler. */
  const theme = document.getElementById('themeToggleBtn');
  if(theme) {
    const update=()=>{theme.innerHTML=document.documentElement.classList.contains('dark')?(window.matchMedia('(min-width: 768px)').matches?'☀︎':'☀'):'☾';theme.setAttribute('aria-label',document.documentElement.classList.contains('dark')?'Világos mód':'Sötét mód');};
    update();theme.addEventListener('click',()=>queueMicrotask(update));
  }
});
</script>

<script>
/* v8.17.5 — desktop settings as an in-page view, independent of modal opener order. */
document.addEventListener('DOMContentLoaded', function () {
  const isDesktop=()=>window.matchMedia('(min-width:1024px)').matches;
  const modal=document.getElementById('settingsModal');
  const feed=document.getElementById('newsFeed');
  const home=modal?.parentNode;
  const anchor=modal?.nextSibling;
  if(!modal||!feed)return;
  function showPage(){
    if(!isDesktop())return;
    window.closeSavedLibrary?.();
    (document.getElementById('modernContentLayout') || feed).before(modal);
    document.body.classList.add('desktop-settings-page');
    modal.classList.remove('hidden');
    // A korábbi navigáció csak megjelenítette a modált, nem töltötte be a forráslistát.
    window.__4tyRefreshSettings?.();
    document.body.classList.remove('overflow-hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function closePage(){
    document.body.classList.remove('desktop-settings-page');
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
  document.addEventListener('click',function(e){
    if(!isDesktop())return;
    const target=e.target.closest('#modernDesktopNav [data-modern-view="settings"]');
    if(target){e.preventDefault();e.stopImmediatePropagation();window.closeSavedLibrary?.();showPage();return;}
    if(e.target.closest('#modernDesktopNav [data-modern-view="news"], #modernDesktopNav [data-modern-view="video"], #desktopHubNav button'))closePage();
    if(e.target.closest('#settingsModal button[onclick*="closeSettingsModal"]')){
      e.preventDefault();e.stopImmediatePropagation();closePage();
    }
  },true);
  window.addEventListener('resize',()=>{
    if(!isDesktop()){
      closePage();
      if(home && modal.parentNode!==home)home.insertBefore(modal,anchor);
    }
  });
});
</script>

<script>
/* v8.17.6 — desktop settings sections: keep mobile controls intact. */
document.addEventListener('DOMContentLoaded', () => {
  const modal=document.getElementById('settingsModal');
  if(!modal)return;
  const panel=modal.firstElementChild;
  const scroller=panel?.querySelector(':scope > .overflow-y-auto');
  if(!scroller)return;
  function setupDesktopTabs(){
    let nav=document.getElementById('desktopSettingsSections');
    if(!nav){
      nav=document.createElement('nav'); nav.id='desktopSettingsSections';
      nav.setAttribute('aria-label','Beállítások menüpontjai');
      const cards=[...scroller.children].filter(el=>el.matches('div,section'));
      const labels=['Megjelenés','Adatok','Témák','Rovatok','Források'];
      const sections=cards.filter(el=>el.classList.contains('v8-settings-section') || el.querySelector(':scope > span'));
      sections.forEach((card,i)=>{
        if (card.querySelector('#sectionOrderContainer')) return;
        const title=card.querySelector(':scope > h3, :scope > span')?.textContent?.trim();
        const button=document.createElement('button');button.type='button';
        button.textContent=title || labels[i] || 'Beállítás';
        button.addEventListener('click',()=>{
          if(!window.matchMedia('(min-width:1024px)').matches)return;
          card.scrollIntoView({behavior:'smooth',block:'start'});
          nav.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b===button));
        });
        nav.appendChild(button);
      });
      panel.querySelector('#modernSettingsJumps')?.after(nav);
      if(!nav.parentNode)scroller.before(nav);
    }
  }
  setupDesktopTabs();
  new MutationObserver(()=>{if(document.body.classList.contains('desktop-settings-page'))setupDesktopTabs();}).observe(document.body,{attributes:true,attributeFilter:['class']});
});
</script>
<script>
/* v8.17.8: mobile settings state and opt-in city weather */
(function(){
  function init(){
    const modal=document.getElementById('settingsModal');
    const nav=document.getElementById('modernBottomNav');
    const weather=document.getElementById('mobileWeather');
    const button=document.getElementById('mobileWeatherButton');
    const panel=document.getElementById('mobileWeatherPanel');
    const city=document.getElementById('mobileWeatherCity');
    const status=document.getElementById('mobileWeatherStatus');
    const temp=document.getElementById('mobileWeatherTemp');
    if(!modal||!weather)return;
    const mobile=()=>matchMedia('(max-width:767px)').matches;
    const sync=()=>{
      if(!mobile()||!nav)return;
      const opened=!modal.classList.contains('hidden');
      if(opened){
        nav.querySelectorAll('[data-modern-view]').forEach(el=>{
          const selected=el.dataset.modernView==='settings';
          el.classList.toggle('is-active',selected);
          if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
        });
      }else{
        const p=localStorage.getItem('4ty_current_pillar')||'news';
        const n=localStorage.getItem('4ty_current_news_category')||'all';
        const v=localStorage.getItem('4ty_current_video_category')||'video';
        const key=(p==='news'&&n==='news_hub')||(p==='video'&&v==='media_hub')?'hub':(n==='saved'&&p==='news')||(v==='saved'&&p==='video')?'saved':p==='video'?'video':'news';
        nav.querySelectorAll('[data-modern-view]').forEach(el=>{
          const selected=el.dataset.modernView===key;
          el.classList.toggle('is-active',selected);
          if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
        });
      }
    };
    new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{if(e.target.closest('[data-modern-view]'))setTimeout(sync,0);});
    window.addEventListener('resize',sync);
    sync();
    const iconEl=document.getElementById('mobileWeatherIcon');
    const summary=document.getElementById('mobileWeatherSummary');
    const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    const closePanel=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');};
    const openPanel=()=>{panel.hidden=false;button.setAttribute('aria-expanded','true');};
    button.addEventListener('click',()=>panel.hidden?openPanel():closePanel());
    document.addEventListener('click',e=>{if(!weather.contains(e.target))closePanel();});
    const weatherIcon=code=>code===0?'☀️':code<=3?'⛅':code<=48?'🌫️':code<=67?'🌧️':code<=77?'❄️':code<=82?'🌦️':code<=86?'🌨️':'⛈️';
    const weatherName=code=>code===0?'Derült':code<=3?'Változóan felhős':code<=48?'Ködös':code<=67?'Esős':code<=77?'Havas':code<=82?'Záporos':code<=86?'Hózáporos':'Zivataros';
    const rounded=(v,unit='')=>typeof v==='number'?Math.round(v)+unit:'--'+unit;
    let lastRequest=0;
    async function showWeather(latitude,longitude,label){
      const request=++lastRequest;
      const params=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),current:'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',hourly:'temperature_2m,weather_code,precipitation_probability',forecast_days:'2',timezone:'auto'});
      const res=await fetch('https://api.open-meteo.com/v1/forecast?'+params);if(!res.ok)throw Error('Az időjárás nem érhető el');
      const data=await res.json();if(request!==lastRequest)return;
      const c=data.current||{};if(typeof c.temperature_2m!=='number')throw Error('Nincs hőmérsékletadat');
      const icon=weatherIcon(c.weather_code), name=weatherName(c.weather_code), place=label||'Helyi időjárás';
      iconEl.textContent=icon;temp.textContent=rounded(c.temperature_2m,'°C');summary.textContent=place;
      setText('mobileWeatherPlace',place);setText('mobileWeatherCondition',name);setText('mobileWeatherBigIcon',icon);
      setText('mobileWeatherBigTemp',rounded(c.temperature_2m,'°C'));setText('mobileWeatherFeels','Hőérzet: '+rounded(c.apparent_temperature,'°C'));
      setText('mobileWeatherHumidity',rounded(c.relative_humidity_2m,'%'));setText('mobileWeatherWind',rounded(c.wind_speed_10m,' km/h'));
      const times=data.hourly?.time||[], now=data.current?.time||'', start=times.findIndex(t=>t>=now.slice(0,13)+':00');
      const next=start<0?0:start;const rain=data.hourly?.precipitation_probability||[];
      setText('mobileWeatherRain',rounded(rain[next],'%'));
      const hours=document.getElementById('mobileWeatherHours');hours.replaceChildren();
      for(let i=next;i<Math.min(next+4,times.length);i++){
        const item=document.createElement('div');const time=document.createElement('small');time.textContent=times[i].slice(11,16);
        const pict=document.createElement('span');pict.textContent=weatherIcon(data.hourly.weather_code?.[i]);
        const degrees=document.createElement('strong');degrees.textContent=rounded(data.hourly.temperature_2m?.[i],'°');
        item.append(time,pict,degrees);hours.appendChild(item);
      }
      button.title=place+' – '+name+' '+rounded(c.temperature_2m,'°C');
      status.textContent='Adatok: Open-Meteo';closePanel();
    }
    async function loadWeather(name){
      status.textContent='Időjárás betöltése…';
      try{
        const geo=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(name)+'&count=1&language=hu&format=json');
        if(!geo.ok)throw Error('Nem sikerült a városkeresés');
        const places=await geo.json(),place=places.results?.[0];if(!place)throw Error('Nem található ilyen város');
        await showWeather(place.latitude,place.longitude,place.name);localStorage.setItem('4ty_weather_city',place.name);
      }catch(err){status.textContent=err.message||'Az időjárás nem elérhető';openPanel();}
    }
    document.getElementById('mobileWeatherForm').addEventListener('submit',e=>{e.preventDefault();const name=city.value.trim();if(name)loadWeather(name);});
    const saved=localStorage.getItem('4ty_weather_city');
    if(saved){city.value=saved;loadWeather(saved);}
    if(navigator.geolocation&&window.isSecureContext){
      navigator.geolocation.getCurrentPosition(async pos=>{
        try{await showWeather(pos.coords.latitude,pos.coords.longitude,'Helyi időjárás');localStorage.removeItem('4ty_weather_city');}
        catch(err){if(!saved)status.textContent='Nem sikerült betölteni az időjárást. Adj meg egy várost.';}
      },()=>{if(!saved)status.textContent='Helymeghatározás nélkül adj meg egy várost.';},
      {enableHighAccuracy:false,timeout:8000,maximumAge:30*60*1000});
    }else if(!saved){status.textContent='Az automatikus helymeghatározás HTTPS-en működik.';}

  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
</script>

<!-- v8.17.12: Magyar dátum és névnap a fejlécben -->
<script>
(function(){
  const dateEl=document.getElementById('headerTodayDate');
  const nameEl=document.getElementById('headerTodayName');
  if(!dateEl||!nameEl)return;
  const keyFor=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Budapest',month:'2-digit',day:'2-digit'}).format(date).slice(0,5);
  const formatDate=date=>new Intl.DateTimeFormat('hu-HU',{timeZone:'Europe/Budapest',year:'numeric',month:'short',day:'numeric'}).format(date);
  const source='https://raw.githubusercontent.com/froccsos/nevnapok-json/master/nevnapok.json';
  let names=null;
  async function loadNames(){
    try{
      const cached=localStorage.getItem('4ty_namedays_cache');
      if(cached){try{names=JSON.parse(cached);render();}catch(_){}}
      const response=await fetch(source,{cache:'force-cache'});
      if(!response.ok)throw new Error('Névnap-adat nem elérhető');
      names=await response.json();
      try{localStorage.setItem('4ty_namedays_cache',JSON.stringify(names));}catch(_){}
    }catch(error){if(!names)nameEl.textContent='Névnap nem elérhető';}
    render();
  }
  function render(){
    const now=new Date();
    dateEl.textContent='📅 '+formatDate(now);
    if(!names)return;
    const [month,day]=keyFor(now).split('-').map(Number);
    const main=names[String(month)]?.[String(day)]?.main;
    nameEl.textContent=Array.isArray(main)&&main.length?main.join(', ')+' névnap':'Névnap nem elérhető';
    nameEl.title=nameEl.textContent;
  }
  render();loadNames();
  // Frissítés lapvisszatéréskor és időnként, hogy éjfél után is helyes legyen.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  setInterval(render,60000);
})();
</script>

<script>
// A PWA service worker a saját statikus erőforrásokat kezeli; a hírek mindig élőben érkeznek.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(error => console.warn('4ty PWA regisztráció sikertelen:', error));
  });
}
</script>
</body>
</html>