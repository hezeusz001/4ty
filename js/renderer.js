// js/renderer.js - Hírkártya és Feed renderelő modul (v49.0 - clustering V1 + relatív idő)
import { CATEGORY_META } from '4ty/config';

function escapeHtml(str) {
if (!str) return '';
const div = document.createElement('div');
div.textContent = str;
return div.innerHTML;
}

// Reflektor: tematikus, stabilan kiválasztott illusztráció (nem a cikk eredeti fotója).
// Nincs API-kulcs és nincs képgenerálási költség. Az adott cikk ugyanazt a képet kapja újratöltéskor.
const REFLEKTOR_PHOTOS = {
  tech: ['photo-1518770660439-4636190af475','photo-1451187580459-43490279c0fa','photo-1485827404703-89b55fcc595e'],
  economy: ['photo-1611974789855-9c2a0a7236a3','photo-1460925895917-afdab827c52f','photo-1486406146926-c627a92ad1ab'],
  politics: ['photo-1529107386315-e1a2ed48a620','photo-1494173853739-c21f58b16055','photo-1520869562399-e772f042f422'],
  science: ['photo-1532094349884-543bc11b234d','photo-1446776811953-b23d57bd21aa','photo-1462331940025-496dfbfc7564'],
  sport: ['photo-1461896836934-ffe607ba8211','photo-1540747913346-19e32dc3e97e','photo-1517649763962-0c623066013b'],
  culture: ['photo-1514525253161-7a46d19cd819','photo-1493225457124-a3eb161ffa5f','photo-1481627834876-b7833e8f5570'],
  general: ['photo-1504711434969-e33886168f5c','photo-1495020689067-958852a7765e','photo-1523995462485-3d171b5c8fa9']
};
function reflektorPhoto(item) {
  const original = item.imageUrl || item.image_url;
  if (typeof original === 'string' && /^https:\/\//i.test(original)) return { url: original, illustrative: false };
  const text = [item.title, item.cleanTitle, item.lead, ...(Array.isArray(item.tags) ? item.tags : [])].filter(Boolean).join(' ').toLocaleLowerCase('hu-HU');
  const patterns = [
    ['tech', /\b(ai|chatgpt|mesterséges intelligencia|informatika|technológia|robot|digitális|telefon|internet|chip|szoftver)\b/i],
    ['economy', /gazdaság|forint|infláció|tőzsde|bank|adó|árfolyam|pénzügy|vállalat|befektetés/i],
    ['politics', /politika|kormány|választás|parlament|miniszter|elnök|europa|európa|törvény|közélet/i],
    ['science', /tudomány|kutatás|űr|bolygó|egészség|orvos|klíma|környezet|felfedezés/i],
    ['sport', /sport|futball|labdarúg|olimpia|bajnok|mérkőzés|tenisz/i],
    ['culture', /kultúra|film|zene|színház|művészet|könyv|fesztivál/i]
  ];
  const category = patterns.find(([, pattern]) => pattern.test(text))?.[0] || 'general';
  const photos = REFLEKTOR_PHOTOS[category];
  const seed = String(item.id || item.title || 'reflektor');
  let hash = 0;
  for (let i=0;i<seed.length;i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return { url: `https://images.unsplash.com/${photos[Math.abs(hash) % photos.length]}?auto=format&fit=crop&w=1200&q=80`, illustrative: true };
}

window.loadYouTubePlayer = function(containerId, youtubeId) {
const container = document.getElementById(containerId);
if (!container) return;
container.innerHTML = `
<iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/${escapeHtml(youtubeId)}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
`;
};

// 🎙️ CSATORNA CSOPORTOSÍTOTT (AKORDEON) NÉZET MÉDIA ELEMEKHEZ
export function createChannelGroupHTML(channelName, items, options = {}) {
const firstItem = items[0] || {};
const channelImage = firstItem.sourceImageUrl || firstItem.source_image_url || '';
const count = items.length;
const isAudio = firstItem.isAudio || firstItem.media_type === 'podcast';
const badgeColor = isAudio ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';

const channelId = 'channel_' + Math.abs(channelName.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0));

let episodesHtml = '';
items.forEach((item, index) => {
const rawDate = item.published_at || item.publishedAt || item.pub_date || item.pubDate || item.created_at || item.date || item.time || '';
let formattedDate = '';

if (rawDate && rawDate !== 'Friss adás' && rawDate !== 'Friss') {
try {
let cleanDateStr = String(rawDate).trim();
if (cleanDateStr.includes(' ') && !cleanDateStr.includes('T')) {
cleanDateStr = cleanDateStr.replace(' ', 'T');
}
if (/[+-]\d{2}$/.test(cleanDateStr)) {
cleanDateStr += ':00';
}

const d = new Date(cleanDateStr);
if (!isNaN(d.getTime())) {
const months = ["jan.", "feb.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."];
const hours = String(d.getHours()).padStart(2, '0');
const minutes = String(d.getMinutes()).padStart(2, '0');
formattedDate = `${d.getFullYear()}. ${months[d.getMonth()]} ${d.getDate()}. ${hours}:${minutes}`;
} else {
formattedDate = rawDate;
}
} catch (e) {
formattedDate = rawDate;
}
}

const displayTitle = escapeHtml(item.cleanTitle || item.clean_title || item.title || '');
const audioUrl = item.audioUrl || item.audio_url;
const yId = item.youtubeId || item.youtube_id;
const uniquePlayerId = `yt_player_${channelId}_${index}`;
const thumbUrl = yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : '';
const episodeImage = item.imageUrl || item.image_url || '';
const searchQuery = String(options.searchQuery || '').trim();
let searchReasonHtml = '';
if (searchQuery) {
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('hu-HU');
  const q = norm(searchQuery);
  const titleText = [item.title,item.cleanTitle,item.clean_title].filter(Boolean).join(' ');
  const sourceText = item.source || item.source_name || channelName;
  const descriptionText = [item.lead,item.description,item.summary].filter(Boolean).join(' ');
  const titleHit = norm(titleText).includes(q);
  const sourceHit = norm(sourceText).includes(q);
  const descHit = norm(descriptionText).includes(q);
  const reason = titleHit ? 'Egyezés a címben' : sourceHit ? 'Egyezés a csatornanévben' : descHit ? 'Egyezés a leírásban' : '';
  if (reason) {
    let excerpt = '';
    if (descHit && !titleHit && !sourceHit) {
      const normalized = norm(descriptionText);
      const index = normalized.indexOf(q);
      const start = Math.max(0,index - 65);
      const end = Math.min(descriptionText.length,index + searchQuery.length + 95);
      excerpt = `${start ? '…' : ''}${descriptionText.slice(start,end)}${end < descriptionText.length ? '…' : ''}`;
    }
    searchReasonHtml = `<div class="media-search-reason" style="margin-top:6px;font-size:11px;line-height:1.5;color:#8b95a5"><span style="font-weight:600">${escapeHtml(reason)}</span>${excerpt ? `<div style="margin-top:3px;overflow-wrap:anywhere">${escapeHtml(excerpt)}</div>` : ''}</div>`;
  }
}
const durationText = item.duration_minutes ? `${item.duration_minutes} perc` : (item.readMinutes ? `${item.readMinutes} perc` : '45 perc');

episodesHtml += `
<div class="media-episode-card p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2.5 shadow-sm">
<div class="media-episode-top flex items-start justify-between gap-3">
${episodeImage ? `
<img src="${escapeHtml(episodeImage)}" alt="" class="w-14 h-14 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 shrink-0 shadow-sm">
` : ''}
<div class="media-episode-body flex-1 min-w-0">
<span class="text-[10px] text-neutral-400 font-medium">${formattedDate ? `${formattedDate} • ` : ''}${durationText}</span>
<h3 class="media-episode-title text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white leading-snug mt-0.5">
<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="hover:underline">${displayTitle}</a>
</h3>
${searchReasonHtml}
<button type="button" class="media-bookmark-btn media-episode-save mt-2 inline-flex items-center gap-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs font-semibold min-h-[36px] ${options.savedIds?.has(String(item.id)) ? 'text-emerald-600 border-emerald-500' : 'text-neutral-600 dark:text-neutral-300'}" data-media-id="${escapeHtml(String(item.id ?? ''))}" aria-pressed="${options.savedIds?.has(String(item.id)) ? 'true' : 'false'}" title="${options.savedIds?.has(String(item.id)) ? 'Mentés visszavonása' : 'Mentés'}" aria-label="${options.savedIds?.has(String(item.id)) ? 'Mentés visszavonása' : 'Mentés'}">${options.savedIds?.has(String(item.id)) ? '♥' : '♡'}</button>
</div>
</div>

${audioUrl ? `
<div class="media-episode-player bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg flex items-center gap-2 border border-neutral-200 dark:border-neutral-700">
<audio controls class="w-full h-8 custom-audio-player" preload="none"><source src="${escapeHtml(audioUrl)}" type="audio/mpeg"></audio>
</div>` : ''}

${yId ? `
<div id="${uniquePlayerId}" class="media-episode-player aspect-video w-full max-w-xs rounded-lg overflow-hidden bg-black border border-neutral-800 relative cursor-pointer group" onclick="window.loadYouTubePlayer('${uniquePlayerId}', '${yId}')">
<img src="${thumbUrl}" alt="${displayTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async">
<div class="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
<div class="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
<span class="text-sm font-bold ml-0.5">▶</span>
</div>
</div>
</div>` : ''}
</div>
`;
});

return `
<div class="channel-group-card p-4 border-b border-neutral-200 dark:border-neutral-850 bg-neutral-50/50 dark:bg-neutral-900/30 col-span-full">
<div class="flex items-center justify-between cursor-pointer select-none" onclick="window.toggleChannelAccordion('${channelId}')">
<div class="flex items-center gap-3">
${channelImage ? `<img src="${escapeHtml(channelImage)}" alt="" class="w-12 h-12 rounded-xl object-cover border border-neutral-300 dark:border-neutral-700 shadow-sm shrink-0" loading="lazy" decoding="async">` : `<div class="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-lg shrink-0">🎙️</div>`}
<div>
<div class="flex items-center gap-2">
<h2 class="text-sm sm:text-base font-bold text-black dark:text-white">${escapeHtml(channelName)}</h2>
<span class="text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeColor}">${count} új rész</span>
</div>
<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Kattints a részek megtekintéséhez ▾</p>
</div>
</div>
<span id="icon_${channelId}" class="text-neutral-400 font-bold transition-transform duration-200">▼</span>
</div>

<div id="${channelId}" class="hidden mt-3 space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
${episodesHtml}
</div>
</div>
`;
}

export function createArticleHTML(item, options = {}) {
const {
isRead = false,
isSaved = false,
isUpvoted = false,
isClickbaited = false,
antiClickbaitActive = true,
isCompact = false
} = options;

const isReflektor = item.isReflektor === true || (item.cat || item.category) === 'reflektor';

const cleanTitleValue = item.cleanTitle || item.clean_title;
const originalTitleValue = item.title || item.original_title || '';
const displayTitle = escapeHtml((antiClickbaitActive && cleanTitleValue) ? cleanTitleValue : originalTitleValue);
const currentSourceName = escapeHtml(item.source || item.source_name || '');

const timeDisplay = (() => {
const rawTime = item.published_at || item.publishedAt || item.pub_date || item.pubDate || item.created_at || item.date || item.time || item.timestamp;
if (!rawTime || rawTime === 'Friss adás' || rawTime === 'Ma') return rawTime === 'Ma' ? 'Ma' : '';

try {
let d;

if (typeof rawTime === 'number' || /^\d{13}$/.test(String(rawTime).trim())) {
d = new Date(Number(rawTime));
} else {
let cleanTimeStr = String(rawTime).trim();
if (cleanTimeStr.includes(' ') && !cleanTimeStr.includes('T')) {
cleanTimeStr = cleanTimeStr.replace(' ', 'T');
}
if (/[+-]\d{2}$/.test(cleanTimeStr)) {
cleanTimeStr += ':00';
}
d = new Date(cleanTimeStr);
}

if (!isNaN(d.getTime())) {
const now = new Date();
const diffMs = Math.max(0, now.getTime() - d.getTime());
const diffMinutes = Math.floor(diffMs / 60000);
const diffHours = Math.floor(diffMs / 3600000);

if (diffMinutes < 1) return 'Most';
if (diffMinutes < 60) return `${diffMinutes} perce`;
if (diffHours < 24) return `${diffHours} órája`;

const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const startArticleDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = Math.round((startToday - startArticleDay) / 86400000);

if (dayDiff === 1) return 'Tegnap';
if (dayDiff >= 2 && dayDiff <= 6) return `${dayDiff} napja`;

const months = ["jan.", "feb.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."];
return `${months[d.getMonth()]} ${d.getDate()}.`;
}
} catch(e) {}

return '';
})();

if (isReflektor) {
const photo = reflektorPhoto(item);
return `
<article class="news-item reflektor-feature ${isRead ? 'opacity-60' : ''}" data-reflektor="true" data-id="${escapeHtml(String(item.id))}">
  <div class="reflektor-feature-media cursor-pointer" onclick="window.openReaderModal('${escapeHtml(String(item.id))}')">
    <img src="${escapeHtml(photo.url)}" alt="${photo.illustrative ? 'A témához választott illusztráció' : 'A cikk borítóképe'}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='./images/reflektor-fallback.svg'">
    <span class="reflektor-feature-image-note">${photo.illustrative ? 'Illusztráció' : 'Borítókép'}</span>
  </div>
  <div class="reflektor-feature-body">
    <div class="reflektor-feature-meta"><span class="reflektor-feature-tag">✦ 4TY REFLEKTOR</span><span>${escapeHtml(item.author?.name || '4ty Reflektor')}</span>${timeDisplay ? `<span>· ${timeDisplay}</span>` : ''}</div>
    <div class="cursor-pointer" onclick="window.openReaderModal('${escapeHtml(String(item.id))}')">
      <h2 class="reflektor-feature-title">${displayTitle}</h2>
      ${item.lead ? `<p class="reflektor-feature-lead">${escapeHtml(item.lead)}</p>` : ''}
      <span class="reflektor-feature-link">Elemzés megnyitása ↗</span>
    </div>
  </div>
</article>`;
}

const itemCat = item.cat || item.category || 'gazdasag';
const meta = CATEGORY_META[itemCat] || { label: itemCat, badgeClass: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/30" };
const clickbaitHighlight = isClickbaited ? 'border-l-2 border-l-amber-500' : '';
const opinionBadge = (item.isOpinion || item.is_opinion) ? `<span class="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">🗣️ Vélemény</span>` : '';
const cardBorderStyle = 'hover:bg-neutral-50 dark:hover:bg-neutral-900/40 border-neutral-100 dark:border-neutral-900';
const articleImage = item.imageUrl || item.image_url;

// Clustering V1: a fő cikk mellett mutatjuk az ugyanahhoz az eseményhez kapcsolt forrásokat.
const relatedSources = Array.isArray(item.relatedSources)
? item.relatedSources
: (Array.isArray(item.related_sources) ? item.related_sources : []);
const uniqueRelatedSources = relatedSources.filter((rel, index, arr) => {
const relUrl = String(rel?.url || '');
const relSource = String(rel?.source || '');
if (!relUrl || !relSource) return false;
return arr.findIndex(x => String(x?.url || '') === relUrl) === index;
});
const totalSourceCount = 1 + uniqueRelatedSources.length;
const relatedSourcesHtml = uniqueRelatedSources.length > 0 ? `
<details class="mt-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50">
<summary class="cursor-pointer select-none px-2.5 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white">
📰 ${totalSourceCount} forrás ugyanerről
</summary>
<div class="px-2.5 pb-2.5 pt-0.5 space-y-1.5 border-t border-neutral-200 dark:border-neutral-800">
<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="flex items-start justify-between gap-3 text-[11px] hover:underline">
<span><strong>${currentSourceName}</strong> · fő cikk</span><span class="shrink-0">↗</span>
</a>
${uniqueRelatedSources.map(rel => `
<a href="${escapeHtml(rel.url)}" target="_blank" rel="noopener noreferrer" class="flex items-start justify-between gap-3 text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:underline">
<span><strong>${escapeHtml(rel.source)}</strong>${rel.original_title ? ` · ${escapeHtml(rel.original_title)}` : ''}</span><span class="shrink-0">↗</span>
</a>`).join('')}
</div>
</details>` : '';

return `
<article class="news-item p-4 transition-all border-b ${cardBorderStyle} ${isRead ? 'opacity-40' : ''} ${clickbaitHighlight}" data-id="${item.id}" data-url="${escapeHtml(item.url)}">
<div class="flex items-center justify-between text-xs text-neutral-500 mb-1.5 font-medium">
<div class="flex items-center gap-1.5 flex-wrap">
<span class="text-neutral-800 dark:text-neutral-300 font-bold tracking-wide">${currentSourceName}</span>
${uniqueRelatedSources.length > 0 ? `<span class="text-[10px] px-1.5 py-0.5 rounded font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25">+${uniqueRelatedSources.length} forrás</span>` : ''}
<span class="text-[10px] px-1.5 py-0.5 rounded font-medium ${meta.badgeClass}">${meta.label}</span>
${opinionBadge}${timeDisplay ? `<span>•</span><span>${timeDisplay}</span>` : ''}
</div>
<div class="flex items-center gap-2">
<span class="read-toggle cursor-pointer text-xs hover:text-black dark:hover:text-white">
⏱️ ${item.readMinutes || 3}p <span class="read-icon text-neutral-400">${isRead ? '●' : '○'}</span>
</span>
<button class="hide-this-source-btn text-neutral-400 hover:text-red-500 text-xs cursor-pointer p-0.5" data-source="${currentSourceName}" title="Forrás rejtése">✕</button>
</div>
</div>

<div class="flex gap-3.5 items-start mb-1.5">
<div class="flex-1 min-w-0">
<h2 class="article-title text-sm sm:text-base font-semibold text-black dark:text-white leading-snug cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${displayTitle}</a>
</h2>
<p class="article-lead text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2 mt-1.5 ${isCompact ? 'hidden' : ''}">
${escapeHtml(item.lead || '')}
</p>

<div id="tldr-${item.id}" class="hidden mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-neutral-850 dark:text-neutral-200 space-y-1.5">
<div class="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
<span>⚡ A 30 másodperces lényeg:</span>
</div>
<ul class="space-y-1">
${(item.bullets && item.bullets.length > 0 ? item.bullets : [item.lead])
.map(pt => `<li class="flex items-start gap-1.5"><span class="text-amber-500 font-bold shrink-0">•</span><span>${escapeHtml(pt)}</span></li>`).join('')}
</ul>
</div>
</div>
${articleImage ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="shrink-0 w-20 h-20 sm:w-24 sm:h-20 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 block shadow-sm"><img src="${escapeHtml(articleImage)}" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async"></a>` : ''}
</div>
${relatedSourcesHtml}

<div class="action-bar flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-900 mt-2">
<div class="flex items-center gap-2 flex-wrap">
<button class="upvote-btn px-2.5 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer ${isUpvoted ? 'border-emerald-500 text-emerald-500 font-semibold' : 'border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400'}">
<span>▲</span> <span class="count">${(item.upvotes || 0) + (isUpvoted ? 1 : 0)}</span>
</button>
<button type="button" class="bookmark-btn news-heart-save" aria-pressed="${isSaved ? 'true' : 'false'}" aria-label="${isSaved ? 'Mentés visszavonása' : 'Cikk mentése'}" title="${isSaved ? 'Mentés visszavonása' : 'Cikk mentése'}"><span aria-hidden="true">${isSaved ? '♥' : '♡'}</span></button>
<button class="tldr-btn px-2.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer" data-id="${item.id}">
<span>⚡ Lényeg</span>
</button>
<button class="share-btn px-2.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1 cursor-pointer" data-title="${displayTitle}" data-url="${escapeHtml(item.url)}">
<span>🔗</span> <span class="hidden sm:inline">Megosztás</span>
</button>
</div>
<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="external-link text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white font-medium shrink-0 ml-1">Megnyitás ↗</a>
</div>
</article>
`;
}