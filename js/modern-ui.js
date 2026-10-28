/* 4ty.hu modern UI v1 — kizárólag megjelenítési/navigációs réteg */
(() => {
  'use strict';
  const categories = [
    ['all','Összes rovat'], ['reflektor','4ty Reflektor'],
    ['news_hub','Hírek Hub & Beküldő'],
    ['politika','Közélet / Politika'], ['gazdasag','Gazdaság / Pénzügy'],
    ['tech','Technológia / AI'], ['tudomany','Tudomány'], ['sport','Sport'],
    ['auto','Autó / Közlekedés'], ['bulvar','Szórakozás / Bulvár'],
    ['kultura','Kultúra / Film / Könyv'], ['gaming','Gaming'],
    ['eletmod','Életmód / Egészség'], ['csalad','Gyerek / Család'],
    ['idojaras','Időjárás / Környezet'], ['nemzetkozi','Nemzetközi hírek'],
    ['egyeb','Általános / Vegyes'], ['bunugy','Bűnügy / Rendőrségi hírek']
  ];
  const media = [
    ['video','Videók'], ['podcast','Podcastok'],
    ['my_videos','Saját videók'], ['my_podcasts','Saját podcastok'],
    ['media_hub','Média Hub & Beküldő']
  ];
  const $ = id => document.getElementById(id);
  const press = (selector) => document.querySelector(selector)?.click();
  const navItems = [
    ['news','⌂','Hírek'], ['video','▣','Média'],
    ['saved','♧','Mentett'], ['settings','⚙','Beállítások']
  ];
  function makeNav(cls, id) {
    const nav = document.createElement('nav');
    nav.id = id;
    nav.className = cls;
    nav.setAttribute('aria-label','Fő navigáció');
    nav.innerHTML = navItems.map(([key,icon,label]) =>
      `<button type="button" class="modern-nav-item" data-modern-view="${key}" aria-label="${label}"><span class="modern-nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`
    ).join('');
    nav.addEventListener('click', e => {
      const btn = e.target.closest('[data-modern-view]');
      if (!btn) return;
      const view = btn.dataset.modernView;
      if (view === 'settings') { window.closeSavedLibrary?.(); window.openSettingsModal?.(); sync(); return; }
      if (view !== 'settings') window.closeSettingsModal?.();
      if (view === 'hub') { if(window.matchMedia('(max-width:767px)').matches){window.modernOpenSources?.();}else{window.switchPillar?.('news');press('#newsSubNav .cat-pill[data-cat="news_hub"]');}window.scrollTo({top:0,behavior:'smooth'});sync();return; }
      if (view === 'news') {
        window.switchPillar?.('news');
        if (!window.matchMedia('(min-width: 1024px)').matches) {
          press('#newsSubNav .cat-pill[data-cat="all"]');
        }
      } else if (view === 'video') {
        window.switchPillar?.('video');
        // Asztalon a switchPillar már a mentett sorrend első kategóriáját aktiválja.
        // Mobilon marad a korábbi Videók alapnézet.
        if (!window.matchMedia('(min-width: 1024px)').matches) {
          press('#videoSubNav .vcat-pill[data-vcat="video"]');
        }
      } else {
        // A Mentett menüpont mindig mentett HÍREKET nyit meg, a médiaállapottól függetlenül.
        if (window.openSavedLibrary) window.openSavedLibrary('all');
        else window.openSavedContent?.('news');
      }
      window.scrollTo({top:0,behavior:'smooth'});
      sync();
    });
    return nav;
  }
  function createFilters() {
    const wrap = document.createElement('div');
    wrap.id = 'modernFilters';
    wrap.className = 'modern-filters';
    wrap.innerHTML = `
      <div class="modern-filter-heading"><strong id="modernViewTitle">Hírek</strong><span id="modernViewSubtitle">A te híroldalad.</span></div>
      <label class="modern-select-wrap"><span class="sr-only">Rovat kiválasztása</span>
        <select id="modernNewsSelect" aria-label="Hírrovat">${categories.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label>
      <label class="modern-select-wrap"><span class="sr-only">Médiakategória kiválasztása</span>
        <select id="modernMediaSelect" aria-label="Médiakategória">${media.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}<option value="saved">Mentett média</option></select></label>`;
    $('newsSearchBar')?.before(wrap);
    $('modernNewsSelect').addEventListener('change', e => press(`#newsSubNav .cat-pill[data-cat="${e.target.value}"]`));
    $('modernMediaSelect').addEventListener('change', e => press(`#videoSubNav .vcat-pill[data-vcat="${e.target.value}"]`));
  }
  function sync() {
    const pillar = localStorage.getItem('4ty_current_pillar') || 'news';
    const newsCat = localStorage.getItem('4ty_current_news_category') || 'all';
    const mediaCat = localStorage.getItem('4ty_current_video_category') || 'video';
    const saved = pillar === 'news' ? newsCat === 'saved' : mediaCat === 'saved';
    const settingsOpen = !!document.getElementById('settingsModal') && !document.getElementById('settingsModal').classList.contains('hidden');
    const libraryOpen = !!document.getElementById('savedLibraryView');
    const active = settingsOpen ? 'settings' : libraryOpen ? 'saved' : window.matchMedia('(max-width:767px)').matches ? ((pillar==='news'&&newsCat==='news_hub')||(pillar==='video'&&mediaCat==='media_hub')?'hub':saved?'news':pillar) : ((pillar === 'news' && newsCat === 'news_hub') ? 'hub' : saved ? 'saved' : pillar);
    document.querySelectorAll('[data-modern-view]').forEach(b => {
      const selected = b.dataset.modernView === active;
      b.classList.toggle('is-active',selected);
      if (selected) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
    });
    $('modernNewsSelect').value = categories.some(x=>x[0]===newsCat) ? newsCat : 'all';
    $('modernMediaSelect').value = [...media,['saved','Mentett média']].some(x=>x[0]===mediaCat) ? mediaCat : 'video';
    $('modernFilters').classList.toggle('is-media',pillar==='video');
    $('modernViewTitle').textContent = libraryOpen ? 'Mentett tartalmak' : saved ? 'Mentett tartalmak' : pillar==='video' ? 'Média' : 'Hírek';
    $('modernViewSubtitle').textContent = pillar==='video' ? 'Videók és podcastok egy helyen.' : 'A te híroldalad. Te döntöd el, mi fér bele.';
  }
  function init() {
    if (!$('newsFeed') || $('modernBottomNav')) return;
    document.body.classList.add('modern-ui-v1');
    const shell = $('newsFeed').parentElement;
    const header = shell.querySelector('header');
    if (header) header.classList.add('modern-main-header');
    const desktop = makeNav('modern-desktop-nav','modernDesktopNav');
    shell.insertBefore(desktop,shell.firstElementChild);
    document.body.appendChild(makeNav('modern-bottom-nav','modernBottomNav'));
    createFilters();
    document.querySelectorAll('#newsSubNav .cat-pill, #videoSubNav .vcat-pill, #pillarNewsBtn, #pillarVideoBtn').forEach(el => el.addEventListener('click',()=>setTimeout(sync,0)));
    document.querySelector('#modernBottomNav [data-modern-view="settings"]')?.addEventListener('click',()=>{},false);
    window.addEventListener('storage',sync);
    sync();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();

/* v2 enhancements: preserve app event handlers by MOVING existing buttons, never cloning */
(() => {
 'use strict';
 const KEY='4ty_modern_theme';
 function applyTheme(dark){document.documentElement.classList.toggle('dark',dark);const b=document.getElementById('themeToggleBtn');if(b)b.textContent=dark?(window.matchMedia('(min-width: 768px)').matches?'☀︎':'☀️'):'🌙';}
 function initTheme(){
   const btn=document.getElementById('themeToggleBtn');
   const saved=localStorage.getItem(KEY);
   if(saved==='dark'||saved==='light')applyTheme(saved==='dark');
   else applyTheme(document.documentElement.classList.contains('dark'));
   if(!btn)return;
   // Save the intended next state BEFORE the legacy app.js onclick toggles it.
   // No MutationObserver: that previously reverted a user's theme change.
   btn.addEventListener('click',()=>{
     const nextDark=!document.documentElement.classList.contains('dark');
     localStorage.setItem(KEY,nextDark?'dark':'light');
     // The existing app.js click handler performs the actual class toggle.
     // Defer a sync to handle both handler registration orders safely.
     setTimeout(()=>applyTheme(nextDark),0);
   },{capture:true});
 }

 function enhanceCards(){
  document.querySelectorAll('#newsFeed .news-item:not([data-modern-card])').forEach(card=>{
   card.dataset.modernCard='1';
   const bar=card.querySelector('.action-bar');if(!bar)return;
   const group=bar.querySelector(':scope > div');if(!group)return;
   // Asztali nézet: minden művelet látható, a forrás elrejtése a név mellé kerül.
   if(window.matchMedia('(min-width: 768px)').matches){
     const hide=card.querySelector('.hide-this-source-btn');
     const source=card.querySelector('.flex.items-center.gap-1\\.5.flex-wrap > span');
     if(hide && source){
       hide.textContent='✕ Elrejtés';
       hide.setAttribute('aria-label','Forrás elrejtése');
       source.after(hide);
     }
     const read=card.querySelector('.read-toggle');
     if(read){
       const readIcon=read.querySelector('.read-icon');
       const isRead=readIcon?.textContent.trim()==='●';
       read.innerHTML=`<span aria-hidden="true">${isRead?'☑':'☐'}</span> ${isRead?'Olvasott':'Olvasottnak jelölés'}`;
       read.setAttribute('role','button');
       read.setAttribute('tabindex','0');
       read.setAttribute('aria-label',isRead?'Olvasatlannak jelölés':'Olvasottnak jelölés');
       read.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();read.click();}});
     }
     return;
   }
   const menu=document.createElement('details');menu.className='modern-card-menu';
   const summary=document.createElement('summary');summary.setAttribute('aria-label','További műveletek');summary.title='További műveletek';summary.textContent='•••';
   const content=document.createElement('div');content.className='modern-card-menu-content';
   for(const cls of ['share-btn','upvote-btn']){const btn=group.querySelector('.'+cls);if(btn)content.appendChild(btn);}
   const hide=card.querySelector('.hide-this-source-btn');if(hide){hide.textContent='✕ Forrás elrejtése';content.appendChild(hide);}
   if(!content.children.length)return;
   menu.append(summary,content);group.appendChild(menu);
   content.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});
  });
 }
 function init(){initTheme();const feed=document.getElementById('newsFeed');if(!feed)return;enhanceCards();const obs=new MutationObserver(()=>enhanceCards());obs.observe(feed,{childList:true,subtree:true});document.addEventListener('click',e=>{document.querySelectorAll('.modern-card-menu[open]').forEach(m=>{if(!m.contains(e.target))m.open=false;});});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* v3 progressive enhancements: preserve existing buttons and listeners. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const tabs=[['video','🎬 Videók'],['podcast','🎙️ Podcastok'],['my_videos','📺 Saját videók'],['my_podcasts','🎧 Saját podcastok'],['media_hub','✨ Média Hub'],['saved','🔖 Mentett']];
 function initMedia(){
   const filters=$('modernFilters'), sub=$('videoSubNav');if(!filters||!sub||$('modernMediaToolbar'))return;
   const toolbar=document.createElement('div');toolbar.id='modernMediaToolbar';toolbar.className='modern-media-toolbar';
   const group=document.createElement('div');group.className='modern-media-tabs';group.setAttribute('role','group');group.setAttribute('aria-label','Média kategóriák');
   tabs.forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.className='modern-media-tab';b.dataset.mediaTab=key;b.textContent=label;b.addEventListener('click',()=>sub.querySelector(`.vcat-pill[data-vcat="${key}"]`)?.click());group.appendChild(b)});
   toolbar.appendChild(group);
   const shorts=$('toggleShortsBtn');if(shorts){const box=document.createElement('div');box.className='modern-media-shorts';box.appendChild(shorts);toolbar.appendChild(box)}
   filters.after(toolbar);
   // A már létező, működő Shorts kapcsoló látható helyre kerül az asztali Médiában.
   if(shorts && !toolbar.contains(shorts))toolbar.appendChild(shorts);
   const sync=()=>{
     const pillar=localStorage.getItem('4ty_current_pillar')||'news';
     const current=localStorage.getItem('4ty_current_video_category')||'video';
     toolbar.classList.toggle('is-visible',pillar==='video');
     group.querySelectorAll('button').forEach(b=>{const on=b.dataset.mediaTab===current;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});
   };
   document.querySelectorAll('#videoSubNav .vcat-pill,#pillarNewsBtn,#pillarVideoBtn,[data-modern-view]').forEach(el=>el.addEventListener('click',()=>setTimeout(sync,0)));
   $('modernMediaSelect')?.addEventListener('change',()=>setTimeout(sync,0));
   window.addEventListener('storage',sync);sync();
 }
 function initSettings(){
   const modal=$('settingsModal');if(!modal||$('modernSettingsJumps'))return;
   const scroll=modal.querySelector('.overflow-y-auto');if(!scroll)return;
   const cards=Array.from(scroll.children).filter(el=>el.tagName==='DIV');
   const names=['💾 Adatok','🚫 Témák','🗂️ Rovatok','📚 Források'];
   const nav=document.createElement('nav');nav.id='modernSettingsJumps';nav.className='modern-settings-jumps';nav.setAttribute('aria-label','Beállítások szakaszai');
   cards.forEach((card,i)=>{
     if(!names[i])return;
     const b=document.createElement('button');b.type='button';b.className='modern-settings-jump';b.textContent=names[i];
     b.addEventListener('click',()=>{scroll.scrollTo({top:card.offsetTop-cards[0].offsetTop,behavior:'smooth'});});nav.appendChild(b);
   });
   scroll.before(nav);
 }
 function init(){initMedia();initSettings()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* v5 — desktop layout and live right rail; legacy events and theme logic untouched. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const cats=[['all','Összes hír'],['reflektor','💡 4ty Reflektor'],['politika','Közélet'],['gazdasag','Gazdaság'],['tech','Tech / AI'],['tudomany','Tudomány'],['sport','Sport'],['auto','Autó'],['bulvar','Bulvár'],['kultura','Kultúra'],['gaming','Gaming'],['eletmod','Életmód'],['csalad','Család'],['idojaras','Időjárás'],['nemzetkozi','Nemzetközi'],['egyeb','Általános'],['bunugy','Bűnügy']];
 const icons={news:'⌂',video:'▣',saved:'♧',settings:'⚙'};
 function init(){
  const filters=$('modernFilters'),feed=$('newsFeed');if(!filters||!feed||$('modernQuickCats'))return;
  // Desktop: one clear action for the existing curator/sort drawer; original controls stay intact.
  const header=document.querySelector('.modern-main-header');
  const headerActions=header?.lastElementChild;
  if(headerActions && !document.getElementById('modernDesktopTools')){
   const tools=document.createElement('button');tools.type='button';tools.id='modernDesktopTools';
   tools.className='modern-desktop-tools';tools.textContent='☷  Szűrők és rendezés';
   tools.setAttribute('aria-controls','controlDrawer');tools.setAttribute('aria-expanded','false');
   tools.addEventListener('click',()=>{
    window.toggleControlDrawer?.();
    tools.setAttribute('aria-expanded',String(!document.getElementById('controlDrawer')?.classList.contains('hidden')));
   });
   const theme=document.getElementById('themeToggleBtn');
   if(theme)headerActions.insertBefore(tools,theme);else headerActions.appendChild(tools);
  }
  // One design system for the top and bottom navigation.
  document.querySelectorAll('[data-modern-view]').forEach(btn=>{
   const key=btn.dataset.modernView;
   const ico=btn.querySelector('.modern-nav-icon');if(ico&&icons[key])ico.textContent=icons[key];
  });
  const quick=document.createElement('nav');quick.id='modernQuickCats';quick.className='modern-quick-cats';quick.setAttribute('aria-label','Gyors rovatválasztás');
  cats.forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.className='modern-quick-cat';b.dataset.cat=key;b.textContent=label;b.addEventListener('click',()=>document.querySelector(`#newsSubNav .cat-pill[data-cat="${key}"]`)?.click());quick.appendChild(b)});
  filters.after(quick);
  // Real grid, not an absolutely positioned sidebar that can overlap content.
  const layout=document.createElement('div');layout.className='modern-content-layout';layout.id='modernContentLayout';
  feed.before(layout);layout.appendChild(feed);
  const rail=document.createElement('aside');rail.className='modern-trending';rail.id='modernTrending';rail.setAttribute('aria-label','Hírfolyam áttekintése');
  rail.innerHTML=`<section class="modern-rail-card"><div class="modern-rail-eyebrow">4ty.hu · Áttekintés</div><h2>Most a 4ty-n</h2><p class="modern-rail-subtitle">A jelenlegi hírfolyam legfrissebb címei</p><div id="modernTrendingItems" aria-live="polite"><p class="modern-rail-empty">A hírek betöltése folyamatban…</p></div></section>`;
  layout.appendChild(rail);

  let timer;
  function sync(){
   const pillar=localStorage.getItem('4ty_current_pillar')||'news';
   const cat=localStorage.getItem('4ty_current_news_category')||'all';
   const media=pillar==='video';
   quick.classList.toggle('is-media',media);layout.classList.toggle('is-media',media);
   quick.querySelectorAll('button').forEach(b=>{const active=b.dataset.cat===cat;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
   const list=$('modernTrendingItems');
   const railTitle=rail.querySelector('h2');
   const railSubtitle=rail.querySelector('.modern-rail-subtitle');
   if(railTitle)railTitle.textContent=media?'Mi frissült?':'Most a 4ty-n';
   if(railSubtitle)railSubtitle.textContent=media?(window.__4tyMediaOverviewPersonal?'Követett és saját csatornáid legújabb tartalmai':'Legfrissebb tartalmak · Kövess csatornákat a személyes áttekintőhöz'):'Friss hírek különböző rovatokból';
   const pool=media
     ? (Array.isArray(window.__4tyMediaOverviewPool)?window.__4tyMediaOverviewPool:[])
     : (Array.isArray(window.__4tyOverviewPool)?window.__4tyOverviewPool:[]);
   const sorted=pool.filter(item=>item.title && /^https?:\/\//i.test(item.url||''))
     .sort((a,b)=>b.timestamp-a.timestamp);
   // Először különböző rovatok legfrissebb cikkei, majd szükség esetén feltöltés.
   const picked=[],seenCats=new Set(),seenIds=new Set();
   for(const item of sorted){
    if(picked.length>=5)break;
    const groupKey=media?(item.source||item.id):item.cat;
    if(seenCats.has(groupKey))continue;
    picked.push(item);seenCats.add(groupKey);seenIds.add(String(item.id));
   }
   for(const item of sorted){
    if(picked.length>=5)break;
    if(seenIds.has(String(item.id)))continue;
    picked.push(item);seenIds.add(String(item.id));
   }
   list.replaceChildren();
   if(!picked.length){const p=document.createElement('p');p.className='modern-rail-empty';p.textContent='Ebben a nézetben még nincs megjeleníthető hír.';list.appendChild(p);return;}
   picked.forEach(item=>{
    const a=document.createElement('a');a.className='modern-rail-story';a.href=item.url;
    a.target='_blank';a.rel='noopener noreferrer';
    const text=document.createElement('span');
    text.className='modern-rail-story-content';
    const title=document.createElement('span');title.textContent=item.title;
    text.appendChild(title);
    if(item.source){
      const source=document.createElement('small');source.className='modern-rail-story-source';
      source.textContent=item.source;text.appendChild(source);
    }
    a.appendChild(text);list.appendChild(a);
   });
  }
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(sync,130)});
  observer.observe(feed,{childList:true,subtree:true});
  document.querySelectorAll('#newsSubNav .cat-pill,#videoSubNav .vcat-pill,#pillarNewsBtn,#pillarVideoBtn,[data-modern-view]').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
  $('modernNewsSelect')?.addEventListener('change',()=>setTimeout(sync,0));window.addEventListener('storage',sync);
  window.addEventListener('4ty:overview-updated',sync);
  window.addEventListener('4ty:media-overview-updated',sync);
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* v6.1: visual sidebar branding; no changes to app handlers or theme storage. */
(()=>{
 'use strict';
 function init(){
  const nav=document.getElementById('modernDesktopNav');
  if(!nav||nav.querySelector('.modern-sidebar-brand'))return;
  const brand=document.createElement('button');brand.type='button';
  brand.className='modern-sidebar-brand';brand.setAttribute('aria-label','4ty.hu – főoldal');
  const logo=document.createElement('img');logo.src='./logo.png';logo.alt='';
  const copy=document.createElement('span');
  const name=document.createElement('strong');name.textContent='4ty.hu';
  const tagline=document.createElement('small');tagline.textContent='Te döntöd el, mi fér bele.';
  copy.append(name,tagline);brand.append(logo,copy);
  brand.addEventListener('click',()=>{
   if(typeof window.resetToHome==='function')window.resetToHome();
   else document.querySelector('#modernDesktopNav [data-modern-view="news"]')?.click();
  });
  nav.prepend(brand);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* v7: consistent icon system and compact reference media tabs; no changes to persistence. */
(()=>{
 'use strict';
 const icons={news:'▤',video:'▷',saved:'♧',settings:'⚙'};
 function init(){
  document.querySelectorAll('[data-modern-view]').forEach(btn=>{const icon=btn.querySelector('.modern-nav-icon');if(icon)icon.textContent=icons[btn.dataset.modernView]||'•';});
  document.getElementById('modernSavedAccess')?.remove();
  const toolbar=document.getElementById('modernMediaToolbar');
  if(toolbar){const tabs=toolbar.querySelectorAll('[data-media-tab]');tabs.forEach(b=>{
    const names={video:'Videók',podcast:'Podcastok',my_videos:'Saját',my_podcasts:'Saját podcastok',media_hub:'Média Hub',saved:'Mentett'};
    b.textContent=names[b.dataset.mediaTab]||b.textContent;
  });}
  const brand=document.querySelector('.modern-sidebar-brand strong');if(brand)brand.textContent='4ty.hu';
  const search=document.getElementById('newsSearchInput');if(search)search.placeholder='Keresés a hírek között…';
  const title=document.getElementById('modernViewSubtitle');if(title)title.textContent='A te híroldalad.';
  // Use the already-present card controls. No synthetic actions are introduced.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();

/* v7.1: existing refreshFeedBtn remains wired to app.js; CSS restores visibility on mobile. */

/* 4ty 2.0 v8 — visual integration, reusing the original application actions. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const iconMap={news:'▤',video:'▷',saved:'♧',settings:'⚙'};
 const mediaLabels={video:'Videók',podcast:'Podcastok',my_videos:'Saját videók',my_podcasts:'Saját podcastok',media_hub:'Média Hub',saved:'Mentett'};
 function enhanceNavigation(){
   document.querySelectorAll('[data-modern-view]').forEach(b=>{const i=b.querySelector('.modern-nav-icon');if(i)i.textContent=iconMap[b.dataset.modernView]||'';});
   const sidebar=$('modernDesktopNav');
   if(sidebar && !sidebar.querySelector('.v8-media-links')){
     const block=document.createElement('div');block.className='v8-media-links';
     block.innerHTML='<span class="v8-subnav-label">MÉDIA</span>';
     for(const key of ['video','podcast','my_videos']){
       const btn=document.createElement('button');btn.type='button';btn.textContent='↳ '+mediaLabels[key];btn.className='v8-sidebar-media-link';
       btn.addEventListener('click',()=>{window.switchPillar?.('video');document.querySelector(`#videoSubNav .vcat-pill[data-vcat="${key}"]`)?.click();window.scrollTo({top:0,behavior:'smooth'});});block.appendChild(btn);
     }
     const media=sidebar.querySelector('[data-modern-view="video"]');media?.after(block);
   }
 }
 function enhanceSettings(){
   const modal=$('settingsModal');if(!modal||modal.dataset.v8Settings)return;
   const scroll=modal.querySelector('.overflow-y-auto');if(!scroll)return;
   const sections=Array.from(scroll.children).filter(x=>x.tagName==='DIV');
   if(sections.length<4)return;
   modal.dataset.v8Settings='1';
   const headings=['Adatok és biztonsági mentés','Témák és szűrés','Rovatok sorrendje','Források kezelése'];
   const intro=['A beállításaidat mentheted és visszaállíthatod.','Válaszd ki, mely témák ne jelenjenek meg.','A nyilakkal változtathatod a rovatok sorrendjét.','Itt tilthatod le vagy engedélyezheted a forrásokat.'];
   sections.slice(0,4).forEach((section,i)=>{
     section.classList.add('v8-settings-section');
     const title=section.querySelector(':scope > span');if(title){title.textContent=headings[i];title.classList.add('v8-settings-heading');}
     const desc=document.createElement('p');desc.className='v8-settings-intro';desc.textContent=intro[i];title?.after(desc);
   });
   const appearance=document.createElement('section');appearance.className='v8-settings-section';
   const h=document.createElement('h3');h.className='v8-settings-heading';h.textContent='Megjelenés';
   const row=document.createElement('div');row.className='v8-settings-theme';
   const text=document.createElement('span');text.textContent='☾  Világos / Sötét mód';
   const btn=document.createElement('button');btn.type='button';btn.textContent='Váltás';
   btn.addEventListener('click',()=>$('themeToggleBtn')?.click());
   row.append(text,btn);appearance.append(h,row);scroll.insertBefore(appearance,sections[0]);
   const data=document.createElement('p');data.className='v8-settings-group-label';data.textContent='Saját tartalmaim és követéseim';
   sections[3].before(data);
 }
 function tuneMedia(){
   const tabs=$('modernMediaToolbar');if(!tabs||tabs.dataset.v8)return;tabs.dataset.v8='1';
   const group=tabs.querySelector('.modern-media-tabs');if(!group)return;
   const own=document.createElement('button');own.type='button';own.className='modern-media-tab v8-own-tab';own.textContent='Saját';
   own.addEventListener('click',()=>document.querySelector('#videoSubNav .vcat-pill[data-vcat="my_videos"]')?.click());
   group.appendChild(own);
   function sync(){const cat=localStorage.getItem('4ty_current_video_category')||'video';own.classList.toggle('is-active',['my_videos','my_podcasts','media_hub'].includes(cat));}
   document.querySelectorAll('#videoSubNav .vcat-pill').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));sync();
 }
 function init(){enhanceNavigation();enhanceSettings();tuneMedia();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80),{once:true});else setTimeout(init,80);
})();


/* v8.2: mobile-only search sheet and one-tap, swipeable news categories. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const mobile=()=>window.matchMedia('(max-width:767px)').matches;
 const cats=[
  ['all','Összes'],['reflektor','Reflektor'],
  ['politika','Közélet'],['gazdasag','Gazdaság'],['tech','Tech'],
  ['tudomany','Tudomány'],['sport','Sport'],['auto','Autó'],
  ['bulvar','Bulvár'],['kultura','Kultúra'],['gaming','Gaming'],
  ['eletmod','Életmód'],['csalad','Család'],['idojaras','Időjárás'],
  ['nemzetkozi','Nemzetközi'],['egyeb','Általános'],['bunugy','Bűnügy']
 ];
 function init(){
  const header=document.querySelector('.modern-main-header'),bar=$('newsSearchBar'),filters=$('modernFilters');
  if(!header||!bar||!filters||$('modernMobileSearchBtn'))return;
  const actions=header.lastElementChild;
  const open=document.createElement('button');open.type='button';open.id='modernMobileSearchBtn';open.className='modern-mobile-icon-btn';open.setAttribute('aria-label','Keresés megnyitása');open.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/></svg>';
  actions.insertBefore(open,actions.firstChild);
  const close=document.createElement('button');close.type='button';close.id='modernMobileSearchClose';close.className='modern-mobile-search-close';close.textContent='Vissza';
  bar.insertBefore(close,bar.firstChild);
  // Inline kereső: a sáv az eredeti helyén marad.
  window.addEventListener('resize',()=>{if(!mobile())toggleSearch(false);});
  
  function toggleSearch(on){if(!mobile())return;if(!on){const input=$('newsSearchInput');if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}const clear=$('newsSearchClearBtn');if(clear)clear.classList.add('hidden');}document.body.classList.toggle('modern-mobile-search-open',on);if(on){const input=$('newsSearchInput');if(input){input.removeAttribute('readonly');input.disabled=false;input.style.fontSize='16px';requestAnimationFrame(()=>input.focus({preventScroll:true}));}}else{if(document.activeElement===$('newsSearchInput'))document.activeElement.blur();}}
  open.addEventListener('click',()=>toggleSearch(true));close.addEventListener('click',()=>toggleSearch(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')toggleSearch(false);if(e.key==='Enter'&&e.target===$('newsSearchInput')){e.preventDefault();e.target.blur();}});
  const strip=document.createElement('div');strip.id='modernMobileCategories';strip.className='modern-mobile-categories';strip.setAttribute('role','group');strip.setAttribute('aria-label','Hírrovatok');
  for(const [key,label] of cats){const b=document.createElement('button');b.type='button';b.className='modern-mobile-category';b.dataset.category=key;b.textContent=label;b.addEventListener('click',()=>{if(mobile())toggleSearch(false);document.querySelector(`#newsSubNav .cat-pill[data-cat="${key}"]`)?.click();sync();});strip.appendChild(b)}
  filters.after(strip);
  function sync(){const pillar=localStorage.getItem('4ty_current_pillar')||'news';const cat=localStorage.getItem('4ty_current_news_category')||'all';strip.classList.toggle('is-hidden',pillar==='video'||cat==='news_hub'||cat==='saved');strip.querySelectorAll('button').forEach(b=>{const active=b.dataset.category===cat;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});}
  document.querySelectorAll('#newsSubNav .cat-pill,#pillarNewsBtn,#pillarVideoBtn,[data-modern-view]').forEach(el=>el.addEventListener('click',()=>{if(mobile())toggleSearch(false);setTimeout(sync,0);}));
  window.addEventListener('storage',sync);sync();
  // Keep the existing search input and all of its original app.js listeners.
  // Desktop retains the original search bar and category controls.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* v8.3: mobile navigation and complete media categories, existing app handlers preserved. */
(()=>{
 'use strict';
 function init(){
  const nav=document.getElementById('modernBottomNav');
  if(nav){
   const saved=nav.querySelector('[data-modern-view="saved"]');
   if(saved){saved.dataset.modernView='hub';saved.setAttribute('aria-label','Forrásaim');saved.querySelector('.modern-nav-icon').textContent='▦';saved.lastElementChild.textContent='Forrásaim';}
   // The original delegated nav listener handles hub; the saved items remain in Settings.
  }
  const toolbar=document.getElementById('modernMediaToolbar');
  if(toolbar){
   const group=toolbar.querySelector('.modern-media-tabs');
   if(group){
    group.querySelectorAll('[data-media-tab]').forEach(b=>{
     const labels={video:'Videók',podcast:'Podcastok',my_videos:'Saját videók',my_podcasts:'Saját podcastok',media_hub:'Média Hub',saved:'Mentett'};
     b.textContent=labels[b.dataset.mediaTab]||b.textContent;
    });
    group.querySelector('.v8-own-tab')?.remove();
   }
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,150),{once:true});else setTimeout(init,150);
})();

/* v8.4: mobile Forrásaim with two real, existing source-management views. */
(()=>{
 'use strict';
 const mobile=()=>window.matchMedia('(max-width:767px)').matches;
 const $=id=>document.getElementById(id);
 function init(){
  const filters=$('modernFilters');if(!filters||$('modernSourcesTabs'))return;
  const tabs=document.createElement('div');tabs.id='modernSourcesTabs';tabs.className='modern-sources-tabs';
  tabs.innerHTML='<div class="modern-sources-title">Forrásaim</div><div class="modern-sources-options"><button type="button" data-source-type="news">Hírforrásaim</button><button type="button" data-source-type="video">Médiaforrásaim</button></div>';
  filters.after(tabs);
  let choice='news';
  function select(which){
   choice=which;
   window.switchPillar?.(which);
   document.querySelector(which==='news'?'#newsSubNav .cat-pill[data-cat="news_hub"]':'#videoSubNav .vcat-pill[data-vcat="media_hub"]')?.click();
   sync();
  }
  window.modernOpenSources=()=>select(choice);
  tabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>select(b.dataset.sourceType)));
  function sync(){
   const pillar=localStorage.getItem('4ty_current_pillar')||'news';
   const cat=localStorage.getItem(pillar==='video'?'4ty_current_video_category':'4ty_current_news_category');
   const visible=mobile()&&(pillar==='news'&&cat==='news_hub'||pillar==='video'&&cat==='media_hub');
   tabs.classList.toggle('is-visible',visible);
   document.body.classList.toggle('modern-sources-active',visible);
   if(visible)choice=pillar;
   tabs.querySelectorAll('button').forEach(b=>{const on=b.dataset.sourceType===choice;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
   // A Forrásaim nem maradhat kijelölve a Beállítások modal fölött.
   const settingsOpen=!!$('settingsModal')&&!$('settingsModal').classList.contains('hidden');
   if(visible&&!settingsOpen&&!document.getElementById('savedLibraryView')){const nav=$('modernBottomNav');nav?.querySelectorAll('[data-modern-view]').forEach(b=>{const on=b.dataset.modernView==='hub';b.classList.toggle('is-active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});}
  }
  document.querySelectorAll('#newsSubNav .cat-pill,#videoSubNav .vcat-pill,#pillarNewsBtn,#pillarVideoBtn,[data-modern-view]').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,40)));
  window.addEventListener('storage',sync);window.addEventListener('resize',sync);sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,220),{once:true});else setTimeout(init,220);
})();

/* v8.5: expose existing Shorts and clean-title controls in the correct mobile sections. */
(()=>{
 'use strict';
 function init(){
  const categories=document.getElementById('modernMobileCategories');
  const clean=document.getElementById('antiClickbaitBtn');
  if(categories&&clean&&!document.getElementById('modernMobileNewsTools')){
   const tools=document.createElement('div');tools.id='modernMobileNewsTools';tools.className='modern-mobile-news-tools';
   const label=document.createElement('span');label.textContent='Hírfolyam';label.className='modern-mobile-tools-label';
   tools.appendChild(label);tools.appendChild(clean);categories.after(tools);
   clean.setAttribute('aria-label','Tiszta címek be- vagy kikapcsolása');
   const text=clean.querySelector('span');if(text)text.textContent='Tiszta címek';
  }
  const toolbar=document.getElementById('modernMediaToolbar');
  const shorts=document.getElementById('toggleShortsBtn');
  if(toolbar&&shorts){
   let heading=document.getElementById('modernMobileMediaHeading');
   if(!heading){heading=document.createElement('div');heading.id='modernMobileMediaHeading';heading.className='modern-mobile-media-heading';
    const title=document.createElement('strong');title.textContent='Média';heading.appendChild(title);toolbar.prepend(heading);}
   const box=shorts.closest('.modern-media-shorts');
   if(box){
     const positionShorts=()=>{
       if(window.matchMedia('(min-width: 768px)').matches){
         toolbar.appendChild(box);
       }else{
         heading.appendChild(box);
       }
     };
     positionShorts();
     window.addEventListener('resize',positionShorts);
   }
   shorts.setAttribute('aria-label','Shorts megjelenítés be- vagy kikapcsolása');
  }
  function sync(){
   const pillar=localStorage.getItem('4ty_current_pillar')||'news';
   const category=localStorage.getItem('4ty_current_news_category')||'all';
   const tools=document.getElementById('modernMobileNewsTools');
   if(tools)tools.classList.toggle('is-hidden',pillar!=='news'||category==='news_hub'||category==='saved');
  }
  document.querySelectorAll('#newsSubNav .cat-pill,#videoSubNav .vcat-pill,#pillarNewsBtn,#pillarVideoBtn,[data-modern-view]').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,60)));
  window.addEventListener('storage',sync);sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,260),{once:true});else setTimeout(init,260);
})();


/* v8.6: decorate only ordinary news cards after each existing feed render.
   No article actions, event handlers or application data are changed. */
(()=>{
 'use strict';
 function update(){
  const feed=document.getElementById('newsFeed');if(!feed)return;
  const isNews=(localStorage.getItem('4ty_current_pillar')||'news')==='news';
  const isHub=['news_hub','media_hub'].includes(localStorage.getItem('4ty_current_news_category'));
  const cards=Array.from(feed.querySelectorAll('.news-item:has(.article-title)'));
  cards.forEach(card=>card.classList.remove('modern-featured-card','modern-editorial-card'));
  if(!isNews||isHub)return;
  const eligible=cards.filter(card=>card.querySelector('a img')&&!card.closest('.modern-trending'));
  eligible.forEach(card=>card.classList.add('modern-editorial-card'));
  if(eligible.length)eligible[0].classList.add('modern-featured-card');
 }
 function init(){
  const feed=document.getElementById('newsFeed');if(!feed)return;
  let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})});
  observer.observe(feed,{childList:true,subtree:true});
  document.querySelectorAll('[data-modern-view],#newsSubNav .cat-pill,#videoSubNav .vcat-pill').forEach(el=>el.addEventListener('click',()=>setTimeout(update,90)));
  update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* v8.8: clean-title button shows its selected state continuously. */
(()=>{
 'use strict';
 function init(){
  const btn=document.getElementById('antiClickbaitBtn');
  if(!btn||btn.dataset.v88Toggle)return;
  btn.dataset.v88Toggle='1';
  const status=document.createElement('span');status.className='clean-state';status.setAttribute('aria-hidden','true');btn.appendChild(status);
  let enabled=btn.getAttribute('aria-pressed')!=='false';
  function render(){btn.setAttribute('aria-pressed',String(enabled));status.textContent=enabled?'✓ BE':'○ KI';btn.title='Tiszta címek: '+(enabled?'bekapcsolva':'kikapcsolva');}
  render();
  btn.addEventListener('click',()=>{enabled=!enabled;render();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* v8.10: settings bottom navigation and search exit behavior */
(()=>{
 'use strict';
 function init(){
  const modal=document.getElementById('settingsModal');
  const nav=document.getElementById('modernBottomNav');
  if(!modal||!nav)return;
  nav.addEventListener('click',event=>{
   const button=event.target.closest('[data-modern-view]');
   if(!button)return;
   if(button.dataset.modernView!=='settings'&&!modal.classList.contains('hidden')){
    window.closeSettingsModal?.();
    document.body.classList.remove('overflow-hidden');
   }
  },true);
  const search=document.getElementById('newsSearchInput');
  if(search){
   search.addEventListener('search',()=>{if(!search.value){search.dispatchEvent(new Event('input',{bubbles:true}));}});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* v8.17.15 – mobile nav: one authoritative active state (settings/sources/saved). */
(()=>{
 'use strict';
 const mobile=()=>window.matchMedia('(max-width:767px)').matches;
 function syncMobileNav(){
  if(!mobile())return;
  const nav=document.getElementById('modernBottomNav');if(!nav)return;
  const modal=document.getElementById('settingsModal');
  const settingsOpen=!!modal&&!modal.classList.contains('hidden');
  const pillar=localStorage.getItem('4ty_current_pillar')||'news';
  const cat=localStorage.getItem(pillar==='video'?'4ty_current_video_category':'4ty_current_news_category')||'all';
  const sources=!settingsOpen&&!document.getElementById('savedLibraryView')&&(pillar==='news'&&cat==='news_hub'||pillar==='video'&&cat==='media_hub');
  const active=document.getElementById('savedLibraryView')?'__saved_library__':settingsOpen?'settings':sources?'hub':pillar;
  nav.querySelectorAll('[data-modern-view], [data-modern-library]').forEach(btn=>{
   const selected=btn.hasAttribute('data-modern-library') ? active==='__saved_library__' : btn.dataset.modernView===active;
   btn.classList.toggle('is-active',selected);
   if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
  });
 }
 function init(){
  const nav=document.getElementById('modernBottomNav');const modal=document.getElementById('settingsModal');
  if(!nav)return;
  nav.addEventListener('click',()=>{syncMobileNav();setTimeout(syncMobileNav,0);setTimeout(syncMobileNav,100);});
  if(modal)new MutationObserver(syncMobileNav).observe(modal,{attributes:true,attributeFilter:['class']});
  window.addEventListener('storage',syncMobileNav);
  document.querySelectorAll('#newsSubNav .cat-pill,#videoSubNav .vcat-pill').forEach(b=>b.addEventListener('click',()=>setTimeout(syncMobileNav,100)));
  syncMobileNav();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Önálló Mentett tartalmak navigáció */
(()=>{
 'use strict';
 function init(){
  const nav=document.getElementById('modernBottomNav');
  if(!nav||nav.querySelector('[data-modern-library]'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='modern-nav-item';btn.dataset.modernLibrary='1';btn.setAttribute('aria-label','Mentett tartalmak');
  btn.innerHTML='<span class="modern-nav-icon" aria-hidden="true">♧</span><span>Mentett</span>';
  btn.addEventListener('click',()=>window.openSavedLibrary?.());
  const settings=nav.querySelector('[data-modern-view="settings"]');nav.insertBefore(btn,settings);
  document.querySelectorAll('#modernBottomNav [data-modern-view],#modernDesktopNav [data-modern-view]').forEach(other=>other.addEventListener('click',()=>window.closeSavedLibrary?.(),true));
  const desktop=document.getElementById('modernDesktopNav');
  if(desktop&&!desktop.querySelector('[data-modern-library]')){const d=btn.cloneNode(true);d.addEventListener('click',()=>window.openSavedLibrary?.());desktop.insertBefore(d,desktop.querySelector('[data-modern-view="settings"]'));}
  const syncLibraryNav=()=>{const open=!!document.getElementById('savedLibraryView');document.querySelectorAll('[data-modern-library]').forEach(b=>{b.classList.toggle('is-active',open);if(open)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(open){document.querySelectorAll('#modernBottomNav [data-modern-view],#modernDesktopNav [data-modern-view]').forEach(b=>{b.classList.remove('is-active');b.removeAttribute('aria-current');});}};
  new MutationObserver(syncLibraryNav).observe(document.body,{childList:true,subtree:true});syncLibraryNav();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Mentett tartalmak: normál tartalmi nézet, világos/sötét téma */
(()=>{
 const css=`
 body.modern-ui-v1.saved-library-open #modernFilters,
 body.modern-ui-v1.saved-library-open #newsSearchBar,
 body.modern-ui-v1.saved-library-open #modernMobileCategories,
 body.modern-ui-v1.saved-library-open #modernMediaToolbar,
 body.modern-ui-v1.saved-library-open #modernSourcesTabs,
 body.modern-ui-v1.saved-library-open #modernMobileNewsTools,
 body.modern-ui-v1.saved-library-open #modernMobileMediaHeading {display:none!important}
 body.modern-ui-v1.saved-library-open .modern-bottom-nav [data-modern-library].is-active,
 body.modern-ui-v1.saved-library-open .modern-desktop-nav [data-modern-library].is-active {background:#e5e7eb!important;color:#27272a!important}
 html.dark body.modern-ui-v1.saved-library-open .modern-bottom-nav [data-modern-library].is-active,
 html.dark body.modern-ui-v1.saved-library-open .modern-desktop-nav [data-modern-library].is-active {background:#3f3f46!important;color:#fff!important}
 body.modern-ui-v1 .saved-library-view{width:100%;min-height:45vh;padding:24px 16px 90px;background:transparent;color:inherit}
 body.modern-ui-v1 .saved-library-view>div{max-width:900px;margin:0 auto}
 body.modern-ui-v1 .saved-library-view h1{font-size:21px!important;font-weight:800;color:inherit}
 body.modern-ui-v1 .saved-library-view p,body.modern-ui-v1 .saved-library-muted{color:#737373}
 html.dark body.modern-ui-v1 .saved-library-view p,html.dark body.modern-ui-v1 .saved-library-muted{color:#a3a3a3}
 body.modern-ui-v1 .saved-library-tab{padding:9px 17px;border-radius:9px;font-weight:700;font-size:13px;background:#e5e5e5;color:#262626}
 body.modern-ui-v1 .saved-library-tab.is-active{background:#262626;color:white}
 html.dark body.modern-ui-v1 .saved-library-tab{background:#333;color:#e5e5e5}
 html.dark body.modern-ui-v1 .saved-library-tab.is-active{background:#f5f5f5;color:#171717}
 body.modern-ui-v1 .saved-library-card{background:#fff;color:#171717;border:1px solid #e5e5e5;border-radius:12px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;justify-content:space-between}
 html.dark body.modern-ui-v1 .saved-library-card{background:#202020;color:#f5f5f5;border-color:#404040}
 body.modern-ui-v1 .saved-library-card>div{min-width:0;flex:1}
 body.modern-ui-v1 .saved-library-card a{color:inherit;text-decoration:none}
 body.modern-ui-v1 .saved-library-card a:hover{text-decoration:underline}
 body.modern-ui-v1 .saved-library-muted{font-size:12px;margin:6px 0}
 body.modern-ui-v1 .saved-library-remove{padding:8px;border:1px solid #d4d4d4;border-radius:8px;font-size:12px;flex-shrink:0;color:inherit}
 html.dark body.modern-ui-v1 .saved-library-remove{border-color:#525252}
 body.modern-ui-v1 .saved-library-empty{padding:55px 10px;text-align:center;color:#737373}
 @media(max-width:480px){body.modern-ui-v1 .saved-library-card{align-items:flex-start;gap:8px}body.modern-ui-v1 .saved-library-remove{font-size:11px}}
 `;const style=document.createElement('style');style.id='savedLibraryThemeStyles';style.textContent=css;document.head.appendChild(style);
})();

/* Mentett hírek: a normál hírfolyam-kártyák képmérete, kiemelés nélkül. */
(()=>{
  const style=document.createElement('style');
  style.id='savedLibraryCardImageFix';
  style.textContent=`
    #savedLibraryView .saved-library-news-grid .news-item {min-width:0;max-width:100%;overflow:hidden}
    #savedLibraryView .saved-library-news-grid .news-item .article-title {font-size:inherit}
    #savedLibraryView .saved-library-news-grid .news-item > .flex.items-start a:has(> img) {
      display:block!important;flex:0 0 80px!important;width:80px!important;height:80px!important;max-width:80px!important;max-height:80px!important;overflow:hidden!important;border-radius:12px!important
    }
    #savedLibraryView .saved-library-news-grid .news-item > .flex.items-start a > img {
      display:block!important;width:80px!important;height:80px!important;max-width:80px!important;max-height:80px!important;object-fit:cover!important
    }
    @media(min-width:640px){
      #savedLibraryView .saved-library-news-grid .news-item > .flex.items-start a:has(> img){flex-basis:96px!important;width:96px!important;max-width:96px!important;height:80px!important}
      #savedLibraryView .saved-library-news-grid .news-item > .flex.items-start a > img{width:96px!important;max-width:96px!important;height:80px!important}
    }
  `;
  document.head.appendChild(style);
})();


/* Desktop fejléc: a már működő időjárás elemet mozgatjuk (nem másoljuk),
   így az eredeti eseménykezelők, városválasztás és frissítés megmaradnak. */
(()=>{
 'use strict';
 const desktop=()=>window.matchMedia('(min-width:768px)').matches;
 const $=id=>document.getElementById(id);
 function init(){
  const header=document.querySelector('header.modern-main-header');
  const weather=$('mobileWeather'),nameday=$('headerNameday');
  if(!header)return;
  const originalParent=weather?.parentElement;
  const originalNext=weather?.nextSibling;
  function placeWeather(){
   if(!weather||!originalParent)return;
   if(desktop()){
    if(weather.parentElement!==header)header.insertBefore(weather,nameday?.parentElement===header?nameday:header.lastElementChild);
   }else if(weather.parentElement!==originalParent){
    if(originalNext?.parentNode===originalParent)originalParent.insertBefore(weather,originalNext);
    else originalParent.appendChild(weather);
   }
  }
  function sync(){
   const pillar=localStorage.getItem('4ty_current_pillar')||'news';
   const cat=localStorage.getItem('4ty_current_news_category')||'all';
   const hub=pillar==='news'&&cat==='news_hub';
   const saved=!!$('savedLibraryView');
   document.body.classList.toggle('desktop-no-news-categories',pillar==='video'||hub||saved);
   placeWeather();
  }
  const schedule=()=>{sync();setTimeout(sync,60);setTimeout(sync,220);};
  document.querySelectorAll('#newsSubNav .cat-pill,#videoSubNav .vcat-pill,#pillarNewsBtn,#pillarVideoBtn,[data-modern-view],[data-modern-library],#modernQuickCats .modern-quick-cat').forEach(el=>el.addEventListener('click',schedule));
  window.addEventListener('resize',sync);
  window.addEventListener('storage',sync);
  const feed=$('newsFeed');
  if(feed){let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(sync,100);}).observe(feed,{childList:true});}
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,300),{once:true});else setTimeout(init,300);
})();

/* 4ty 16: az asztali Shorts gomb a ténylegesen látható videó-alkategória sávba kerül.
   A régi modernMediaToolbar 1024px felett szándékosan rejtett. */
(()=>{
  'use strict';
  function placeShorts(){
    const btn=document.getElementById('toggleShortsBtn');
    const sub=document.getElementById('videoSubNav');
    const toolbar=document.getElementById('modernMediaToolbar');
    if(!btn||!sub)return;
    if(window.matchMedia('(min-width: 1024px)').matches){
      let slot=document.getElementById('desktopShortsSlot');
      if(!slot){slot=document.createElement('div');slot.id='desktopShortsSlot';sub.appendChild(slot);}
      slot.appendChild(btn);
    }else{
      const box=toolbar?.querySelector('.modern-media-shorts');
      if(box&&!box.contains(btn))box.appendChild(btn);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeShorts,{once:true});
  else placeShorts();
  window.addEventListener('resize',placeShorts);
})();

/* 4ty 20: kizárólag asztali Média-menü átrendezés; az első menüpont a kezdőnézet. */
(()=>{
 'use strict';
 const KEY='4ty_desktop_media_tab_order';
 const WIDTH='(min-width: 1024px)';
 const getNav=()=>document.getElementById('videoSubNav');
 const pills=nav=>[...nav.querySelectorAll('.vcat-pill[data-vcat]')];
 const order=()=>{
   try {const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string'):[];}
   catch{return [];}
 };
 const sorted=nav=>{
   const list=pills(nav), saved=order();
   return list.sort((a,b)=>{
     const ai=saved.indexOf(a.dataset.vcat),bi=saved.indexOf(b.dataset.vcat);
     return (ai<0?100+list.indexOf(a):ai)-(bi<0?100+list.indexOf(b):bi);
   });
 };
 window.__4tyGetFirstMediaTab=()=>sorted(getNav()||document.createElement('div'))[0]?.dataset.vcat||'video';
 function init(){
   const nav=getNav();if(!nav||nav.dataset.orderReady)return;
   nav.dataset.orderReady='1';
   const tabs=pills(nav);if(!tabs.length)return;
   const originalParent=tabs[0].parentElement;
   if(!originalParent)return;
   function apply(){
     const current=pills(nav);
     const saved=order();
     const ordered=[...current].sort((a,b)=>{
       const ai=saved.indexOf(a.dataset.vcat),bi=saved.indexOf(b.dataset.vcat);
       return (ai<0?100+current.indexOf(a):ai)-(bi<0?100+current.indexOf(b):bi);
     });
     ordered.forEach(b=>originalParent.appendChild(b));
     const toolbar=document.querySelector('#modernMediaToolbar .modern-media-tabs');
     if(toolbar)ordered.forEach(b=>{
       const mirror=toolbar.querySelector(`[data-media-tab="${b.dataset.vcat}"]`);
       if(mirror)toolbar.appendChild(mirror);
     });
   }
   function save(){localStorage.setItem(KEY,JSON.stringify(pills(nav).map(b=>b.dataset.vcat)));}
   apply();
   const desktop=()=>window.matchMedia(WIDTH).matches;
   let dragging=null;
   tabs.forEach(tab=>{
     const grip=document.createElement('span');
     grip.className='media-order-grip';
     grip.textContent='⠿';
     grip.title='Húzd a sorrend módosításához';
     grip.setAttribute('aria-hidden','true');
     tab.prepend(grip);
     tab.draggable=desktop();
     tab.addEventListener('dragstart',e=>{
       if(!desktop()){e.preventDefault();return;}
       dragging=tab;tab.classList.add('media-order-dragging');
       if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',tab.dataset.vcat);}
     });
     tab.addEventListener('dragover',e=>{if(dragging&&desktop()){e.preventDefault();e.dataTransfer.dropEffect='move';}});
     tab.addEventListener('drop',e=>{
       if(!dragging||!desktop())return;
       e.preventDefault();
       if(dragging!==tab){
         const all=pills(nav);
         if(all.indexOf(dragging)<all.indexOf(tab))tab.after(dragging);
         else tab.before(dragging);
         save();
       }
     });
     tab.addEventListener('dragend',()=>{dragging?.classList.remove('media-order-dragging');dragging=null;});
   });
   window.addEventListener('resize',()=>tabs.forEach(tab=>tab.draggable=desktop()));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,200),{once:true});
 else setTimeout(init,200);
})();


/* 4ty 24 – A LÁTHATÓ hírgombok átrendezése asztalon. */
(()=>{
 'use strict';
 const KEY='4ty_desktop_news_tab_order';
 const desktop=()=>window.matchMedia('(min-width: 1024px)').matches;
 const visible=()=>document.getElementById('modernQuickCats');
 const items=bar=>[...bar.querySelectorAll('.modern-quick-cat[data-cat]')];
 function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
 function init(){
  const bar=visible();if(!bar||bar.dataset.orderReady)return;
  const buttons=items(bar);if(!buttons.length)return;
  bar.dataset.orderReady='1';
  const saved=read();
  [...buttons].sort((a,b)=>{
    const ai=saved.indexOf(a.dataset.cat),bi=saved.indexOf(b.dataset.cat);
    return (ai<0?100+buttons.indexOf(a):ai)-(bi<0?100+buttons.indexOf(b):bi);
  }).forEach(b=>bar.appendChild(b));
  let dragged=null,dropDone=false;
  buttons.forEach(btn=>{
    const grip=document.createElement('span');grip.className='news-order-grip';grip.textContent='⠿';
    grip.title='Húzd a kategóriát a kívánt helyre';grip.setAttribute('aria-hidden','true');btn.prepend(grip);
    btn.draggable=desktop();
    btn.addEventListener('dragstart',e=>{
      if(!desktop()){e.preventDefault();return;}
      dragged=btn;dropDone=false;btn.classList.add('news-order-dragging');
      if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',btn.dataset.cat)}
    });
    btn.addEventListener('dragover',e=>{if(dragged&&desktop()){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move'}});
    btn.addEventListener('drop',e=>{
      if(!dragged||!desktop())return;e.preventDefault();e.stopPropagation();
      if(dragged!==btn){const before=items(bar);if(before.indexOf(dragged)<before.indexOf(btn))btn.after(dragged);else btn.before(dragged);
        const order=items(bar).map(b=>b.dataset.cat);localStorage.setItem(KEY,JSON.stringify(order));
        const hidden=document.getElementById('newsSubNav');if(hidden){order.forEach(key=>{const el=[...hidden.querySelectorAll('.cat-pill[data-cat]')].find(x=>x.dataset.cat===key);if(el)hidden.appendChild(el)})}
      }
      dropDone=true;
    });
    btn.addEventListener('dragend',()=>{dragged?.classList.remove('news-order-dragging');dragged=null});
  });
  window.addEventListener('resize',()=>buttons.forEach(btn=>btn.draggable=desktop()));
 }
 // A látható menüsor a DOMContentLoaded után, egy másik inicializálóban jön létre.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,350),{once:true});
 else setTimeout(init,350);
})();

/* 4ty 34: Beállítások önálló asztali nézet – nav kijelölés szinkronban. */
(()=>{
 'use strict';
 const desktop=()=>window.matchMedia('(min-width:1024px)').matches;
 function syncSettingsNav(){
   if(!desktop())return;
   const active=document.body.classList.contains('desktop-settings-page') ? 'settings' :
     document.getElementById('savedLibraryView') ? 'saved' : null;
   if(!active)return;
   document.querySelectorAll('#modernDesktopNav [data-modern-view]').forEach(btn=>{
     const selected=btn.dataset.modernView===active;
     btn.classList.toggle('is-active',selected);
     if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
   });
 }
 function init(){
   new MutationObserver(syncSettingsNav).observe(document.body,{attributes:true,attributeFilter:['class']});
   new MutationObserver(syncSettingsNav).observe(document.documentElement,{childList:true,subtree:true});
   document.querySelector('#modernDesktopNav [data-modern-view="saved"]')?.addEventListener('click',()=>setTimeout(syncSettingsNav,0));
   syncSettingsNav();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* 4ty 35: asztali Mentett / Beállítások váltás egységes kezelése. */
(()=>{
 'use strict';
 const desktop=()=>window.matchMedia('(min-width:1024px)').matches;
 const libraryOpen=()=>!!document.getElementById('savedLibraryView');
 function sync(){
   if(!desktop())return;
   const settings=document.body.classList.contains('desktop-settings-page');
   const saved=!settings&&libraryOpen();
   document.querySelectorAll('#modernDesktopNav [data-modern-view],#modernDesktopNav [data-modern-library]').forEach(btn=>{
     const active=settings?btn.dataset.modernView==='settings':saved?btn.hasAttribute('data-modern-library'):false;
     if(settings||saved){
       btn.classList.toggle('is-active',active);
       if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
     }
   });
 }
 function init(){
   const nav=document.getElementById('modernDesktopNav');if(!nav)return;
   // Capture phase: the older delegated click handler must not reopen the previous view.
   nav.addEventListener('click',e=>{
     if(!desktop())return;
     const btn=e.target.closest('[data-modern-library],[data-modern-view]');
     if(!btn||!nav.contains(btn))return;
     if(btn.hasAttribute('data-modern-library')||btn.dataset.modernView==='saved'){
       e.preventDefault();e.stopImmediatePropagation();
       window.closeSettingsModal?.();
       document.body.classList.remove('desktop-settings-page');
       window.openSavedLibrary?.('all');
       requestAnimationFrame(sync);
     }else if(btn.dataset.modernView==='settings'){
       e.preventDefault();e.stopImmediatePropagation();
       window.closeSavedLibrary?.();
       window.openSettingsModal?.();
       requestAnimationFrame(sync);
     }
   },true);
   new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
   // A Mentett nézet beszúrását / eltávolítását is kövessük.
   const main=document.getElementById('modernContentLayout')||document.getElementById('newsFeed')?.parentElement;
   if(main)new MutationObserver(sync).observe(main,{childList:true});
   sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* 4ty 40 — modern desktop Settings dashboard. Existing handlers remain authoritative. */
(()=>{
 'use strict';
 const desktop=()=>matchMedia('(min-width:1024px)').matches;
 const $=id=>document.getElementById(id);
 function init(){
   const modal=$('settingsModal'), scroller=modal?.querySelector(':scope > div > .overflow-y-auto');
   if(!desktop()||!modal||!scroller||modal.dataset.settings40)return;
   const appearance=scroller.querySelector('.v8-settings-section:has(.v8-settings-theme)');
   const backup=scroller.querySelector('.v8-settings-section:has(button[onclick*="exportUserAccountBackup"])');
   const topics=scroller.querySelector('.v8-settings-section:has(#settingsAllCategoryMutes)');
   const sources=scroller.querySelector('.v8-settings-section:has(#catalogList)');
   if(!appearance||!backup||!topics||!sources)return;
   modal.dataset.settings40='1';
   modal.classList.add('settings40-ready');
   const panel=modal.firstElementChild;
   const head=panel?.firstElementChild;
   head?.querySelector('h3')?.replaceChildren(document.createTextNode('Beállítások'));
   const subtitle=head?.querySelector('p');
   if(subtitle)subtitle.textContent='Szabályozd, hogyan jelenjen meg a tartalom, és kezeld az adataidat.';
   const headerIcon=document.createElement('span');headerIcon.className='settings40-header-icon';headerIcon.textContent='⚙';
   head?.prepend(headerIcon);
   const deck=document.createElement('div');deck.className='settings40-deck';
   const top=document.createElement('div');top.className='settings40-top';
   appearance.classList.add('settings40-appearance');
   backup.classList.add('settings40-backup');
   topics.classList.add('settings40-topics');
   sources.classList.add('settings40-sources');
   const appearanceRow=appearance.querySelector('.v8-settings-theme');
   if(appearanceRow){
     appearanceRow.classList.add('settings40-theme-options');
     appearanceRow.replaceChildren();
     const modes=[['☀️','Világos','light'],['🌙','Sötét','dark'],['🖥️','Rendszer','system']];
     const media=matchMedia('(prefers-color-scheme: dark)');
     function selected(){return localStorage.getItem('4ty_modern_theme')||'system';}
     function sync(){
       appearanceRow.querySelectorAll('button').forEach(b=>{
         const active=b.dataset.mode===selected();
         b.classList.toggle('is-selected',active);
         b.setAttribute('aria-pressed',String(active));
       });
     }
     modes.forEach(([emoji,label,mode])=>{
       const b=document.createElement('button');b.type='button';b.dataset.mode=mode;
       b.innerHTML='<span aria-hidden="true">'+emoji+'</span><strong>'+label+'</strong>';
       b.addEventListener('click',()=>{
         const dark=mode==='system'?media.matches:mode==='dark';
         if(mode==='system')localStorage.removeItem('4ty_modern_theme');
         else localStorage.setItem('4ty_modern_theme',mode);
         document.documentElement.classList.toggle('dark',dark);
         const toggle=$('themeToggleBtn');if(toggle)toggle.textContent=dark?'☀︎':'🌙';
         sync();
       });
       appearanceRow.appendChild(b);
     });
     media.addEventListener?.('change',()=>{
       if(selected()==='system'){
         document.documentElement.classList.toggle('dark',media.matches);
         const toggle=$('themeToggleBtn');if(toggle)toggle.textContent=media.matches?'☀︎':'🌙';
       }
     });
     sync();
   }
   const title=topics.querySelector('.v8-settings-heading');
   if(title)title.textContent='Témák és szűrés';
   const tools=document.createElement('div');tools.className='settings40-topic-tools';
   tools.innerHTML='<span class="settings40-topic-count" aria-live="polite"></span><button type="button" data-all="show">◉ Összes látható</button><button type="button" data-all="hide">◌ Mindent elrejt</button>';
   topics.querySelector('.v8-settings-intro')?.after(tools);
   const list=$('settingsAllCategoryMutes');
   const topicIcons={
     gazdasag:['📈','#2ed977'],technologia:['⚙️','#bf60ff'],politika:['🏛️','#ff525b'],
     sport:['⚽','#3be875'],bulvar:['⭐','#f44dcb'],tudomany:['🧪','#36baff'],
     egeszseg:['❤️','#ff5268'],eletmod:['🌿','#f4cb45'],kornyezet:['🍃','#19db9e'],
     kultura:['🎭','#c76cff'],gaming:['🎮','#ff9d24'],utazas:['✈️','#22d7e6'],
     auto:['🚘','#a6b8d5'],gasztronomia:['🍴','#ff9e31'],kulfold:['🌍','#459bff'],
     nemzetkozi:['🌍','#459bff'],autok:['🚘','#a6b8d5']
   };
   const topicFallback=['#30d992','#ba6aff','#ff5d72','#44a8ff','#ffb13a','#22cfde'];
   function syncTopics(){
     if(!list)return;
     list.querySelectorAll('.settings-category-mute').forEach((b,index)=>{
       const label=b.children[0];
       const status=b.children[1];
       if(!label||!status)return;
       const hidden=b.dataset.hidden==='1' || status.textContent.trim()==='REJTVE';
       const original=label.dataset.originalLabel||label.textContent.trim();
       label.dataset.originalLabel=original;
       const key=original.toLocaleLowerCase('hu-HU').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
       const match=Object.entries(topicIcons).find(([k])=>key.includes(k));
       const [emoji,color]=match?.[1]||[original.match(/^[^\p{L}\p{N}]+/u)?.[0]?.trim()||'📰',topicFallback[index%topicFallback.length]];
       let ico=label.querySelector('.settings41-topic-icon');
       if(!ico){
         label.textContent='';
         ico=document.createElement('span');ico.className='settings41-topic-icon';ico.setAttribute('aria-hidden','true');
         const name=document.createElement('span');name.className='settings41-topic-name';name.textContent=original.replace(/^[^\p{L}\p{N}]+/u,'').trim();
         label.append(ico,name);
       }
       ico.textContent=emoji;ico.style.setProperty('--topic-color',color);
       b.classList.toggle('settings40-muted',hidden);
       b.dataset.hidden=hidden?'1':'0';
       status.textContent='';
       status.className='settings41-switch';
       status.setAttribute('aria-hidden','true');
       b.setAttribute('role','switch');
       b.setAttribute('aria-checked',String(!hidden));
       b.setAttribute('aria-label',original+' – '+(hidden?'rejtve':'látható'));
     });
     const total=list.querySelectorAll('.settings-category-mute').length;
     const shown=list.querySelectorAll('.settings-category-mute:not(.settings40-muted)').length;
     tools.querySelector('.settings40-topic-count').textContent=shown+' / '+total+' téma látható';
   }
   list?.addEventListener('click',()=>setTimeout(syncTopics,0));
   tools.querySelectorAll('[data-all]').forEach(b=>b.addEventListener('click',()=>{
     const hide=b.dataset.all==='hide';
     const buttons=[...list.querySelectorAll('.settings-category-mute')];
     buttons.forEach(btn=>{
       const currentlyHidden=btn.classList.contains('settings40-muted');
       if(currentlyHidden!==hide)btn.click();
     });
     setTimeout(syncTopics,0);
   }));
   const observer=new MutationObserver(()=>{if(desktop())syncTopics()});
   // Re-render can replace all category buttons, so observe only direct children.
   if(list)observer.observe(list,{childList:true});
   syncTopics();
   sources.querySelector('.v8-settings-heading')?.replaceChildren(document.createTextNode('Források kezelése'));
   const sourceHeader=document.createElement('button');
   sourceHeader.type='button';sourceHeader.className='settings41-source-toggle';
   sourceHeader.setAttribute('aria-expanded','false');
   sourceHeader.innerHTML='<span class="settings41-source-icon" aria-hidden="true">📡</span><span class="settings41-source-text"><strong>Források kezelése</strong><small>Szabályozd, mely források tartalmait szeretnéd látni.</small></span><span class="settings41-chevron" aria-hidden="true">⌄</span>';
   const sourceBody=document.createElement('div');sourceBody.className='settings41-source-body';
   while(sources.firstChild)sourceBody.appendChild(sources.firstChild);
   sources.append(sourceHeader,sourceBody);
   const explanation=document.createElement('p');
   explanation.className='settings48-source-explanation';
   explanation.textContent='Az engedélyezés nem jelent követést: csak azt szabályozza, hogy a forrás tartalmai megjelenhetnek-e. Podcastokat és videócsatornákat külön követhetsz.';
   sourceBody.prepend(explanation);
   sourceHeader.addEventListener('click',()=>{
     const expanded=sourceHeader.getAttribute('aria-expanded')!=='true';
     if (!expanded) {
       const search=sources.querySelector('#catalogList input[type="search"]');
       if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
       window.dispatchEvent(new Event('4ty:source-catalog-closed'));
     }
     sourceHeader.setAttribute('aria-expanded',String(expanded));
     sources.classList.toggle('settings41-expanded',expanded);
   });
   // Recompose the desktop-only layout; no original control is cloned.
   scroller.insertBefore(deck,scroller.firstChild);
   deck.append(top,topics,sources);
   top.append(appearance,backup);
   // Veszélyes művelet: külön megerősítő felület, nincs egykattintásos törlés.
   const resetSection=document.createElement('section');
   resetSection.className='settings44-reset';
   resetSection.innerHTML='<div><strong>Alaphelyzetbe állítás</strong><p>Az ezen a webhelyen tárolt helyi adatok törlése.</p></div><button type="button" class="settings44-reset-trigger">Helyi adatok törlése</button>';
   deck.append(resetSection);
   const resetDialog=document.createElement('div');resetDialog.className='settings44-reset-dialog';
   resetDialog.setAttribute('role','dialog');resetDialog.setAttribute('aria-modal','true');
   resetDialog.setAttribute('aria-labelledby','settings44-reset-title');
   resetDialog.hidden=true;
   resetDialog.innerHTML='<div class="settings44-reset-panel"><h3 id="settings44-reset-title">⚠️ Biztosan törlöd a helyi adatokat?</h3><p>Ez a művelet törli a webhely teljes localStorage-tartalmát, beleértve a 4ty beállításait, helyi mentéseit és esetleges bejelentkezési adatait. Kijelentkeztethet. A szerveren tárolt adatokat nem törli.</p><label><input type="checkbox" class="settings44-reset-ack"> Megértettem, hogy a helyi adatok nem állíthatók vissza automatikusan.</label><div class="settings44-reset-buttons"><button type="button" class="settings44-reset-cancel">Mégse</button><button type="button" class="settings44-reset-confirm" disabled>Végleges törlés</button></div></div>';
   document.body.append(resetDialog);
   const ack=resetDialog.querySelector('.settings44-reset-ack');
   const confirm=resetDialog.querySelector('.settings44-reset-confirm');
   const closeReset=()=>{resetDialog.hidden=true;ack.checked=false;confirm.disabled=true;};
   resetSection.querySelector('button').addEventListener('click',()=>{resetDialog.hidden=false;resetDialog.querySelector('.settings44-reset-cancel').focus();});
   resetDialog.querySelector('.settings44-reset-cancel').addEventListener('click',closeReset);
   resetDialog.addEventListener('click',e=>{if(e.target===resetDialog)closeReset();});
   ack.addEventListener('change',()=>{confirm.disabled=!ack.checked;});
   confirm.addEventListener('click',()=>{
     if(!ack.checked)return;
     try{localStorage.clear();window.location.reload();}
     catch(err){console.error('Helyi adatok törlése sikertelen:',err);closeReset();window.alert('Nem sikerült törölni a helyi adatokat.');}
   });

   const oldLabel=[...scroller.children].find(el=>el.classList?.contains('v8-settings-group-label'));
   if(oldLabel)oldLabel.classList.add('settings40-old-own-label');
   const oldNav=$('desktopSettingsSections');if(oldNav)oldNav.classList.add('settings40-old-nav');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,300));
 else setTimeout(init,300);
})();


/* 4ty 46 – a rejtett hírtémák az asztali Hírek menüsorból is eltűnnek. */
(()=>{
 'use strict';
 const desktop=()=>window.matchMedia('(min-width:1024px)').matches;
 const alwaysVisible=new Set(['all','reflektor','news_hub']);
 function muted(){
   try{
     const profile=JSON.parse(localStorage.getItem('4ty_user_dna')||'{}');
     return new Set(Array.isArray(profile.mute_categories)?profile.mute_categories:[]);
   }catch{return new Set()}
 }
 function sync(){
   if(!desktop())return;
   const bar=document.getElementById('modernQuickCats');
   if(!bar)return;
   const hidden=muted();
   const buttons=[...bar.querySelectorAll('.modern-quick-cat[data-cat]')];
   buttons.forEach(button=>{
     const off=!alwaysVisible.has(button.dataset.cat)&&hidden.has(button.dataset.cat);
     button.hidden=off;
     button.style.setProperty('display',off?'none':'','important');
     button.setAttribute('aria-hidden',String(off));
   });
   const selected=buttons.find(b=>b.classList.contains('is-active')&&!b.hidden);
   if(!selected){
     const next=buttons.find(b=>!b.hidden);
     if(next)next.click();
   }
 }
 window.addEventListener('4ty:muted-categories-changed',sync);
 window.addEventListener('storage',e=>{if(e.key==='4ty_user_dna')sync()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,450),{once:true});
 else setTimeout(sync,450);
 // A meglévő menürendezés és Hírek/Média nézetváltás mellett is szinkronban marad.
 document.addEventListener('click',e=>{
   if(e.target.closest('[data-modern-view="news"],#pillarNewsBtn'))setTimeout(sync,0);
 });
})();



/* v56: desktop-only clean title control next to the news sorting tools. */
(()=>{
 'use strict';
 const desktop=()=>matchMedia('(min-width:1024px)').matches;
 function init(){
  if(!desktop())return;
  const original=document.getElementById('antiClickbaitBtn');
  if(!original||document.getElementById('modernDesktopCleanTitle'))return;
  const host=document.getElementById('modernFilters')||document.getElementById('newsSearchBar');
  if(!host)return;
  const wrap=document.createElement('div');wrap.id='modernDesktopCleanTitle';
  const label=document.createElement('span');label.textContent='Tiszta cím';
  const btn=document.createElement('button');btn.type='button';btn.className='modern-clean-switch';
  btn.setAttribute('role','switch');btn.setAttribute('aria-label','Tiszta címek megjelenítése');
  btn.innerHTML='<span aria-hidden="true"></span>';
  const sync=()=>{
   const on=JSON.parse(localStorage.getItem('4ty_anti_clickbait')||'true');
   btn.setAttribute('aria-checked',String(on));
   wrap.title=on?'Tiszta címek bekapcsolva':'Eredeti címek megjelenítése';
  };
  btn.addEventListener('click',()=>{original.click();sync()});
  wrap.append(label,btn);host.append(wrap);sync();
  const observer=new MutationObserver(sync);
  observer.observe(original,{attributes:true,attributeFilter:['aria-pressed']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* 4ty 59 — Forrásaim önálló asztali nézet, a régi Hub-funkciók megtartásával. */
(()=>{
 'use strict';
 const desktop=()=>matchMedia('(min-width:1024px)').matches;
 const $=id=>document.getElementById(id);
 function init(){
   const hub=$('desktopHubNav');
   if(!hub||hub.dataset.sources59)return;
   hub.dataset.sources59='1';
   const heading=hub.querySelector('summary span:nth-child(2)');
   if(heading)heading.textContent='Forrásaim';
   const links=[...hub.querySelectorAll('button')];
   const update=()=>{
     if(!desktop()){
       document.body.classList.remove('desktop-sources-page');return;
     }
     const pillar=localStorage.getItem('4ty_current_pillar')||'news';
     const category=localStorage.getItem(pillar==='video'?'4ty_current_video_category':'4ty_current_news_category');
     const isSources=(pillar==='news'&&category==='news_hub')||(pillar==='video'&&category==='media_hub');
     const settings=document.body.classList.contains('desktop-settings-page');
     const saved=!!$('savedLibraryView');
     const active=isSources&&!settings&&!saved;
     document.body.classList.toggle('desktop-sources-page',active);
     hub.classList.toggle('is-active',active);
     if(active)hub.setAttribute('aria-current','page');else hub.removeAttribute('aria-current');
     links.forEach((btn,i)=>{
       const on=active&&(pillar===(i===0?'news':'video'));
       btn.classList.toggle('is-active',on);
       if(on)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
     });
     if(active){
       // A Forrásaim oldal két meglévő katalógusának önálló címe.
       document.querySelectorAll('.hub-refresh--news .hub-hero h2,.hub-refresh--media .hub-hero h2').forEach(el=>{
         const name=el.closest('.hub-refresh--news')?'Hírforrásaim':'Médiaforrásaim';
         if(el.textContent!==name)el.textContent=name;
       });
       // A fő Hírek/Média menüpont ne maradjon egyszerre kijelölve.
       document.querySelectorAll('#modernDesktopNav > [data-modern-view="news"],#modernDesktopNav > [data-modern-view="video"]').forEach(b=>{
         b.classList.remove('is-active');b.removeAttribute('aria-current');
       });
     }
   };
   hub.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
     requestAnimationFrame(update);setTimeout(update,90);setTimeout(update,260);
   }));
   document.querySelectorAll('#modernDesktopNav [data-modern-view],#modernDesktopNav [data-modern-library],#newsSubNav .cat-pill,#videoSubNav .vcat-pill').forEach(btn=>btn.addEventListener('click',()=>setTimeout(update,80)));
   window.addEventListener('storage',update);
   window.addEventListener('resize',update);
   const feed=$('newsFeed');
   if(feed){let scheduled=false;new MutationObserver(()=>{
     if(scheduled)return;scheduled=true;
     requestAnimationFrame(()=>{scheduled=false;update();});
   }).observe(feed,{childList:true,subtree:false});}
   update();setTimeout(update,300);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,400));else setTimeout(init,400);
})();


/* 4ty 61 — Mentett -> Forrásaim navigáció, desktop. */
(()=>{
 'use strict';
 const desktop=()=>window.matchMedia('(min-width:1024px)').matches;
 const setup=()=>{
  const hub=document.getElementById('desktopHubNav');
  if(!hub||hub.dataset.savedToSources61)return;
  hub.dataset.savedToSources61='1';
  // Capture: a Mentett önálló nézetét még a Hub saját kattintáskezelője előtt bezárjuk.
  hub.addEventListener('click',e=>{
   if(!desktop())return;
   const button=e.target.closest('button');
   if(!button||!hub.contains(button))return;
   if(document.getElementById('savedLibraryView'))window.closeSavedLibrary?.();
   window.closeSettingsModal?.();
   document.body.classList.remove('desktop-settings-page');
   // A korábbi Hub gombok eredeti navigációs eseménye továbbfut.
   requestAnimationFrame(()=>{
    const pillar=localStorage.getItem('4ty_current_pillar')||'news';
    const cat=localStorage.getItem(pillar==='video'?'4ty_current_video_category':'4ty_current_news_category');
    const isHub=cat===(pillar==='video'?'media_hub':'news_hub');
    document.body.classList.toggle('desktop-sources-page',isHub);
    hub.classList.toggle('is-active',isHub);
    if(isHub){hub.setAttribute('aria-current','page');window.scrollTo({top:0,behavior:'smooth'});}
   });
  },true);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,450),{once:true});
 else setTimeout(setup,450);
})();
