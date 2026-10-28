// js/app.js - 4ty.hu Fő Alkalmazás Orchestrator (v49.7 - hivatalos videók forrásalapú szűrése)
import { CONFIG, DEFAULT_SECTION_ORDER, CATEGORY_META } from '4ty/config';
import {
fetchArticlesFromDb,
fetchArticlesBySourceIds,
fetchSourcesFromDb,
fetchReflektorPostsFromDb,
fetchMediaFromDb,
sendUpvoteToDb,
fetchUserSubscriptions,
followCommunitySourceInDb,
unfollowCommunitySourceInDb
} from '4ty/api';
import { ensureAnonymousSession } from '4ty/auth';
import {
loadUserProfile,
saveUserProfile,
isArticleBlocked,
calculatePersonalScore,
recordInteraction,
applyAiCuratorConfig
} from '4ty/curator';
import { submitCommunitySource, fetchCommunitySources } from '4ty/submitter';
import { createArticleHTML, createChannelGroupHTML } from '4ty/renderer';
import { renderSettingsView, syncAllMuteButtons } from '4ty/settings';

function escapeHtml(str) {
if (!str) return '';
const div = document.createElement('div');
div.textContent = str;
return div.innerHTML;
}

// A felhasználóazonosító kizárólag az ellenőrzött Supabase Auth munkamenetből származhat.
let currentUserUuid = null;
export async function getOrCreateUserUuid() {
  const user = await ensureAnonymousSession();
  return user.id;
}

let userProfile = loadUserProfile();
let sectionOrder;
try {
  const savedOrder = JSON.parse(localStorage.getItem('4ty_section_order') || 'null');
  const validSaved = Array.isArray(savedOrder) ? savedOrder.filter(key => DEFAULT_SECTION_ORDER.includes(key)) : [];
  sectionOrder = [...new Set([...validSaved, ...DEFAULT_SECTION_ORDER])];
} catch (_) {
  sectionOrder = [...DEFAULT_SECTION_ORDER];
}

let sourcesCatalog = [];
let reflektorArticles = [];
let dbMediaItems = [];
let communitySourcesCache = [];
let userSubscriptions = new Set(); // 👈 Felhasználó által követett forrás ID-k
let articlesData = JSON.parse(localStorage.getItem('4ty_cached_articles') || '[]');
let newsSearchQuery = '';
let mediaSearchQuery = '';
// Egységes keresési normalizálás: az ékezetek és a kis-/nagybetűk nem számítanak.
const normalizeSearchText = value => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/ł/g, 'l').replace(/Ł/g, 'L')
  .toLocaleLowerCase('hu-HU');

// Az utoljára megnyitott nézet visszaállítása frissítés után.
const savedPillar = localStorage.getItem('4ty_current_pillar');
let currentPillar = ['news', 'video'].includes(savedPillar) ? savedPillar : 'news';
let currentNewsCategory = localStorage.getItem('4ty_current_news_category') || 'all';
let currentVideoCategory = localStorage.getItem('4ty_current_video_category') || 'video';
let currentSortMode = 'chrono';
let antiClickbaitActive = JSON.parse(localStorage.getItem('4ty_anti_clickbait') || 'true');
let showShortsActive = JSON.parse(localStorage.getItem('4ty_show_shorts') || 'false');
let hideReadActive = JSON.parse(localStorage.getItem('4ty_hide_read') || 'false');

let hiddenSources = JSON.parse(localStorage.getItem('4ty_hidden_sources') || '[]');
let readArticles = new Set(JSON.parse(localStorage.getItem('4ty_read') || '[]'));
let savedArticles = new Set(JSON.parse(localStorage.getItem('4ty_saved') || '[]'));
let upvotedItems = new Set(JSON.parse(localStorage.getItem('4ty_upvoted') || '[]'));
let clickbaitedItems = new Set(JSON.parse(localStorage.getItem('4ty_clickbaited') || '[]'));

export function saveState() {
try {
localStorage.setItem('4ty_hidden_sources', JSON.stringify(hiddenSources));
localStorage.setItem('4ty_read', JSON.stringify(Array.from(readArticles)));
localStorage.setItem('4ty_saved', JSON.stringify(Array.from(savedArticles)));
localStorage.setItem('4ty_upvoted', JSON.stringify(Array.from(upvotedItems)));
localStorage.setItem('4ty_clickbaited', JSON.stringify(Array.from(clickbaitedItems)));
localStorage.setItem('4ty_section_order', JSON.stringify(sectionOrder));
localStorage.setItem('4ty_anti_clickbait', JSON.stringify(antiClickbaitActive));
localStorage.setItem('4ty_show_shorts', JSON.stringify(showShortsActive));
localStorage.setItem('4ty_hide_read', JSON.stringify(hideReadActive));
} catch (e) {}
}

export function showToast(msg) {
const toast = document.getElementById('toastNotification');
if (!toast) return;
toast.innerText = msg;
toast.classList.remove('hidden');
setTimeout(() => toast.classList.add('hidden'), 2500);
}

export function toggleControlDrawer() {
const drawer = document.getElementById('controlDrawer');
if (drawer) drawer.classList.toggle('hidden');
}

export function openSettingsModal() {
if (window.matchMedia('(min-width: 1024px)').matches) closeSavedLibrary();
const modal = document.getElementById('settingsModal');
if (modal) {
modal.classList.remove('hidden');
renderSettingsView({
userProfile,
sectionOrder,
saveStateCallback: saveState,
renderFeedCallback: renderFeed,
showToastCallback: showToast,
isSourceHiddenFn: isSourceHidden,
toggleSourceBlockFn: toggleSourceBlock,
enableSourceLocallyFn: enableSourceLocally
});
}
}

// Az asztali Beállítások önálló nézetként is nyitható, ezért külön frissítő szükséges.
window.__4tyRefreshSettings = () => renderSettingsView({
  userProfile,
  sectionOrder,
  saveStateCallback: saveState,
  renderFeedCallback: renderFeed,
  showToastCallback: showToast,
  isSourceHiddenFn: isSourceHidden,
  toggleSourceBlockFn: toggleSourceBlock,
  enableSourceLocallyFn: enableSourceLocally
});

export function closeSettingsModal() {
const modal = document.getElementById('settingsModal');
if (modal) modal.classList.add('hidden');
}

export function openReaderModal(id) {
const item = reflektorArticles.find(a => String(a.id) === String(id));
if (!item) return;

const modal = document.getElementById('readerModal');
const content = document.getElementById('readerContent');
if (!modal || !content) return;

recordInteraction(item, 'read');

content.innerHTML = `
<h1 class="text-2xl font-bold mb-3 text-black dark:text-white leading-snug">${escapeHtml(item.title)}</h1>
<div class="text-xs text-neutral-500 mb-6 flex items-center gap-2">
<span class="font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">${escapeHtml(item.author?.name || '4ty Reflektor')}</span>
<span>•</span>
<span>${escapeHtml(item.time || 'Kiemelt')}</span>
</div>
<div class="article-body text-sm sm:text-base leading-relaxed space-y-4 text-neutral-800 dark:text-neutral-200">
${item.content || item.lead || 'Nincs szövegtörzs.'}
</div>
`;
modal.classList.remove('hidden');
}

export function closeReaderModal() {
const modal = document.getElementById('readerModal');
if (modal) modal.classList.add('hidden');
}

export function openCustomConfirm(message) {
return new Promise((resolve) => {
const modal = document.getElementById('confirmModal');
const text = document.getElementById('confirmModalText');
const okBtn = document.getElementById('confirmOkBtn');
const cancelBtn = document.getElementById('confirmCancelBtn');

if (!modal || !text || !okBtn || !cancelBtn) {
resolve(confirm(message));
return;
}

text.innerText = message;
modal.classList.remove('hidden');

const handleOk = () => { cleanup(); resolve(true); };
const handleCancel = () => { cleanup(); resolve(false); };
const cleanup = () => {
modal.classList.add('hidden');
okBtn.removeEventListener('click', handleOk);
cancelBtn.removeEventListener('click', handleCancel);
};

okBtn.addEventListener('click', handleOk);
cancelBtn.addEventListener('click', handleCancel);
});
}

export function resetAllSettings() {
if (confirm("Biztosan visszaállítasz minden beállítást az alapértelmezettre?")) {
// Csak a 4ty beállításait töröljük, a Supabase Auth munkamenetét nem.
for (const key of Object.keys(localStorage)) {
  if (key.startsWith('4ty_')) localStorage.removeItem(key);
}
window.location.reload();
}
}

