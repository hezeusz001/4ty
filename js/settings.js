// js/settings.js - Beállítások, némítások és katalógus kezelő modul (v44.3 - Tisztított verzió)
import { CATEGORY_META } from '4ty/config';
import { fetchSourcesFromDb } from '4ty/api';

export function syncAllMuteButtons(userProfile) {
const syncSingle = (quickId, modalBtnId, modalBadgeId, catKey, label) => {
const isMuted = userProfile.mute_categories && userProfile.mute_categories.includes(catKey);

const qBtn = document.getElementById(quickId);
if (qBtn) {
if (isMuted) {
qBtn.className = 'text-[11px] px-2 py-0.5 rounded border border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 font-bold transition-all cursor-pointer whitespace-nowrap';
qBtn.innerText = `${label} ✓ (rejtve)`;
} else {
qBtn.className = 'text-[11px] px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap';
qBtn.innerText = `${label} ✕`;
}
}

const mBtn = document.getElementById(modalBtnId);
const mBadge = document.getElementById(modalBadgeId);
if (mBtn && mBadge) {
if (isMuted) {
mBtn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400';
mBadge.innerText = 'REJTVE';
mBadge.className = 'text-[11px] px-2 py-0.5 rounded font-mono bg-red-500/20 text-red-600 dark:text-red-400';
} else {
mBtn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300';
mBadge.innerText = 'LÁTHATÓ';
mBadge.className = 'text-[11px] px-2 py-0.5 rounded font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
}
}
};

syncSingle('quickMutePolitics', 'modalMutePoliticsBtn', 'statePolitics', 'politika', '🏛️ Politika');
syncSingle('quickMuteSport', 'modalMuteSportBtn', 'stateSport', 'sport', '⚽ Sport');
syncSingle('quickMuteBulvar', 'modalMuteBulvarBtn', 'stateBulvar', 'bulvar', '🎭 Bulvár');
}

let catalogSearchQuery = '';
// A forráskezelő bezárásakor a keresés ne maradjon aktív.
export function clearSourceCatalogSearch() {
  catalogSearchQuery = '';
  const field = document.querySelector('#catalogList input[type="search"]');
  if (field) {
    field.value = '';
    field.dispatchEvent(new Event('input', {bubbles:true}));
  }
}