// 📥 Fiók és beállítások exportálása JSON fájlba
export async function exportUserAccountBackup() {
const backupData = {
version: '1.0',
exportedAt: new Date().toISOString(),
// A mentés csak helyi beállításokat tartalmaz; Auth-identitást nem.
settings: {
sectionOrder,
antiClickbaitActive,
showShortsActive,
hideReadActive,
hiddenSources,
userProfile
},
savedArticles: Array.from(savedArticles),
readArticles: Array.from(readArticles)
};

const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `4ty-backup-${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
showToast("📥 Biztonsági mentés sikeresen letöltve!");
}

// 📤 Fiók visszaállítása JSON fájlból
export async function importUserAccountBackup(event) {
const file = event.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = async (e) => {
try {
const data = JSON.parse(e.target.result);
if (!data || typeof data.settings !== 'object' || data.settings === null) {
throw new Error("Érvénytelen mentési fájl formátum.");
}

// Importáláskor soha nem írjuk felül a Supabase Auth-identitást.
localStorage.setItem('4ty_section_order', JSON.stringify(data.settings.sectionOrder || []));
localStorage.setItem('4ty_anti_clickbait', JSON.stringify(data.settings.antiClickbaitActive ?? true));
localStorage.setItem('4ty_show_shorts', JSON.stringify(data.settings.showShortsActive ?? false));
localStorage.setItem('4ty_hide_read', JSON.stringify(data.settings.hideReadActive ?? false));
localStorage.setItem('4ty_hidden_sources', JSON.stringify(data.settings.hiddenSources || []));
localStorage.setItem('4ty_saved', JSON.stringify(data.savedArticles || []));
localStorage.setItem('4ty_read', JSON.stringify(data.readArticles || []));

if (data.settings.userProfile) {
saveUserProfile(data.settings.userProfile);
}

showToast("✨ Helyi beállítások visszaállítva! Újratöltés...");
setTimeout(() => window.location.reload(), 1500);
} catch (err) {
showToast("Hiba: " + (err.message || "Nem olvasható a fájl."));
}
};
reader.readAsText(file);
}


// Önálló Mentett tartalmak nézet – nem módosítja a Hírek/Média állapotát.
let savedLibraryTab = 'all';
let savedLibraryQuery = '';
let savedLibraryRedraw = null;
function normalizeSavedSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hu-HU');
}
function refreshSavedSearchField() {
  const field = document.getElementById('newsSearchInput');
  const clear = document.getElementById('newsSearchClearBtn');
  if (!field) return;
  if (document.body.classList.contains('saved-library-open')) {
    field.placeholder = 'Keresés a mentett tartalmak között…';
    field.value = savedLibraryQuery;
    clear?.classList.toggle('hidden', !savedLibraryQuery);
  } else {
    field.placeholder = currentPillar === 'video' ? 'Keresés a tartalmak között…' : 'Keresés a hírek között…';
    field.value = currentPillar === 'video' ? mediaSearchQuery : newsSearchQuery;
    clear?.classList.toggle('hidden', !field.value);
  }
}
export function closeSavedLibrary() {
  document.getElementById('savedLibraryView')?.remove();
  document.body.classList.remove('saved-library-open');
  document.getElementById('newsFeed')?.classList.remove('hidden');
  savedLibraryRedraw = null;
  refreshSavedSearchField();
}
export function openSavedLibrary(tab = 'all') {
  // A Mentett oldal a Beállítások nézettel kölcsönösen kizáró állapot.
  if (window.matchMedia('(min-width: 1024px)').matches) {
    document.body.classList.remove('desktop-settings-page');
    document.getElementById('settingsModal')?.classList.add('hidden');
  }
  savedLibraryTab = ['all', 'news', 'media'].includes(tab) ? tab : 'all';
  closeSettingsModal();
  closeSavedLibrary();
  const view = document.createElement('section');
  view.id = 'savedLibraryView';
  view.setAttribute('aria-label', 'Mentett tartalmak');
  view.className = 'saved-library-view';
  view.innerHTML = `<div class="saved-library-shell"><header class="saved-library-header"><div class="saved-library-kicker">SAJÁT GYŰJTEMÉNY</div><div class="saved-library-heading"><span class="saved-library-mark" aria-hidden="true">✦</span><div><h1>Mentett tartalmak</h1><p>Azok a hírek, videók és podcastok, amelyeket későbbre eltettél.</p></div></div><div id="savedLibrarySummary" class="saved-library-summary" aria-live="polite"></div></header><div class="saved-library-toolbar"><div id="savedLibraryTabs" class="saved-library-tabs" role="group" aria-label="Mentett tartalmak szűrése"></div><span id="savedLibraryShown" class="saved-library-shown"></span></div><div id="savedLibraryItems" class="saved-library-items"></div></div>`;
  const feed = document.getElementById('newsFeed');
  if (!feed) return;
  feed.classList.add('hidden');
  feed.parentNode.insertBefore(view, feed);
  document.body.classList.add('saved-library-open');
  savedLibraryQuery = '';
  refreshSavedSearchField();
  // 4ty 63: mobilon saját, jól elérhető kereső a Mentett oldalon.
  const mobileSearch = document.createElement('div');
  mobileSearch.className = 'saved-library-mobile-search';
  mobileSearch.innerHTML = '<label for="savedMobileSearch">Keresés a mentettek között</label><div class="saved-library-mobile-search-row"><span aria-hidden="true">⌕</span><input id="savedMobileSearch" type="search" autocomplete="off" placeholder="Hírek, podcastok, videók…" aria-label="Keresés a mentett tartalmak között"><button type="button" aria-label="Keresés törlése" hidden>×</button></div>';
  view.querySelector('.saved-library-header')?.appendChild(mobileSearch);
  const mobileSearchInput = mobileSearch.querySelector('input');
  const mobileSearchClear = mobileSearch.querySelector('button');
  mobileSearchInput.addEventListener('input', () => {
    savedLibraryQuery = mobileSearchInput.value;
    mobileSearchClear.hidden = !savedLibraryQuery;
    refreshSavedSearchField();
    savedLibraryRedraw?.();
  });
  mobileSearchClear.addEventListener('click', () => {
    mobileSearchInput.value = '';
    mobileSearchInput.dispatchEvent(new Event('input', {bubbles:true}));
    mobileSearchInput.focus();
  });
  const tabs = view.querySelector('#savedLibraryTabs');
  const items = view.querySelector('#savedLibraryItems');
  const redraw = () => {
    const options = [['all','Összes'],['news','Hírek'],['media','Média']];
    tabs.replaceChildren();
    for (const [key,label] of options) {
      const btn = document.createElement('button');btn.type='button';btn.textContent=label;
      btn.className = 'saved-library-tab' + (savedLibraryTab===key ? ' is-active' : '');
      btn.setAttribute('aria-pressed',String(savedLibraryTab===key));
      btn.onclick=()=>{savedLibraryTab=key;redraw()};tabs.appendChild(btn);
    }
    const news = [...reflektorArticles.map(a => ({...a, isReflektor:true, cat:'reflektor'})), ...articlesData]
      .filter(a => a?.id != null && savedArticles.has(String(a.id)));
    const media = dbMediaItems.filter(a => a?.id != null && savedArticles.has(String(a.id)));
    const newsUnique = new Map(news.map(a => [String(a.id), a]));
    const mediaUnique = new Map(media.map(a => [String(a.id), a]));
    const showNews = savedLibraryTab !== 'media';
    const showMedia = savedLibraryTab !== 'news';
    const newsCount = newsUnique.size;
    const mediaCount = mediaUnique.size;
    const query = normalizeSavedSearch(savedLibraryQuery.trim());
    const matches = a => !query || normalizeSavedSearch([
      a.title, a.original_title, a.cleanTitle, a.clean_title,
      a.source, a.source_name, a.description, a.summary
    ].filter(Boolean).join(' ')).includes(query);
    const visibleNews = [...newsUnique.values()].filter(matches);
    const visibleMedia = [...mediaUnique.values()].filter(matches);
    const shownCount = (showNews ? visibleNews.length : 0) + (showMedia ? visibleMedia.length : 0);
    const summary = view.querySelector('#savedLibrarySummary');
    if (summary) summary.textContent = `${newsCount + mediaCount} mentett tartalom · ${newsCount} hír · ${mediaCount} média`;
    const shown = view.querySelector('#savedLibraryShown');
    if (shown) shown.textContent = `${shownCount} találat`;
    items.replaceChildren();
    if (shownCount === 0) {
      const empty = document.createElement('div');
      empty.className = 'saved-library-empty saved-library-empty-modern';
      const symbol = document.createElement('span');symbol.className='saved-library-empty-symbol';symbol.textContent='✧';symbol.setAttribute('aria-hidden','true');
      const title = document.createElement('h2');title.textContent = query ? 'Nincs ilyen mentett tartalom' : savedLibraryTab === 'news' ? 'Még nincs mentett híred' : savedLibraryTab === 'media' ? 'Még nincs mentett médiád' : 'Itt kezdődik a gyűjteményed';
      const hint = document.createElement('p');hint.textContent=query ? 'Próbálj másik keresőkifejezést, vagy töröld a keresést.' : 'A Hírek és a Média oldalán elmentett tartalmak itt fognak megjelenni.';
      empty.append(symbol,title,hint);
      items.appendChild(empty);
      return;
    }
    if (showNews && visibleNews.length) {
      const grid = document.createElement('div');
      grid.className = 'saved-library-news-grid grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:gap-px md:bg-neutral-200 md:dark:bg-neutral-800';
      for (const a of visibleNews) {
        const id = String(a.id);
        // A Mentett nézetben a Reflektor-cikk is normál, kis képes hírkártya.
        // Csak a megjelenítéshez használt másolaton írjuk felül a kiemelt típust.
        const cardItem = (a.isReflektor === true || (a.cat || a.category) === 'reflektor')
          ? { ...a, isReflektor: false, cat: 'egyeb', category: 'egyeb' }
          : a;
        grid.insertAdjacentHTML('beforeend', createArticleHTML(cardItem, {
          isRead: readArticles.has(id), isSaved: true,
          isUpvoted: upvotedItems.has(id), isClickbaited: clickbaitedItems.has(id),
          antiClickbaitActive
        }));
      }
      items.appendChild(grid);
    }
    if (showMedia && visibleMedia.length) {
      const groups = new Map();
      for (const a of visibleMedia) {
        const name = a.source || a.source_name || 'Ismeretlen csatorna';
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(a);
      }
      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'saved-library-media-groups divide-y divide-neutral-200 dark:divide-neutral-800';
      for (const [name, group] of groups) {
        const holder = document.createElement('div');
        holder.innerHTML = createChannelGroupHTML(name, group, { savedIds: savedArticles });
        const channel = holder.firstElementChild;
        const savedCountBadge = channel?.querySelector('h2 + span');
        if (savedCountBadge) savedCountBadge.textContent = `${group.length} ${query ? 'találat' : 'rész'}`;
        // A Mentett oldalon keresési találatnál ugyanúgy nyissuk le a csatornát,
        // mint a Média keresőjében. Keresés nélkül marad az eredeti viselkedés.
        if (channel && query && window.matchMedia('(min-width: 768px)').matches) {
          const details = channel.querySelector('[id^="channel_"]');
          if (details) details.classList.remove('hidden');
          const arrow = channel.querySelector('[id^="icon_channel_"]');
          if (arrow) arrow.classList.add('rotate-180');
        }
        while (holder.firstChild) mediaWrap.appendChild(holder.firstChild);
      }
      items.appendChild(mediaWrap);
    }
    attachCardEventListeners(items, redraw);

  };
  savedLibraryRedraw = redraw;
  redraw();
}

export function openSavedContent(pillar) {
 const target = pillar === 'video' ? 'video' : 'news';
 if (target === 'video') {
   currentVideoCategory = 'saved';
   localStorage.setItem('4ty_current_video_category', 'saved');
 } else {
   currentNewsCategory = 'saved';
   localStorage.setItem('4ty_current_news_category', 'saved');
 }
 switchPillar(target);
 // A kiválasztott kategóriát és pillért is megjelenítjük.
 document.querySelectorAll(target === 'video' ? '.vcat-pill' : '.cat-pill').forEach(btn => {
   const active = (target === 'video' ? btn.dataset.vcat : btn.dataset.cat) === 'saved';
   btn.classList.toggle('font-semibold', active);
 });
}

function getFirstOrderedMediaCategory() {
  try {
    const order = JSON.parse(localStorage.getItem('4ty_desktop_media_tab_order') || '[]');
    if (Array.isArray(order)) {
      const valid = order.find(key => typeof key === 'string' &&
        document.querySelector(`#videoSubNav .vcat-pill[data-vcat="${key}"]`));
      if (valid) return valid;
    }
  } catch (_) {}
  return document.querySelector('#videoSubNav .vcat-pill[data-vcat]')?.dataset.vcat || 'video';
}

function getFirstOrderedNewsCategory() {
  const nav = document.getElementById('newsSubNav');
  if (!nav) return 'all';
  const tabs = [...nav.querySelectorAll('.cat-pill[data-cat]')];
  try {
    const saved = JSON.parse(localStorage.getItem('4ty_desktop_news_tab_order') || '[]');
    if (Array.isArray(saved)) {
      const found = saved.find(key => tabs.some(tab => tab.dataset.cat === key));
      if (found) return found;
    }
  } catch (_) {}
  return tabs[0]?.dataset.cat || 'all';
}