export function renderSettingsView({
userProfile,
sectionOrder,
saveStateCallback,
renderFeedCallback,
showToastCallback,
isSourceHiddenFn,
toggleSourceBlockFn,
enableSourceLocallyFn
}) {
syncAllMuteButtons(userProfile);

// 1. Rovat sorrend kezelő
const secContainer = document.getElementById('sectionOrderContainer');
if (secContainer) {
secContainer.innerHTML = '';
sectionOrder.forEach((sec, idx) => {
const meta = CATEGORY_META[sec] || { label: sec, icon: '📁' };
const row = document.createElement('div');
row.className = 'flex items-center justify-between p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs';
row.innerHTML = `
<span class="font-medium">${meta.icon} ${meta.label}</span>
<div class="flex gap-1">
<button class="order-up px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 cursor-pointer" data-idx="${idx}">↑</button>
<button class="order-down px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 cursor-pointer" data-idx="${idx}">↓</button>
</div>
`;
secContainer.appendChild(row);
});

secContainer.querySelectorAll('.order-up').forEach(btn => {
btn.onclick = () => {
const i = parseInt(btn.dataset.idx);
if (i > 0) {
const temp = sectionOrder[i];
sectionOrder[i] = sectionOrder[i - 1];
sectionOrder[i - 1] = temp;
saveStateCallback();
renderSettingsView(arguments[0]);
renderFeedCallback();
}
};
});

secContainer.querySelectorAll('.order-down').forEach(btn => {
btn.onclick = () => {
const i = parseInt(btn.dataset.idx);
if (i < sectionOrder.length - 1) {
const temp = sectionOrder[i];
sectionOrder[i] = sectionOrder[i + 1];
sectionOrder[i + 1] = temp;
saveStateCallback();
renderSettingsView(arguments[0]);
renderFeedCallback();
}
};
});
}

// 2. Forráskatalógus lista
const catListContainer = document.getElementById('catalogList');
if (catListContainer) {
catListContainer.innerHTML = '<p class="text-xs text-neutral-500 py-3">Források betöltése…</p>';
const requestId = String((Number(catListContainer.dataset.requestId || '0') + 1));
catListContainer.dataset.requestId = requestId;
fetchSourcesFromDb().then(allSources => {
if (!catListContainer.isConnected || catListContainer.dataset.requestId !== requestId) return;
catListContainer.innerHTML = '';
if (!allSources || allSources.length === 0) {
catListContainer.innerHTML = `<p class="text-xs text-neutral-400 italic">Még nincsenek források.</p>`;
return;
}

const searchInput = document.createElement('input');
searchInput.type = 'search';
searchInput.placeholder = 'Forrás keresése…';
searchInput.setAttribute('aria-label', 'Forrás keresése');
searchInput.className = 'w-full mb-3 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500';
searchInput.value = catalogSearchQuery;
catListContainer.appendChild(searchInput);

const noResults = document.createElement('p');
noResults.className = 'hidden text-xs text-neutral-500 py-3 text-center';
noResults.textContent = 'Nincs találat.';

const sourceTabs=document.createElement('div');
sourceTabs.className='settings41-source-tabs';
const types=[['news','📰','Hírek'],['podcast','🎧','Podcastok'],['video','🎬','Videók']];
let currentSourceType=catListContainer.dataset.sourceType||'news';
let currentOrigin=catListContainer.dataset.sourceOrigin||'all';
types.forEach(([key,emoji,title])=>{
 const tab=document.createElement('button');tab.type='button';tab.dataset.type=key;
 const icon=document.createElement('span');icon.className='settings45-tab-icon settings45-'+key;icon.textContent=emoji;icon.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.textContent=title;tab.append(icon,label);
 tab.setAttribute('aria-pressed',String(currentSourceType===key));
 tab.addEventListener('click',()=>{
   currentSourceType=key;catListContainer.dataset.sourceType=key;
   sourceTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===key)));
   filterCatalog();
 });
 sourceTabs.appendChild(tab);
});
catListContainer.appendChild(sourceTabs);
const originTabs=document.createElement('div');
originTabs.className='settings44-origin-tabs';
[['all','Összes'],['4ty','4ty'],['community','Közösségi']].forEach(([key,label])=>{
 const button=document.createElement('button');button.type='button';button.textContent=label;
 button.dataset.origin=key;button.setAttribute('aria-pressed',String(currentOrigin===key));
 button.addEventListener('click',()=>{
   currentOrigin=key;catListContainer.dataset.sourceOrigin=key;
   originTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.origin===key)));
   filterCatalog();
 });
 originTabs.append(button);
});
catListContainer.appendChild(originTabs);
const itemsListWrap = document.createElement('div');
itemsListWrap.className = 'space-y-1.5 max-h-60 overflow-y-auto pr-1';