export function switchPillar(pillar) {
// Asztali Hírek: a mentett sorrend első kategóriája a kezdőnézet.
if (pillar === 'news' && window.matchMedia('(min-width: 1024px)').matches) {
  const first = getFirstOrderedNewsCategory();
  const target = document.querySelector(`#newsSubNav .cat-pill[data-cat="${first}"]`);
  if (target) {
    currentNewsCategory = first;
    currentSortMode = 'chrono';
    localStorage.setItem('4ty_current_news_category', first);
    document.querySelectorAll('#newsSubNav .cat-pill[data-cat]').forEach(btn => {
      btn.className = btn === target
        ? 'cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
        : 'cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800';
    });
  }
}
// Asztali Média: minden belépéskor a mentett sorrend első eleme az alapnézet.
if (pillar === 'video' && window.matchMedia('(min-width: 1024px)').matches) {
  const first = getFirstOrderedMediaCategory();
  if (first && document.querySelector(`#videoSubNav .vcat-pill[data-vcat="${first}"]`)) {
    currentVideoCategory = first;
    localStorage.setItem('4ty_current_video_category', first);
    document.querySelectorAll('#videoSubNav .vcat-pill').forEach(b => {
      const active = b.dataset.vcat === first;
      b.className = active
        ? 'vcat-pill shrink-0 px-2.5 py-1 rounded font-semibold border transition-colors bg-[#B82928] text-white border-[#B82928]'
        : 'vcat-pill shrink-0 px-2.5 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800';
    });
  }
}
currentPillar = pillar === 'video' ? 'video' : 'news';
localStorage.setItem('4ty_current_pillar', currentPillar);
const searchField = document.getElementById('newsSearchInput');
if (searchField) searchField.placeholder = currentPillar === 'video' ? 'Keresés a tartalmak között…' : 'Keresés a hírek között…';
const pillarNewsBtn = document.getElementById('pillarNewsBtn');
const pillarVideoBtn = document.getElementById('pillarVideoBtn');
const newsSubNav = document.getElementById('newsSubNav');
const videoSubNav = document.getElementById('videoSubNav');

if (pillar === 'video') {
if (pillarVideoBtn) pillarVideoBtn.className = 'py-2 rounded text-center transition-all bg-[#B82928] text-white shadow-sm flex items-center justify-center gap-2 font-bold cursor-pointer';
if (pillarNewsBtn) pillarNewsBtn.className = 'py-2 rounded text-center transition-all text-neutral-500 hover:text-black dark:hover:text-white flex items-center justify-center gap-2 cursor-pointer';
if (videoSubNav) videoSubNav.classList.remove('hidden');
if (newsSubNav) newsSubNav.classList.add('hidden');
} else {
if (pillarNewsBtn) pillarNewsBtn.className = 'py-2 rounded text-center transition-all bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm flex items-center justify-center gap-2 font-bold cursor-pointer';
if (pillarVideoBtn) pillarVideoBtn.className = 'py-2 rounded text-center transition-all text-neutral-500 hover:text-black dark:hover:text-white flex items-center justify-center gap-2 cursor-pointer';
if (newsSubNav) newsSubNav.classList.remove('hidden');
if (videoSubNav) videoSubNav.classList.add('hidden');
}

renderFeed();
}

function cleanArticleUrl(urlStr) {
if (!urlStr) return '';
try {
const u = new URL(urlStr);
if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
return urlStr.toLowerCase().split('#')[0].replace(/\/+$/, '');
}
return (u.origin + u.pathname).toLowerCase().replace(/\/+$/, '');
} catch (_) {
return urlStr.split('#')[0].toLowerCase().replace(/\/+$/, '');
}
}

function normalizeTitleForDedup(titleStr) {
if (!titleStr) return '';
return titleStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'„”]/g, " ").replace(/\s+/g, " ").trim();
}

function deduplicateArticles(items) {
if (!items || items.length === 0) return [];
const seenUrls = new Set();
const seenTitles = new Set();
const result = [];

for (const item of items) {
const cleanUrl = cleanArticleUrl(item.url || '');
const origTitle = normalizeTitleForDedup(item.title || item.original_title || '');
const cleanTitle = normalizeTitleForDedup(item.cleanTitle || item.clean_title || '');

if (cleanUrl && seenUrls.has(cleanUrl)) continue;
if (origTitle && seenTitles.has(origTitle)) continue;
if (cleanTitle && seenTitles.has(cleanTitle)) continue;

if (cleanUrl) seenUrls.add(cleanUrl);
if (origTitle) seenTitles.add(origTitle);
if (cleanTitle) seenTitles.add(cleanTitle);

result.push(item);
}
return result;
}

function applySourceDiversification(items) {
if (!items || items.length <= 2) return items;
const result = [];
const backlog = [...items];

while (backlog.length > 0) {
let candidateIndex = -1;
const len = result.length;
const lastSource = len >= 1 ? (result[len - 1].source || result[len - 1].source_name) : null;
const secondLastSource = len >= 2 ? (result[len - 2].source || result[len - 2].source_name) : null;

if (lastSource && lastSource === secondLastSource) {
for (let i = 0; i < backlog.length; i++) {
const curSource = backlog[i].source || backlog[i].source_name;
if (curSource !== lastSource) { candidateIndex = i; break; }
}
}
if (candidateIndex === -1) candidateIndex = 0;
result.push(backlog.splice(candidateIndex, 1)[0]);
}
return result;
}

function isSourceHidden(sourceName) {
if (!sourceName) return false;
const target = sourceName.trim().toUpperCase();
return hiddenSources.some(h => h.trim().toUpperCase() === target);
}

function enableSourceLocally(sourceName) {
if (!sourceName) return;
const target = sourceName.trim().toUpperCase();
const idx = hiddenSources.findIndex(h => h.trim().toUpperCase() === target);
if (idx !== -1) {
hiddenSources.splice(idx, 1);
saveState();
}
}

function toggleSourceBlock(sourceName) {
if (!sourceName) return;
const target = sourceName.trim().toUpperCase();
const idx = hiddenSources.findIndex(h => h.trim().toUpperCase() === target);

if (idx !== -1) {
hiddenSources.splice(idx, 1);
showToast(`"${escapeHtml(sourceName)}" forrás újra engedélyezve!`);
} else {
hiddenSources.push(target);
showToast(`"${escapeHtml(sourceName)}" lap elrejtve.`);
}

saveState();
renderSettingsView({
userProfile,
sectionOrder,
saveStateCallback: saveState,
renderFeedCallback: renderFeed,
showToastCallback: showToast,
isSourceHiddenFn: isSourceHidden,
toggleSourceBlockFn: toggleSourceBlock,
enableSourceLocallyFn: enableSourceLocally
});
renderFeed();
}

function toggleCategoryMute(catKey, label) {
if (!userProfile.mute_categories) userProfile.mute_categories = [];
const idx = userProfile.mute_categories.indexOf(catKey);
if (idx > -1) {
userProfile.mute_categories.splice(idx, 1);
showToast(`${label} visszakapcsolva!`);
} else {
userProfile.mute_categories.push(catKey);
showToast(`${label} elrejtve!`);
}
saveUserProfile(userProfile);
syncAllMuteButtons(userProfile);
window.dispatchEvent(new CustomEvent('4ty:muted-categories-changed', {detail:{muted:[...userProfile.mute_categories]}}));
renderFeed();
}

export async function loadAndRefreshFeedData() {
try {
const results = await Promise.allSettled([
fetchArticlesFromDb(),
fetchSourcesFromDb(),
fetchReflektorPostsFromDb(),
fetchMediaFromDb(),
fetchCommunitySources(),
fetchUserSubscriptions()
]);

let mainArticles = [];
if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
mainArticles = results[0].value;
}
if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
sourcesCatalog = results[1].value;
}
if (results[2].status === 'fulfilled' && results[2].value) {
reflektorArticles = results[2].value;
}
if (results[3].status === 'fulfilled' && results[3].value) {
dbMediaItems = results[3].value;
}
if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
communitySourcesCache = results[4].value;
}

let subscribedIds = [];
if (results[5].status === 'fulfilled' && Array.isArray(results[5].value)) {
subscribedIds = results[5].value;
userSubscriptions = new Set(subscribedIds);
}

// A globális top 150 mellé mindig behúzzuk a követett források legfrissebb cikkeit.
const followedArticles = subscribedIds.length
? await fetchArticlesBySourceIds(subscribedIds, 10)
: [];

const merged = new Map();
for (const article of [...mainArticles, ...followedArticles]) {
const key = article?.id || article?.url;
if (key && !merged.has(key)) merged.set(key, article);
}
articlesData = [...merged.values()].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

// A cache továbbra is korlátozott marad; nem növeljük kontrollálatlanul a localStorage méretét.
localStorage.setItem('4ty_cached_articles', JSON.stringify(articlesData.slice(0, 200)));

renderFeed();
} catch (err) {
console.warn("Frissítési hiba:", err);
throw err;
}
}

export function renderFeed() {
const feedContainer = document.getElementById('newsFeed');
if (!feedContainer) return;
feedContainer.innerHTML = '';
const searchField = document.getElementById('newsSearchInput');
if (searchField && window.matchMedia('(min-width: 768px)').matches) {
  const nextMode = currentPillar === 'video' ? 'media' : 'news';
  if (searchField.dataset.searchMode !== nextMode) {
    searchField.dataset.searchMode = nextMode;
    searchField.value = nextMode === 'media' ? mediaSearchQuery : newsSearchQuery;
    document.getElementById('newsSearchClearBtn')?.classList.toggle('hidden', !searchField.value);
  }
}
let visibleCount = 0;

if (currentPillar === 'video') {
if (currentVideoCategory === 'media_hub') {
renderMediaHubView(feedContainer);
return;
}

// A kategóriánkénti hivatalos/közösségi szűrés lentebb történik.
let activeList = [...dbMediaItems].filter(item =>
!isSourceHidden(item.source || item.source_name)
);

if (!showShortsActive) {
activeList = activeList.filter(item => !((item.url || '').toLowerCase()).includes('/shorts/'));
}

// A csatorna státuszát a sources_catalog határozza meg, nem a videó régi jelölése.
// A közösségi katalógus külön lekérésből is rendelkezésre áll.
const sourceById = new Map(
  [...sourcesCatalog, ...communitySourcesCache]
    .filter(src => src && src.id != null)
    .map(src => [String(src.id), src])
);
const getSource = (item) => item.source_id != null
  ? sourceById.get(String(item.source_id))
  : null;
const isComm = (item) => {
  const src = getSource(item);
  return src ? src.is_community === true : (item.is_community === true || item.isCommunity === true);
};
const isOfficial = (item) => {
  const src = getSource(item);
  return !!src && src.is_community === false;
};
const isVid = (item) => item.isVideo === true || !!item.youtubeId || item.media_type === 'video';
const isAud = (item) => item.isAudio === true || item.media_type === 'podcast';

// Asztali keresésnél a teljes médiakészletet vizsgáljuk,
// nem csak a kijelölt Videók / Podcastok alkategóriát.
const globalMediaSearch = window.matchMedia('(min-width: 768px)').matches && !!mediaSearchQuery.trim();
if (globalMediaSearch) {
  // A rejtett források és a Shorts beállítás szűrése már korábban megtörtént.
} else if (currentVideoCategory === 'saved') {
activeList = activeList.filter(item => savedArticles.has(item.id.toString()));
} else if (currentVideoCategory === 'my_videos') {
activeList = activeList.filter(item => isVid(item) && (item.submitted_by === currentUserUuid || (item.source_id != null && userSubscriptions.has(String(item.source_id)))));
} else if (currentVideoCategory === 'my_podcasts') {
activeList = activeList.filter(item => isAud(item) && (item.submitted_by === currentUserUuid || (item.source_id != null && userSubscriptions.has(String(item.source_id)))));
} else if (currentVideoCategory === 'podcast') {
// Csak a katalógusban hivatalosként nyilvántartott csatornák podcastjai.
activeList = activeList.filter(item => isAud(item) && isOfficial(item));
} else if (currentVideoCategory === 'video') {
// Csak a katalógusban hivatalosként nyilvántartott csatornák videói.
activeList = activeList.filter(item => isVid(item) && isOfficial(item));
}


activeList = deduplicateArticles(activeList);
activeList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

// A jobb oldali áttekintő független a kereséstől és az aktuális médiafültől.
// A követett és saját források előnyt élveznek; üres lista esetén friss általános tartalom.
const overviewCandidates = deduplicateArticles([...dbMediaItems].filter(item =>
  !isSourceHidden(item.source || item.source_name) &&
  (showShortsActive || !((item.url || '').toLowerCase()).includes('/shorts/'))
));
const personalCandidates = overviewCandidates.filter(item => {
  const id = item.source_id != null ? String(item.source_id) : '';
  return (id && userSubscriptions.has(id)) ||
    (!!currentUserUuid && item.submitted_by === currentUserUuid);
});
const overviewItems = personalCandidates.length ? personalCandidates : overviewCandidates;
window.__4tyMediaOverviewPersonal = personalCandidates.length > 0;
window.__4tyMediaOverviewPool = overviewItems.map(item => ({
  id: item.id, title: item.title, url: item.url || item.spotifyUrl || item.audioUrl ||
    (item.youtubeId ? `https://www.youtube.com/watch?v=${encodeURIComponent(item.youtubeId)}` : ''),
  source: item.source || item.source_name || '',
  timestamp: Number(item.timestamp) || 0
}));
window.dispatchEvent(new Event('4ty:media-overview-updated'));

// Keresési relevancia: cím > csatorna > leírás. Csak megjelenítési sorrend.
function mediaSearchRank(item, query) {
  const title = normalizeSearchText([item.title, item.cleanTitle, item.clean_title].filter(Boolean).join(' '));
  const channel = normalizeSearchText([item.source, item.source_name].filter(Boolean).join(' '));
  const description = normalizeSearchText([item.lead, item.description, item.summary].filter(Boolean).join(' '));
  if (title.includes(query)) return 0;
  if (channel.includes(query)) return 1;
  if (description.includes(query)) return 2;
  return 3;
}

// Asztali médiakeresés a már letöltött videók és podcastok között.
// A mobilos keresési működés változatlan marad.
if (window.matchMedia('(min-width: 768px)').matches && mediaSearchQuery.trim()) {
  const query = normalizeSearchText(mediaSearchQuery.trim());
  activeList = activeList.filter(item => mediaSearchRank(item, query) < 3)
    .sort((a, b) => mediaSearchRank(a, query) - mediaSearchRank(b, query));
}


const groupedChannels = {};
activeList.forEach(item => {
const srcName = item.source || item.source_name || 'Ismeretlen csatorna';
if (!groupedChannels[srcName]) {
groupedChannels[srcName] = [];
}
groupedChannels[srcName].push(item);
});

const scrollContainer = document.createElement('div');
scrollContainer.className = "max-h-[85vh] overflow-y-auto pr-1 divide-y divide-neutral-200 dark:divide-neutral-800";

// A csatornákat fokozatosan jelenítjük meg, de az összes letöltött elem elérhető marad.
const channelEntries = Object.entries(groupedChannels);
if (window.matchMedia('(min-width: 768px)').matches && mediaSearchQuery.trim()) {
  const query = normalizeSearchText(mediaSearchQuery.trim());
  channelEntries.sort((a,b) => Math.min(...a[1].map(x=>mediaSearchRank(x,query))) - Math.min(...b[1].map(x=>mediaSearchRank(x,query))));
}
const MEDIA_CHANNEL_BATCH = 8;
let renderedChannels = 0;
const renderNextMediaChannels = () => {
  const next = channelEntries.slice(renderedChannels, renderedChannels + MEDIA_CHANNEL_BATCH);
  const fragment = document.createElement('div');
  next.forEach(([channelName, items]) => {
    const PAGE_SIZE = 8;
    const channelWrap = document.createElement('div');
    channelWrap.innerHTML = createChannelGroupHTML(channelName, items.slice(0, PAGE_SIZE), { savedIds: savedArticles, searchQuery: window.matchMedia('(min-width: 768px)').matches ? mediaSearchQuery.trim() : '' });
    const group = channelWrap.firstElementChild;
    // A renderer tényleges epizódlistája a channel_ azonosítójú elem.
    // A régi .media-episode-grid osztály hiánya miatt a További részek gomb nem készült el.
    const episodeGrid = group?.querySelector('[id^="channel_"]');
    if (episodeGrid) episodeGrid.classList.add('media-episode-grid');
    // Globális keresésnél közvetlenül a csatorna fejlécéből is követhető a forrás.
    if (group && window.matchMedia('(min-width: 768px)').matches && mediaSearchQuery.trim()) {
      const sourceId = items.find(item => item.source_id != null)?.source_id;
      const sourceKey = sourceId != null ? String(sourceId) : '';
      if (sourceKey) {
        const followBtn = document.createElement('button');
        followBtn.type = 'button';
        followBtn.className = 'media-browser-follow media-search-follow';
        const updateFollowLabel = () => {
          const followed = userSubscriptions.has(sourceKey);
          followBtn.textContent = followed ? '✓ Követve' : '+ Követem';
          followBtn.classList.toggle('is-following', followed);
          followBtn.setAttribute('aria-label', `${followed ? 'Követés megszüntetése' : 'Csatorna követése'}: ${channelName}`);
        };
        updateFollowLabel();
        followBtn.addEventListener('click', async event => {
          event.preventDefault();event.stopPropagation();
          followBtn.disabled = true;
          try { await window.handleHubFollowToggle(sourceKey); }
          catch (error) { console.error('Követés sikertelen:', error); }
          finally { if (followBtn.isConnected) { followBtn.disabled = false; updateFollowLabel(); } }
        });
        const heading = group.querySelector('h2');
        if (heading) heading.insertAdjacentElement('afterend', followBtn);
      }
    }
    // Kereséskor a tényleges találatok rögtön láthatók, nem kell a csatornát lenyitni.
    if (group && window.matchMedia('(min-width: 768px)').matches && mediaSearchQuery.trim()) {
      const details = group.querySelector('[id^="channel_"]');
      if (details) details.classList.remove('hidden');
      const arrow = group.querySelector('[id^="icon_channel_"]');
      if (arrow) arrow.classList.add('rotate-180');
    }
    // A fejléc a teljes epizódszámot mutassa, ne az első nyolcat.
    // A Média keresőjénél ne jelenjen meg az alap-renderelő „új rész” felirata.
    // A csatorna fejlécében lévő számlálót a keresés állapotának megfelelően írjuk át.
    // A keresési követésgomb a h2 után kerülhet, ezért nem használható a nextElementSibling.
    // A számláló a csatorna fejlécében a h2 melletti span.
    const countBadge = group?.querySelector('h2')?.parentElement?.querySelector('span');
    if (countBadge) {
      const searchingMedia = window.matchMedia('(min-width: 768px)').matches && mediaSearchQuery.trim().length > 0;
      countBadge.textContent = `${items.length} ${searchingMedia ? 'találat' : 'rész'}`;
    }
    if (episodeGrid && items.length > PAGE_SIZE) {
      let shown = PAGE_SIZE;
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'media-episode-more';
      const refreshLabel = () => { more.textContent = `További részek megjelenítése (${items.length - shown} maradt)`; };
      refreshLabel();
      more.addEventListener('click', () => {
        const nextItems = items.slice(shown, shown + PAGE_SIZE);
        const temp = document.createElement('div');
        temp.innerHTML = createChannelGroupHTML(channelName, nextItems, { savedIds: savedArticles, searchQuery: window.matchMedia('(min-width: 768px)').matches ? mediaSearchQuery.trim() : '' });
        const nextGrid = temp.querySelector('[id^="channel_"]');
        if (nextGrid) {
          attachCardEventListeners(nextGrid);
          const addedCards = Array.from(nextGrid.children);
          more.before(...addedCards);
          // A kattintás után a frissen megjelenített első epizódra lépünk.
          // Kizárólag asztali nézetben; mobilon a korábbi működés marad.
          if (window.matchMedia('(min-width: 1024px)').matches && addedCards.length) {
            const firstAdded = addedCards[0];
            requestAnimationFrame(() => requestAnimationFrame(() => {
              if (!firstAdded.isConnected) return;
              firstAdded.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start',
                inline: 'nearest'
              });
            }));
          }
        }
        shown += nextItems.length;
        if (shown >= items.length) more.remove();
        else refreshLabel();
      });
      episodeGrid.appendChild(more);
    }
    if (group) fragment.appendChild(group);
  });
  // Csak az új kártyák eseménykezelőit kötjük be.
  attachCardEventListeners(fragment);
  scrollContainer.insertBefore(fragment, moreMediaButton);
  renderedChannels += next.length;
  if (moreMediaButton) {
    moreMediaButton.hidden = renderedChannels >= channelEntries.length;
    moreMediaButton.textContent = `További műsorok (${channelEntries.length - renderedChannels})`;
  }
};
const moreMediaButton = document.createElement('button');
moreMediaButton.type = 'button';
moreMediaButton.className = 'w-full px-4 py-3 text-sm font-semibold border-t border-neutral-200 dark:border-neutral-800';
moreMediaButton.addEventListener('click', renderNextMediaChannels);
feedContainer.appendChild(scrollContainer);
scrollContainer.appendChild(moreMediaButton);
renderNextMediaChannels();
 if (currentVideoCategory === 'saved' && activeList.length === 0) {
   feedContainer.innerHTML = '<div class="px-5 py-16 text-center text-sm text-neutral-500">🔖 Még nincs mentett médiád.<p class="mt-2 text-xs">Videóknál és podcastoknál a Mentés gombbal tehetsz ide tartalmat.</p></div>';
 }

const badge = document.getElementById('feedCountBadge');
if (badge) badge.innerText = `${Object.keys(groupedChannels).length} műsor`;

const savedMediaHead = document.getElementById('savedMediaCountHeader');
if (savedMediaHead) {
const savedMediaCount = dbMediaItems.filter(m => savedArticles.has(m.id.toString())).length;
savedMediaHead.innerText = savedMediaCount;
}

return;
}

if (currentPillar === 'news' && currentNewsCategory === 'news_hub') {
renderNewsHubView(feedContainer);
return;
}

let pool = [...reflektorArticles.map(item => ({...item, isReflektor: true, cat: 'reflektor'})), ...articlesData.map(item => ((item.cat || item.category) === 'reflektor' ? {...item, isReflektor: true, cat: 'reflektor'} : item))].filter(item => {
if (isSourceHidden(item.source || item.source_name)) return false;
if (!item || item.id == null) return false;
if (hideReadActive && readArticles.has(String(item.id))) return false;
return !isArticleBlocked(item, userProfile);
});

pool = deduplicateArticles(pool);

// A jobb oldali áttekintő a teljes, engedélyezett hírkészletből válogat,
// nem csupán az aktuálisan kiválasztott rovat kártyáiból.
window.__4tyOverviewPool = pool.map(item => ({
  id: item.id, title: item.cleanTitle || item.clean_title || item.title,
  url: item.url, cat: item.cat || item.category || 'egyeb',
  source: item.source || item.source_name || '',
  timestamp: Number(item.timestamp) || 0
}));
window.dispatchEvent(new Event('4ty:overview-updated'));