allSources.forEach(source => {
const isBlocked = isSourceHiddenFn(source.title);
const meta = CATEGORY_META[source.category] || { label: source.category, icon: '📰' };
const icon = source.source_type === 'podcast' ? '🎙️' : source.source_type === 'video' ? '🎬' : meta.icon;
const isCommunity = source.is_community === true;
const row = document.createElement('div');
row.className = 'settings43-source-row p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs';
row.dataset.searchName = String(source.title || '').toLocaleLowerCase('hu-HU');
const normalizedType=String(source.source_type||'').toLowerCase();
row.dataset.sourceType = /podcast|audio|rss_audio/.test(normalizedType) ? 'podcast' : /video|youtube|yt/.test(normalizedType) ? 'video' : 'news';
row.dataset.sourceOrigin = isCommunity ? 'community' : '4ty';
const left = document.createElement('div');
left.className = 'flex items-center gap-2 min-w-0 flex-1';
const symbol = document.createElement('span');
symbol.textContent = icon;
const name = document.createElement('span');
name.className = 'settings43-source-name font-semibold ' + (isBlocked ? 'line-through text-neutral-400' : 'text-black dark:text-white');
name.textContent = source.title;
left.append(symbol,name);
const actions = document.createElement('div');
actions.className = 'settings43-source-actions';
const origin = document.createElement('span');
origin.className = 'settings43-source-origin' + (isCommunity ? ' is-community' : '');
origin.textContent = isCommunity ? 'KÖZÖSSÉGI ⭐' : '4ty forrás';
const toggle = document.createElement('button');
toggle.type = 'button';
toggle.className = 'toggle-source-btn settings43-source-toggle' + (isBlocked ? ' is-off' : '');
toggle.dataset.source = source.title;
toggle.setAttribute('role','switch');
toggle.setAttribute('aria-checked',String(!isBlocked));
toggle.setAttribute('aria-label',source.title+' – '+(isBlocked ? 'letiltva, engedélyezés' : 'engedélyezett, letiltás')); 
const toggleTrack=document.createElement('span');
toggleTrack.className='settings43-switch';
toggleTrack.setAttribute('aria-hidden','true');
const toggleText=document.createElement('span');
toggleText.textContent=isBlocked?'Letiltva':'Engedélyezett';
toggle.append(toggleTrack,toggleText);
actions.append(origin,toggle);
row.append(left,actions);
itemsListWrap.appendChild(row);
});
catListContainer.appendChild(itemsListWrap);
catListContainer.appendChild(noResults);
const filterCatalog = () => {
  catalogSearchQuery = searchInput.value;
  const query = catalogSearchQuery.trim().toLocaleLowerCase('hu-HU');
  let visible = 0;
  itemsListWrap.querySelectorAll('[data-search-name]').forEach(row => {
    const match = row.dataset.sourceType === currentSourceType &&
      (currentOrigin==='all' || row.dataset.sourceOrigin===currentOrigin) &&
      row.dataset.searchName.includes(query);
    row.classList.toggle('hidden', !match);
    // A modern-ui CSS flex!important felülírta a Tailwind .hidden osztályát.
    // Inline important biztosítja a tényleges szűrést.
    row.style.setProperty('display',match?'flex':'none','important');
    if (match) visible++;
  });
  noResults.classList.toggle('hidden', visible !== 0);
  noResults.style.setProperty('display',visible===0?'block':'none','important');
};
searchInput.addEventListener('input', filterCatalog);
filterCatalog();

itemsListWrap.querySelectorAll('.toggle-source-btn').forEach(btn => {
btn.onclick = () => {
toggleSourceBlockFn(btn.dataset.source);
renderSettingsView(arguments[0]);
};
});
}).catch(error => {
  if (catListContainer.dataset.requestId !== requestId) return;
  console.error('Forráslista betöltési hiba:', error);
  catListContainer.innerHTML = '<p class="text-xs text-red-500 py-3">A forráslista most nem érhető el. Nyisd meg újra a Beállításokat a próbálkozáshoz.</p>';
});
}

// 3. Feketelista / Kulcsszavak szekció
const blContainer = document.getElementById('blacklistContainer');
if (blContainer) {
blContainer.innerHTML = '';
(userProfile.blocked_stems || []).forEach(w => {
const chip = document.createElement('span');
chip.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
chip.innerHTML = `<span>${w}</span><button class="remove-kw cursor-pointer text-red-500 font-bold" data-word="${w}">✕</button>`;
blContainer.appendChild(chip);
});

blContainer.querySelectorAll('.remove-kw').forEach(b => {
b.onclick = () => {
const word = b.dataset.word;
userProfile.blocked_stems = userProfile.blocked_stems.filter(x => x !== word);
saveStateCallback();
renderSettingsView(arguments[0]);
renderFeedCallback();
};
});
}
}
window.addEventListener('4ty:source-catalog-closed', clearSourceCatalogSearch);