// Kliensoldali hírkereső: forrás, cím, lead és tagek.
// Nem indít új API-kérést; kizárólag a már betöltött cikkhalmazt szűri.
const normalizedSearch = normalizeSearchText(newsSearchQuery.trim());
if (normalizedSearch) {
pool = pool.filter(item => {
const tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
const haystack = [
item.source,
item.source_name,
item.title,
item.cleanTitle,
item.clean_title,
item.lead,
tags
].filter(Boolean).join(' ');
return normalizeSearchText(haystack).includes(normalizedSearch);
});
}

if (currentSortMode === 'reflektor') {
pool = pool.filter(item => (item.cat || item.category) === 'reflektor' || item.isReflektor === true);
} else if (currentSortMode === 'curated') {
pool.sort((a, b) => calculatePersonalScore(b, userProfile) - calculatePersonalScore(a, userProfile));
} else {
pool.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

pool = applySourceDiversification(pool);

const gridWrap = document.createElement('div');
gridWrap.className = currentSortMode === 'reflektor' && currentNewsCategory !== 'saved'
  ? "reflektor-section-grid reflektor-standalone-grid"
  : "grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:gap-px md:bg-neutral-200 md:dark:bg-neutral-800";

if (currentNewsCategory === 'saved') {
pool = pool.filter(item => savedArticles.has(item.id.toString()));
pool.forEach(item => {
visibleCount++;
gridWrap.insertAdjacentHTML('beforeend', createArticleHTML(item, { isRead: readArticles.has(item.id.toString()), isSaved: savedArticles.has(item.id.toString()), isUpvoted: upvotedItems.has(item.id.toString()), isClickbaited: clickbaitedItems.has(item.id.toString()), antiClickbaitActive }));
});
feedContainer.appendChild(gridWrap);
 if (visibleCount === 0 && !newsSearchQuery.trim()) {
   feedContainer.innerHTML = '<div class="px-5 py-16 text-center text-sm text-neutral-500">🔖 Még nincs mentett híred.<p class="mt-2 text-xs">A híreknél a Mentés gombbal gyűjthetsz cikkeket.</p></div>';
 }
} else if (currentNewsCategory !== 'all' || currentSortMode === 'curated' || currentSortMode === 'reflektor') {
if (currentNewsCategory !== 'all' && currentSortMode !== 'reflektor') {
pool = pool.filter(item => (item.cat || item.category) === currentNewsCategory);
}
pool.forEach(item => {
visibleCount++;
gridWrap.insertAdjacentHTML('beforeend', createArticleHTML(item, { isRead: readArticles.has(String(item.id)), isSaved: savedArticles.has(String(item.id)), isUpvoted: upvotedItems.has(String(item.id)), isClickbaited: clickbaitedItems.has(String(item.id)), antiClickbaitActive }));
});
if (currentSortMode === 'reflektor' && currentNewsCategory !== 'saved') {
  const spotlight = document.createElement('section');
  spotlight.className = 'reflektor-section reflektor-standalone';
  const heading = document.createElement('div');
  heading.className = 'reflektor-section-header';
  heading.innerHTML = '<div class="reflektor-standalone-heading"><span class="reflektor-standalone-kicker">✦ KIEMELT TÖRTÉNETEK</span><h2>REFLEKTOR</h2><p>A történetek, amelyek most számítanak.</p></div>';
  spotlight.appendChild(heading);
  spotlight.appendChild(gridWrap);
  feedContainer.appendChild(spotlight);
} else {
  feedContainer.appendChild(gridWrap);
}
} else {
sectionOrder.forEach(catKey => {
if (userProfile.mute_categories && userProfile.mute_categories.includes(catKey)) return;
let sectionItems = pool.filter(item => (item.cat || item.category) === catKey);
if (sectionItems.length === 0) return;

sectionItems = applySourceDiversification(sectionItems);
const meta = CATEGORY_META[catKey];
if (!meta) return;

const sectionWrap = document.createElement('section');
const isReflektorSection = catKey === 'reflektor';
sectionWrap.className = isReflektorSection ? "reflektor-section col-span-full" : "border-b border-neutral-200 dark:border-neutral-850 pb-2 col-span-full";

const headerBg = isReflektorSection ? "reflektor-section-header" : "bg-neutral-100/90 dark:bg-neutral-900/90 border-y border-neutral-200 dark:border-neutral-800";

sectionWrap.innerHTML = `
<div class="px-4 lg:px-6 py-2.5 ${headerBg} flex items-center justify-between sticky top-[57px] z-30 backdrop-blur-sm">
<div class="flex items-center gap-2">
<span class="text-base">${meta.icon}</span>
<span class="text-xs sm:text-sm font-bold uppercase tracking-wider ${isReflektorSection ? 'reflektor-section-title' : 'text-black dark:text-white'}">${meta.label}</span>
</div>
<span class="text-[11px] font-mono text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">${sectionItems.length} cikk</span>
</div>
`;

const secGrid = document.createElement('div');
secGrid.className = isReflektorSection ? "reflektor-section-grid" : "grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:gap-px md:bg-neutral-200 md:dark:bg-neutral-800";

sectionItems.forEach(item => {
visibleCount++;
secGrid.insertAdjacentHTML('beforeend', createArticleHTML(item, { isRead: readArticles.has(item.id.toString()), isSaved: savedArticles.has(item.id.toString()), isUpvoted: upvotedItems.has(item.id.toString()), isClickbaited: clickbaitedItems.has(item.id.toString()), antiClickbaitActive }));
});

sectionWrap.appendChild(secGrid);
feedContainer.appendChild(sectionWrap);
});
}

if (newsSearchQuery.trim() && visibleCount === 0) {
feedContainer.innerHTML = `
<div class="px-4 py-12 text-center">
<div class="text-2xl mb-2">🔎</div>
<p class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nincs találat erre: „${escapeHtml(newsSearchQuery.trim())}”</p>
<p class="text-xs text-neutral-400 mt-1">Próbálj forrásnevet, címszót vagy témát.</p>
</div>`;
}

const badge = document.getElementById('feedCountBadge');
if (badge) badge.innerText = `${visibleCount} db`;

const savedHead = document.getElementById('savedCountHeader');
if (savedHead) {
const savedNewsCount = [...reflektorArticles, ...articlesData].filter(a => a?.id != null && savedArticles.has(String(a.id))).length;
savedHead.innerText = savedNewsCount;
}

const reflHead = document.getElementById('reflektorCountHeader');
if (reflHead) reflHead.innerText = reflektorArticles.length;

attachCardEventListeners();
}

function renderMediaHubView(container) {
const wrapper = document.createElement('div');
wrapper.className = "hub-refresh hub-refresh--media p-4 sm:p-6 space-y-6 max-w-4xl mx-auto";

const savedSubmitterName = localStorage.getItem('4ty_submitter_name') || '';

wrapper.innerHTML = `
<header class="hub-hero"><div class="hub-hero__eyebrow">MÉDIA • KÖZÖSSÉGI FORRÁSOK</div><h2>Médiaforrásaim</h2><p>Fedezz fel új csatornákat és podcastokat, vagy ajánlj egyet a közösségnek.</p></header>
<div class="hub-submit-card p-5 rounded-2xl space-y-4">
<div class="flex items-center justify-between">
<h3 class="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2"><span>✨</span> <span>Médiaforrás beküldése</span></h3>
<span id="hubStatusBadge" class="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded font-mono hidden">Kész</span>
</div>
<p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">Adj meg egy YouTube-csatornát vagy podcastlinket. A rendszer megpróbálja felismerni a forrás típusát és témáját.</p>

<div class="hub-submit-flow" aria-label="Beküldés lépései"><span><b>1</b> Link megadása</span><span><b>2</b> Automatikus felismerés</span><span><b>3</b> Feldolgozás</span></div>
<div class="flex flex-col sm:flex-row gap-2">
<input id="hubInputUrl" type="text" placeholder="pl. @telexhu vagy podcast URL..." class="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 shadow-inner">
<input id="hubSubmitterName" type="text" placeholder="Beküldő név / @handle (opcionális)" value="${escapeHtml(savedSubmitterName)}" class="w-full sm:w-44 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-500">
<button id="hubSubmitBtn" class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shadow-md transition-colors">Forrás beküldése</button>
</div>
<p class="hub-submit-footnote">A beküldés után a forrás feldolgozása időt vehet igénybe. A megjelenés nem jelent automatikus nyilvános jóváhagyást.</p>
<div id="hubStatusText" class="text-xs font-medium text-red-600 dark:text-red-400 italic hidden"></div>
</div>

<div class="hub-browser media-hub-browser space-y-4 pt-2">
  <div class="media-browser-heading">
    <div><span class="media-browser-kicker">FEDEZD FEL</span><h3>Források böngészése</h3><p>Videócsatornák és podcastok egy helyen, egyszerű követéssel.</p></div>
    
  </div>
  <div class="media-browser-toolbar">
    <div id="mediaHubFilters" class="media-browser-filters" aria-label="Médiaforrás szűrők"></div>
    <label class="media-browser-search"><span aria-hidden="true">⌕</span><input id="hubSearchInput" type="search" placeholder="Keresés forrásnév alapján..." aria-label="Médiaforrás keresése"></label>
  </div>
  <div id="mediaHubSourcesGrid" class="media-browser-grid"></div>
  <div id="mediaHubPagination" class="media-browser-pagination" aria-label="Médiaforrások lapozása"></div>
</div>
`;

container.appendChild(wrapper);

const submitBtn = wrapper.querySelector('#hubSubmitBtn');
const inputUrl = wrapper.querySelector('#hubInputUrl');
const submitterNameInput = wrapper.querySelector('#hubSubmitterName');
const statusText = wrapper.querySelector('#hubStatusText');
const statusBadge = wrapper.querySelector('#hubStatusBadge');
const searchInput = wrapper.querySelector('#hubSearchInput');
const mediaGrid = wrapper.querySelector('#mediaHubSourcesGrid');
const mediaFilters = wrapper.querySelector('#mediaHubFilters');
const mediaPagination = wrapper.querySelector('#mediaHubPagination');
const mediaTotal = wrapper.querySelector('#mediaSourceTotal');
let activeMediaFilter = 'all';
let mediaPage = 1;
const MEDIA_PAGE_SIZE = 12;
const mediaCategoryLabels = { politika: 'Közélet / Politika', gazdasag: 'Gazdaság / Pénzügy', tech: 'Technológia / AI', tudomany: 'Tudomány', sport: 'Sport', auto: 'Autó / Közlekedés', bulvar: 'Szórakozás / Bulvár', kultura: 'Kultúra / Film / Könyv', gaming: 'Gaming', eletmod: 'Életmód / Egészség', csalad: 'Gyerek / Család', idojaras: 'Időjárás / Környezet', nemzetkozi: 'Nemzetközi hírek', egyeb: 'Általános / Vegyes', bunugy: 'Bűnügy / Rendőrségi hírek' };
const mediaCategoryName = value => {
  const key = String(value || 'egyeb').trim().toLowerCase();
  const normalized = ['auto_ai', 'video', 'podcast', ''].includes(key) ? 'egyeb' : key;
  return mediaCategoryLabels[normalized] || normalized.replace(/[_-]/g, ' ').replace(/^./, ch => ch.toUpperCase());
};
const mediaSourceType = (src) => String(src.source_type || '').toLowerCase();
const getMediaSources = () => {
  const byId = new Map();
  for (const src of [...sourcesCatalog, ...communitySourcesCache]) {
    if (!src || !['video', 'podcast'].includes(mediaSourceType(src))) continue;
    const id = String(src.id ?? '').trim();
    if (!id) continue;
    byId.set(id, { ...(byId.get(id) || {}), ...src });
  }
  return [...byId.values()].sort((a,b) => String(a.title || '').localeCompare(String(b.title || ''), 'hu', {sensitivity:'base'}));
};
const updateSourceGrids = () => {
  const sources = getMediaSources();
  const query = (searchInput?.value || '').trim().toLocaleLowerCase('hu-HU');
  const countType = type => sources.filter(src => mediaSourceType(src) === type).length;
  const followed = sources.filter(src => userSubscriptions.has(String(src.id))).length;
  const options = [
    {id:'all',label:'Összes',count:sources.length},
    {id:'following',label:'✓ Követettek',count:followed},
    {id:'video',label:'🎬 Videók',count:countType('video')},
    {id:'podcast',label:'🎙 Podcastok',count:countType('podcast')}
  ];
  if (mediaFilters) {
    mediaFilters.innerHTML = options.map(o => `<button type="button" data-media-filter="${o.id}" class="media-browser-filter ${activeMediaFilter === o.id ? 'is-active' : ''}" aria-pressed="${activeMediaFilter === o.id}">${o.label}<span>${o.count}</span></button>`).join('');
    mediaFilters.querySelectorAll('[data-media-filter]').forEach(btn => btn.addEventListener('click', () => {
      activeMediaFilter = btn.dataset.mediaFilter;
      mediaPage = 1;
      updateSourceGrids();
    }));
  }
  const filtered = sources.filter(src => {
    if (activeMediaFilter === 'following' && !userSubscriptions.has(String(src.id))) return false;
    if (activeMediaFilter !== 'all' && activeMediaFilter !== 'following' && mediaSourceType(src) !== activeMediaFilter) return false;
    return !query || [src.title, src.category, src.url].filter(Boolean).join(' ').toLocaleLowerCase('hu-HU').includes(query);
  });
  if (mediaTotal) mediaTotal.textContent = `${filtered.length} forrás`;
  const pageCount = Math.max(1, Math.ceil(filtered.length / MEDIA_PAGE_SIZE));
  mediaPage = Math.min(Math.max(mediaPage, 1), pageCount);
  const pageItems = filtered.slice((mediaPage - 1) * MEDIA_PAGE_SIZE, mediaPage * MEDIA_PAGE_SIZE);
  if (mediaGrid) {
    mediaGrid.innerHTML = pageItems.length ? pageItems.map(src => {
      const type = mediaSourceType(src);
      const following = userSubscriptions.has(String(src.id));
      const image = src.image_url ? `<img src="${escapeHtml(src.image_url)}" loading="lazy" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
      const imageFallback = `<span class="media-browser-cover-fallback" style="display:${src.image_url ? 'none' : 'flex'}">${type === 'podcast' ? '🎙' : '🎬'}</span>`;
      return `<article class="media-browser-card">
        <div class="media-browser-cover">${image}${imageFallback}</div>
        <div class="media-browser-card-body">
          <span class="media-browser-type">${type === 'podcast' ? '🎙 PODCAST' : '🎬 VIDEÓCSATORNA'}</span>
          <h4 title="${escapeHtml(src.title || '')}">${escapeHtml(src.title || 'Névtelen forrás')}</h4>
          <p>${escapeHtml(mediaCategoryName(src.category))}</p>
          ${src.submitter_name ? `<small>Ajánlotta: ${escapeHtml(src.submitter_name)}</small>` : ''}
          <button type="button" class="media-browser-follow ${following ? 'is-following' : ''}" data-media-follow="${escapeHtml(String(src.id))}" aria-label="${following ? 'Követés megszüntetése' : 'Forrás követése'}: ${escapeHtml(src.title || '')}">${following ? '✓ Követve' : '+ Követés'}</button>
        </div>
      </article>`;
    }).join('') : '<p class="media-browser-empty">Nincs találat. Próbálj másik szűrőt vagy keresést.</p>';
    mediaGrid.querySelectorAll('[data-media-follow]').forEach(btn => btn.addEventListener('click', async () => {
      const sourceId = btn.dataset.mediaFollow;
      btn.disabled = true;
      try { await window.handleHubFollowToggle(sourceId); } finally {
        if (wrapper.isConnected) updateSourceGrids();
      }
    }));
  }
  if (mediaPagination) {
    mediaPagination.innerHTML = pageCount > 1 ? `<button type="button" data-media-page="prev" ${mediaPage === 1 ? 'disabled' : ''}>← Előző</button><span>${mediaPage} / ${pageCount}. oldal</span><button type="button" data-media-page="next" ${mediaPage === pageCount ? 'disabled' : ''}>Következő →</button>` : '';
    mediaPagination.querySelectorAll('[data-media-page]').forEach(btn => btn.addEventListener('click', () => {
      mediaPage += btn.dataset.mediaPage === 'next' ? 1 : -1;
      updateSourceGrids();
    }));
  }
};
updateSourceGrids();
if (searchInput) searchInput.addEventListener('input', () => { mediaPage = 1; updateSourceGrids(); });

if (submitBtn && inputUrl) {
submitBtn.onclick = async () => {
const val = inputUrl.value.trim();
if (!val) {
showToast("Add meg a forrás linkjét!");
return;
}

const submitterName = submitterNameInput ? submitterNameInput.value.trim() : '';
if (submitterName) {
localStorage.setItem('4ty_submitter_name', submitterName);
}

submitBtn.disabled = true;
statusText.classList.remove('hidden');
statusBadge.classList.remove('hidden');

const customToast = (msg) => {
statusText.innerText = msg;
statusBadge.innerText = "Folyamatban...";
showToast(msg);
};

try {
const res = await submitCommunitySource(val, 'auto_ai', customToast, enableSourceLocally, currentUserUuid, submitterName);
statusText.innerText = res.message;
statusBadge.innerText = "Sikeres!";
showToast(res.message);
inputUrl.value = '';
await loadAndRefreshFeedData();
updateSourceGrids();
} catch (err) {
statusText.innerText = err.message || "Hiba történt.";
statusBadge.innerText = "Hiba";
showToast(err.message || "Hiba történt.");
} finally {
submitBtn.disabled = false;
}
};
}
}

function renderNewsHubView(container) {
const wrapper = document.createElement('div');
wrapper.className = "hub-refresh hub-refresh--news p-4 sm:p-6 space-y-6 max-w-4xl mx-auto";

const savedSubmitterName = localStorage.getItem('4ty_submitter_name') || '';

wrapper.innerHTML = `
<header class="hub-hero"><div class="hub-hero__eyebrow">HÍREK • KÖZÖSSÉGI FORRÁSOK</div><h2>Hírforrásaim</h2><p>Ajánlj megbízható hírforrásokat, és böngéssz a már beküldött oldalak között.</p></header>
<div class="hub-submit-card p-5 rounded-2xl space-y-4">
<div class="flex items-center justify-between">
<h3 class="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2"><span>✨</span> <span>Hírforrás beküldése</span></h3>
<span id="newsHubStatusBadge" class="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded font-mono hidden">Kész</span>
</div>
<p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">Add meg a híroldal címét vagy RSS-linkjét. A rendszer megpróbálja felismerni és feldolgozni a forrást.</p>

<div class="hub-submit-flow" aria-label="Beküldés lépései"><span><b>1</b> Link megadása</span><span><b>2</b> Automatikus felismerés</span><span><b>3</b> Feldolgozás</span></div>
<div class="flex flex-col sm:flex-row gap-2">
<input id="newsHubInputUrl" type="text" placeholder="pl. pelda.hu/rss.xml vagy hírportál URL..." class="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 shadow-inner">
<input id="newsHubSubmitterName" type="text" placeholder="Beküldő név / @handle (opcionális)" value="${escapeHtml(savedSubmitterName)}" class="w-full sm:w-44 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-red-500">
<button id="newsHubSubmitBtn" class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shadow-md transition-colors">Forrás beküldése</button>
</div>
<p class="hub-submit-footnote">A beküldés után a forrás feldolgozása időt vehet igénybe. A megjelenés nem jelent automatikus nyilvános jóváhagyást.</p>
<div id="newsHubStatusText" class="text-xs font-medium text-red-600 dark:text-red-400 italic hidden"></div>
</div>

<div class="hub-browser news-browser-unified space-y-4 pt-2">
  <div class="media-browser-heading">
    <div><span class="media-browser-kicker">FEDEZD FEL</span><h3>Források böngészése</h3><p>Hírforrások egy helyen, egyszerű követéssel.</p></div>
  </div>
  <div class="media-browser-toolbar">
    <div id="newsHubCategoryFilters" class="media-browser-filters" aria-label="Forráskategóriák"></div>
    <label class="media-browser-search"><span aria-hidden="true">⌕</span><input id="newsHubSearchInput" type="search" placeholder="Keresés forrásnév alapján..." aria-label="Hírforrás keresése"></label>
  </div>
  <div class="news-browser-count"><span>Elérhető hírforrások</span><span id="newsSourceCountBadge">0 db</span></div>
  <div id="newsSourcesGrid" class="media-browser-grid"></div>
  <div id="newsHubPagination" class="media-browser-pagination" aria-label="Forráslista lapozása"></div>
</div>
`;

container.appendChild(wrapper);

const submitBtn = wrapper.querySelector('#newsHubSubmitBtn');
const inputUrl = wrapper.querySelector('#newsHubInputUrl');
const submitterNameInput = wrapper.querySelector('#newsHubSubmitterName');
const statusText = wrapper.querySelector('#newsHubStatusText');
const statusBadge = wrapper.querySelector('#newsHubStatusBadge');
const searchInput = wrapper.querySelector('#newsHubSearchInput');
const sourcesGrid = wrapper.querySelector('#newsSourcesGrid');
const countBadge = wrapper.querySelector('#newsSourceCountBadge');

const categoryFilters = wrapper.querySelector('#newsHubCategoryFilters');
const pagination = wrapper.querySelector('#newsHubPagination');
let activeNewsCategory = 'all';
let newsPage = 1;
const NEWS_PAGE_SIZE = 12;
const categoryLabels = { politika: 'Közélet / Politika', gazdasag: 'Gazdaság / Pénzügy', tech: 'Technológia / AI', tudomany: 'Tudomány', sport: 'Sport', auto: 'Autó / Közlekedés', bulvar: 'Szórakozás / Bulvár', kultura: 'Kultúra / Film / Könyv', gaming: 'Gaming', eletmod: 'Életmód / Egészség', csalad: 'Gyerek / Család', idojaras: 'Időjárás / Környezet', nemzetkozi: 'Nemzetközi hírek', egyeb: 'Általános / Vegyes', bunugy: 'Bűnügy / Rendőrségi hírek' };
const normalizeNewsCategory = (value) => {
  const key = String(value || 'egyeb').trim().toLowerCase();
  return ['auto_ai', 'podcast', 'video', ''].includes(key) ? 'egyeb' : key;
};
const categoryDisplayName = (value) => categoryLabels[value] || (value === 'egyeb' ? 'Egyéb' : value.replace(/[_-]/g, ' ').replace(/^./, ch => ch.toUpperCase()));
const updateNewsSourceGrid = () => {
const query = (searchInput ? searchInput.value : '').toLocaleLowerCase('hu').trim();
const allNewsSources = Array.isArray(communitySourcesCache)
? communitySourcesCache.filter(src => src.source_type !== 'video' && src.source_type !== 'podcast')
.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'hu', { sensitivity: 'base' })) : [];
const categoryCounts = new Map();
allNewsSources.forEach(src => {
const key = normalizeNewsCategory(src.category);
categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
});
if (activeNewsCategory !== 'all' && activeNewsCategory !== 'following' && !categoryCounts.has(activeNewsCategory)) activeNewsCategory = 'all';
if (categoryFilters) {
const options = [{ key: 'all', name: 'Összes', count: allNewsSources.length }, { key: 'following', name: 'Követettek', count: allNewsSources.filter(src => userSubscriptions.has(String(src.id))).length }, ...Array.from(categoryCounts.entries()).sort((a,b) => categoryDisplayName(a[0]).localeCompare(categoryDisplayName(b[0]), 'hu')).map(([key,count]) => ({key,name:categoryDisplayName(key),count}))];
categoryFilters.innerHTML = options.map(opt => `<button type="button" class="media-browser-filter ${activeNewsCategory === opt.key ? 'is-active' : ''}" data-news-category="${escapeHtml(opt.key)}" aria-pressed="${activeNewsCategory === opt.key}">${escapeHtml(opt.name)} <span>${opt.count}</span></button>`).join('');
categoryFilters.querySelectorAll('[data-news-category]').forEach(btn => btn.addEventListener('click', () => { activeNewsCategory = btn.dataset.newsCategory; newsPage = 1; updateNewsSourceGrid(); }));
}
const filtered = allNewsSources.filter(src => {
if (activeNewsCategory === 'following' && !userSubscriptions.has(String(src.id))) return false;
if (activeNewsCategory !== 'all' && activeNewsCategory !== 'following' && normalizeNewsCategory(src.category) !== activeNewsCategory) return false;
return !query || (src.title || '').toLocaleLowerCase('hu').includes(query) || (src.url || '').toLocaleLowerCase('hu').includes(query);
});
if (countBadge) countBadge.innerText = `${filtered.length} forrás`;
const pageCount = Math.max(1, Math.ceil(filtered.length / NEWS_PAGE_SIZE));
newsPage = Math.min(Math.max(1, newsPage), pageCount);
const pageSources = filtered.slice((newsPage - 1) * NEWS_PAGE_SIZE, newsPage * NEWS_PAGE_SIZE);
if (sourcesGrid) {
sourcesGrid.innerHTML = pageSources.length > 0 ? pageSources.map(src => {
const isFollowing = userSubscriptions.has(String(src.id));
const submitterBadge = src.submitter_name ? `<small>Ajánlotta: ${escapeHtml(src.submitter_name)}</small>` : '';
const image = src.image_url ? `<img src="${escapeHtml(src.image_url)}" loading="lazy" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
return `<article class="media-browser-card news-browser-card">
  <div class="media-browser-cover">${image}<span class="media-browser-cover-fallback" style="display:${src.image_url ? 'none' : 'flex'}">📰</span></div>
  <div class="media-browser-card-body">
    <span class="media-browser-type">📰 HÍRFORRÁS</span>
    <h4 title="${escapeHtml(src.title || '')}">${escapeHtml(src.title || 'Névtelen forrás')}</h4>
    <p>${escapeHtml(categoryDisplayName(normalizeNewsCategory(src.category)))}</p>
    ${submitterBadge}
    <button type="button" data-news-follow="${escapeHtml(String(src.id))}" class="media-browser-follow ${isFollowing ? 'is-following' : ''}" aria-label="${isFollowing ? 'Követés megszüntetése' : 'Forrás követése'}: ${escapeHtml(src.title || '')}">${isFollowing ? '✓ Követve' : '+ Követés'}</button>
  </div>
</article>`;
}).join('') : '<p class="media-browser-empty">Ebben a kategóriában nincs találat.</p>';
  sourcesGrid.querySelectorAll('[data-news-follow]').forEach(btn => btn.addEventListener('click', async () => {
    btn.disabled = true;
    try { await window.handleHubFollowToggle(btn.dataset.newsFollow); } finally { if (wrapper.isConnected) updateNewsSourceGrid(); }
  }));
}
if (pagination) {
pagination.innerHTML = pageCount > 1 ? `<button type="button" data-page="prev" ${newsPage === 1 ? 'disabled' : ''}>← Előző</button><span>${newsPage} / ${pageCount}. oldal</span><button type="button" data-page="next" ${newsPage === pageCount ? 'disabled' : ''}>Következő →</button>` : '';
pagination.querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => { newsPage += btn.dataset.page === 'next' ? 1 : -1; updateNewsSourceGrid(); }));
}
};

updateNewsSourceGrid();

if (searchInput) {
searchInput.oninput = (e) => {
newsPage = 1;
updateNewsSourceGrid();
};
}

if (submitBtn && inputUrl) {
submitBtn.onclick = async () => {
const val = inputUrl.value.trim();
if (!val) {
showToast("Add meg a hírforrás linkjét!");
return;
}

const submitterName = submitterNameInput ? submitterNameInput.value.trim() : '';
if (submitterName) {
localStorage.setItem('4ty_submitter_name', submitterName);
}

submitBtn.disabled = true;
statusText.classList.remove('hidden');
statusBadge.classList.remove('hidden');

const customToast = (msg) => {
statusText.innerText = msg;
statusBadge.innerText = "Folyamatban...";
showToast(msg);
};

try {
const res = await submitCommunitySource(val, 'auto_ai', customToast, enableSourceLocally, currentUserUuid, submitterName);
statusText.innerText = res.message;
statusBadge.innerText = "Sikeres!";
showToast(res.message);
inputUrl.value = '';
await loadAndRefreshFeedData();
newsPage = 1;
updateNewsSourceGrid();
} catch (err) {
statusText.innerText = err.message || "Hiba történt.";
statusBadge.innerText = "Hiba";
showToast(err.message || "Hiba történt.");
} finally {
submitBtn.disabled = false;
}
};
}
}

// 🔗 Interaktív Követés / Követés visszavonása a Hubban
window.handleHubFollowToggle = async (sourceId) => {
const sIdStr = String(sourceId);
if (userSubscriptions.has(sIdStr)) {
const success = await unfollowCommunitySourceInDb(null, sIdStr);
if (success) {
userSubscriptions.delete(sIdStr);
showToast("Forrás eltávolítva a követettekből.");
}
} else {
const success = await followCommunitySourceInDb(null, sIdStr);
if (success) {
userSubscriptions.add(sIdStr);
showToast("✨ Forrás sikeresen bekövetve!");
}
}
await loadAndRefreshFeedData();
};

function attachCardEventListeners(root = document, onSavedChange = null) {
 root.querySelectorAll('.media-bookmark-btn').forEach(btn => {
   btn.onclick = (event) => {
     event.preventDefault(); event.stopPropagation();
     const id = btn.dataset.mediaId;
     if (!id) return;
     if (savedArticles.has(id)) { savedArticles.delete(id); showToast('Eltávolítva a mentettekből'); }
     else { savedArticles.add(id); showToast('Média elmentve!'); }
     saveState();
     // Csak a gombot frissítjük: a lejátszó és a görgetés nem indul újra.
     const saved = savedArticles.has(id);
     btn.textContent = saved ? '♥' : '♡';
     btn.title = saved ? 'Mentés visszavonása' : 'Mentés';
     btn.setAttribute('aria-label', btn.title);
     btn.setAttribute('aria-pressed', String(saved));
     btn.classList.toggle('text-emerald-600', saved);
     btn.classList.toggle('border-emerald-500', saved);
     const count = document.getElementById('savedMediaCountHeader');
     if (count) count.textContent = dbMediaItems.filter(item => savedArticles.has(String(item.id))).length;
     if (onSavedChange) onSavedChange();
      else if (currentVideoCategory === 'saved' && !saved) renderFeed();
   };
 });
root.querySelectorAll('.tldr-btn').forEach(btn => {
btn.onclick = (e) => {
e.stopPropagation();
const id = btn.dataset.id;
const box = Array.from(btn.closest('.news-item')?.querySelectorAll('[id]') || []).find(el => el.id === `tldr-${id}`);
if (box) box.classList.toggle('hidden');
};
});

root.querySelectorAll('.read-toggle').forEach(el => {
el.onclick = (e) => {
e.stopPropagation();
const id = e.target.closest('.news-item')?.dataset.id;
if (!id) return;
if (readArticles.has(id)) readArticles.delete(id); else readArticles.add(id);
saveState();
if (onSavedChange) onSavedChange(); else renderFeed();
};
});

root.querySelectorAll('.bookmark-btn').forEach(btn => {
btn.onclick = (e) => {
e.stopPropagation();
const id = btn.closest('.news-item')?.dataset.id;
if (!id) return;
if (savedArticles.has(id)) { savedArticles.delete(id); showToast('Eltávolítva'); }
else { savedArticles.add(id); showToast('Elmentve!'); }
saveState();
if (onSavedChange) onSavedChange(); else renderFeed();
};
});

root.querySelectorAll('.upvote-btn').forEach(btn => {
btn.onclick = (e) => {
e.stopPropagation();
const id = btn.closest('.news-item')?.dataset.id;
if (!id) return;
if (upvotedItems.has(id)) upvotedItems.delete(id);
else {
upvotedItems.add(id);
showToast('Értékelés rögzítve!');
sendUpvoteToDb(id, currentPillar === 'video');
}
saveState();
if (onSavedChange) onSavedChange(); else renderFeed();
};
});


root.querySelectorAll('.share-btn').forEach(btn => {
btn.onclick = async (e) => {
e.stopPropagation();

const title = btn.dataset.title || '4ty.hu';
const url = btn.dataset.url || btn.closest('.news-item')?.dataset.url || '';
if (!url) {
showToast('A megosztási link nem érhető el.');
return;
}

try {
if (navigator.share) {
await navigator.share({
title,
url
});
return;
}

if (navigator.clipboard && window.isSecureContext) {
await navigator.clipboard.writeText(url);
showToast('Link a vágólapra másolva!');
return;
}

// Régebbi / korlátozott böngészők fallbackje.
const tempInput = document.createElement('textarea');
tempInput.value = url;
tempInput.setAttribute('readonly', '');
tempInput.style.position = 'fixed';
tempInput.style.opacity = '0';
document.body.appendChild(tempInput);
tempInput.select();
const copied = document.execCommand('copy');
tempInput.remove();

if (copied) {
showToast('Link a vágólapra másolva!');
} else {
window.prompt('Másold ki a cikk linkjét:', url);
}
} catch (err) {
// A natív megosztó bezárása nem valódi hiba.
if (err?.name === 'AbortError') return;

console.warn('Megosztási hiba:', err);
try {
if (navigator.clipboard && window.isSecureContext) {
await navigator.clipboard.writeText(url);
showToast('Link a vágólapra másolva!');
} else {
window.prompt('Másold ki a cikk linkjét:', url);
}
} catch (_) {
window.prompt('Másold ki a cikk linkjét:', url);
}
}
};
});

root.querySelectorAll('.hide-this-source-btn').forEach(btn => {
btn.onclick = async (e) => {
e.stopPropagation();
const src = btn.dataset.source;
if (!src) return;
if (await openCustomConfirm(`Biztosan elrejted a(z) "${src}" összes tartalmát?`)) {
toggleSourceBlock(src);
}
};
});
}

export function resetToHome() {
currentPillar = 'news';
currentNewsCategory = 'all';
currentVideoCategory = 'video';
currentSortMode = 'chrono';
localStorage.setItem('4ty_current_news_category', 'all');
localStorage.setItem('4ty_current_video_category', 'video');
saveState();
switchPillar('news');
window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function initApp() {
  try {
    currentUserUuid = (await ensureAnonymousSession()).id;
  } catch (error) {
    console.warn('Anonim munkamenet nem indítható:', error);
    showToast('A követésekhez szükséges kapcsolat nem érhető el.');
  }
const searchInput = document.getElementById('newsSearchInput');
const searchClearBtn = document.getElementById('newsSearchClearBtn');
let searchRenderTimer = null;
const renderSearchNow = () => {
  if (searchRenderTimer !== null) {
    clearTimeout(searchRenderTimer);
    searchRenderTimer = null;
  }
  if (document.body.classList.contains('saved-library-open')) {
    savedLibraryRedraw?.();
  } else renderFeed();
};
if (searchInput) {
  searchInput.value = newsSearchQuery;
  searchInput.addEventListener('input', (event) => {
    if (document.body.classList.contains('saved-library-open')) {
      savedLibraryQuery = event.target.value || '';
      if (searchClearBtn) searchClearBtn.classList.toggle('hidden', !savedLibraryQuery);
      if (searchRenderTimer !== null) clearTimeout(searchRenderTimer);
      searchRenderTimer = setTimeout(() => { searchRenderTimer = null; savedLibraryRedraw?.(); }, 200);
      return;
    }
    const desktopMedia = window.matchMedia('(min-width: 768px)').matches && currentPillar === 'video';
    if (desktopMedia) mediaSearchQuery = event.target.value || '';
    else newsSearchQuery = event.target.value || '';
    if (searchClearBtn) searchClearBtn.classList.toggle('hidden', !(desktopMedia ? mediaSearchQuery : newsSearchQuery));
    if (searchRenderTimer !== null) clearTimeout(searchRenderTimer);
    searchRenderTimer = setTimeout(() => {
      searchRenderTimer = null;
      renderFeed();
    }, 250);
  });
  // Enter lenyomásakor azonnal keressen, a várakozó időzítő nélkül.
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') renderSearchNow();
  });
}
if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    if (document.body.classList.contains('saved-library-open')) {
      savedLibraryQuery = '';
      if (searchInput) { searchInput.value = ''; searchInput.focus(); }
      searchClearBtn.classList.add('hidden');
      savedLibraryRedraw?.();
      return;
    }
    if (window.matchMedia('(min-width: 768px)').matches && currentPillar === 'video') mediaSearchQuery = '';
    else newsSearchQuery = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    searchClearBtn.classList.add('hidden');
    renderSearchNow();
  });
}


window.renderFeed = renderFeed;
window.switchPillar = switchPillar;
 window.openSavedContent = openSavedContent;
  window.openSavedLibrary = openSavedLibrary;
  window.closeSavedLibrary = closeSavedLibrary;
window.resetToHome = resetToHome;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openReaderModal = openReaderModal;
window.closeReaderModal = closeReaderModal;
window.toggleControlDrawer = toggleControlDrawer;
window.exportUserAccountBackup = exportUserAccountBackup;
window.importUserAccountBackup = importUserAccountBackup;

window.toggleChannelAccordion = function(channelId) {
const content = document.getElementById(channelId);
const icon = document.getElementById('icon_' + channelId);
if (content) {
content.classList.toggle('hidden');
if (icon) {
icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}
}
};

const refreshFeedBtn = document.getElementById('refreshFeedBtn');
if (refreshFeedBtn) {
refreshFeedBtn.onclick = async () => {
const icon = document.getElementById('refreshIcon');
if (icon) icon.classList.add('animate-spin');
try {
await loadAndRefreshFeedData();
showToast('Hírfolyam frissítve!');
} catch (e) {
showToast('Hiba a frissítés során.');
} finally {
if (icon) icon.classList.remove('animate-spin');
}
};
}

const antiClickbaitBtn = document.getElementById('antiClickbaitBtn');
if (antiClickbaitBtn) {
const updateAntiClickbaitUI = () => {
antiClickbaitBtn.className = antiClickbaitActive
? 'text-xs px-2 py-1 rounded border border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold transition-all cursor-pointer whitespace-nowrap'
: 'text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold transition-all cursor-pointer whitespace-nowrap';
};

antiClickbaitBtn.onclick = () => {
antiClickbaitActive = !antiClickbaitActive;
saveState();
updateAntiClickbaitUI();
renderFeed();
showToast(antiClickbaitActive ? "🎯 Tiszta címek aktiválva!" : "Eredeti címek visszaállítva.");
};

updateAntiClickbaitUI();
}

const toggleShortsBtn = document.getElementById('toggleShortsBtn');
if (toggleShortsBtn) {
const updateShortsUI = () => {
const stateText = document.getElementById('shortsStateText');
if (stateText) stateText.innerText = showShortsActive ? 'BE' : 'KI';
toggleShortsBtn.className = showShortsActive
? 'shrink-0 px-2.5 py-1 rounded border border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 font-bold transition-all cursor-pointer whitespace-nowrap'
: 'shrink-0 px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold transition-all cursor-pointer whitespace-nowrap';
};
toggleShortsBtn.onclick = () => {
showShortsActive = !showShortsActive;
saveState();
updateShortsUI();
renderFeed();
showToast(showShortsActive ? "Shorts videók engedélyezve!" : "Shorts videók elrejtve.");
};
updateShortsUI();
}

const hideReadBtn = document.getElementById('hideReadBtn');
if (hideReadBtn) {
hideReadBtn.onclick = () => {
hideReadActive = !hideReadActive;
saveState();
renderFeed();
showToast(hideReadActive ? "👁️ Olvasott cikkek elrejtve" : "👁 Olvasott cikkek megjelenítve");
};
}

const bindMutePair = (quickId, modalBtnId, catKey, label) => {
const qBtn = document.getElementById(quickId);
if (qBtn) qBtn.onclick = () => toggleCategoryMute(catKey, label);

const mBtn = document.getElementById(modalBtnId);
if (mBtn) mBtn.onclick = () => toggleCategoryMute(catKey, label);
};

// A teljes hírtéma-lista (az aktuális CATEGORY_META katalógusból).
const allCategoryMutes = document.getElementById('settingsAllCategoryMutes');
if (allCategoryMutes) {
  const drawCategoryMutes = () => {
    allCategoryMutes.replaceChildren();
    Object.entries(CATEGORY_META).forEach(([key, meta]) => {
      if (key === 'reflektor') return; // szerkesztőségi gyűjtő, nem hírtéma
      const hidden = !!userProfile.mute_categories?.includes(key);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'settings-category-mute flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ' +
        (hidden ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300');
      const title = document.createElement('span');
      title.textContent = `${meta.icon} ${meta.label}`;
      const status = document.createElement('span');
      status.className = 'text-[11px] shrink-0 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800';
      status.textContent = hidden ? 'REJTVE' : 'LÁTHATÓ';
      button.append(title, status);
      button.onclick = () => { toggleCategoryMute(key, meta.label); drawCategoryMutes(); };
      allCategoryMutes.appendChild(button);
    });
  };
  drawCategoryMutes();
}
bindMutePair('quickMutePolitics', 'modalMutePoliticsBtn', 'politika', '🏛️ Politika');
bindMutePair('quickMuteSport', 'modalMuteSportBtn', 'sport', '⚽ Sport');
bindMutePair('quickMuteBulvar', 'modalMuteBulvarBtn', 'bulvar', '🎭 Bulvár');
syncAllMuteButtons(userProfile);

const sortModes = [
{ id: 'sortModeChrono', mode: 'chrono' },
{ id: 'sortModeCurated', mode: 'curated' },
{ id: 'sortModeReflektor', mode: 'reflektor' }
];

sortModes.forEach(({ id, mode }) => {
const btn = document.getElementById(id);
if (!btn) return;
btn.onclick = () => {
currentSortMode = mode;
sortModes.forEach(({ id: otherId }) => {
const otherBtn = document.getElementById(otherId);
if (otherBtn) otherBtn.className = 'sort-pill px-2.5 py-1 rounded font-medium border transition-all cursor-pointer bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400';
});
btn.className = 'sort-pill px-2.5 py-1 rounded font-semibold border transition-all cursor-pointer bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white';
renderFeed();
};
});

document.querySelectorAll('.vcat-pill').forEach(btn => {
btn.onclick = () => {
document.querySelectorAll('.vcat-pill').forEach(b => {
b.className = 'vcat-pill shrink-0 px-2.5 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800';
});
btn.className = 'vcat-pill shrink-0 px-2.5 py-1 rounded font-semibold border transition-colors bg-[#B82928] text-white border-[#B82928]';
currentVideoCategory = btn.dataset.vcat;
localStorage.setItem('4ty_current_video_category', currentVideoCategory);
renderFeed();
};
});

document.querySelectorAll('.cat-pill').forEach(btn => {
btn.onclick = () => {
document.querySelectorAll('.cat-pill').forEach(b => b.className = 'cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800');
btn.className = 'cat-pill shrink-0 px-3 py-1 rounded font-medium border transition-colors bg-black text-white dark:bg-white dark:text-black border-black dark:border-white';
currentNewsCategory = btn.dataset.cat;
// A kategóriaváltás ne örökölje a Reflektor rendezési szűrőjét.
currentSortMode = 'chrono';
localStorage.setItem('4ty_current_news_category', currentNewsCategory);
renderFeed();
};
});

// A mentett alkategória és főnézet gombjainak visszaállítása.
if (window.matchMedia('(min-width: 1024px)').matches && currentPillar === 'video') {
  currentVideoCategory = getFirstOrderedMediaCategory();
}

const savedVideoBtn = [...document.querySelectorAll('.vcat-pill')]
  .find(btn => btn.dataset.vcat === currentVideoCategory);
if (savedVideoBtn) savedVideoBtn.click();
else currentVideoCategory = 'video';

const savedNewsBtn = [...document.querySelectorAll('.cat-pill')]
  .find(btn => btn.dataset.cat === currentNewsCategory);
if (savedNewsBtn) savedNewsBtn.click();
else currentNewsCategory = 'all';

switchPillar(currentPillar);

const themeBtn = document.getElementById('themeToggleBtn');
if (themeBtn) {
themeBtn.onclick = () => {
const isDark = document.documentElement.classList.toggle('dark');
themeBtn.innerText = isDark ? '☀️' : '🌙';
};
}

renderFeed();

try {
await loadAndRefreshFeedData();
} catch (err) {
console.warn("Szinkron hiba:", err);
}
}

// Az alkalmazast a default.php inditja, pontosan egyszer.