import { supabase } from '/js/auth.js';
const ids = ['loading','login','denied','dashboard'];
let sourcesLoaded = false;
let sourcePage = 0;
const pageSize = 50;
let sourceQuery = '';
let sourceRequest = 0;
const $ = id => document.getElementById(id);
function show(id) { for (const x of ids) $(x).hidden = x !== id; }
async function checkAccess() {
  show('loading');
  try {
    const {data:{user},error} = await supabase.auth.getUser();
    if (error || !user || user.is_anonymous) { show('login'); return; }
    // The public.admin_users table must be protected by RLS; see setup.sql.
    const {data, error: accessError} = await supabase.from('admin_users')
      .select('user_id').eq('user_id',user.id).maybeSingle();
    if (accessError) throw accessError;
    if (!data) { show('denied'); return; }
    $('admin-email').textContent = user.email || 'Adminisztrátor';
    show('dashboard');
  } catch (e) {
    show('login');
    $('login-error').textContent = 'Az adminjogosultság ellenőrzése nem sikerült. Ellenőrizd az adatbázis beállításait.';
    console.error('Admin access check failed', e);
  }
}
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('login-error').textContent = '';
  const button = e.currentTarget.querySelector('button'); button.disabled = true;
  try {
    const {error} = await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    if (error) throw error;
    $('password').value = '';
    await checkAccess();
  } catch(e) { $('login-error').textContent = 'Sikertelen belépés. Ellenőrizd az adataidat.'; }
  finally { button.disabled = false; }
});
for (const id of ['logout','logout-denied']) $(id).addEventListener('click', async () => { await supabase.auth.signOut(); show('login'); });
await checkAccess();

// Read-only source catalogue. The database's RLS rules remain authoritative.
const sourceBody = $('sources-body');
const sourceStatus = $('sources-status');
function safeUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; }
  catch { return null; }
}
function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value == null ? '—' : String(value);
  row.append(cell);
  return cell;
}
async function loadSources() {
  const request = ++sourceRequest;
  sourceBody.replaceChildren();
  sourceStatus.textContent = 'Források betöltése…';
  $('sources-prev').disabled = true;
  $('sources-next').disabled = true;
  try {
    const {data:{user},error:userError} = await supabase.auth.getUser();
    if (userError || !user || user.is_anonymous) throw new Error('Nincs érvényes admin munkamenet.');
    const {data:access,error:accessError} = await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
    if (accessError || !access) throw new Error('Adminjogosultság nem ellenőrizhető.');
    let query = supabase.from('sources_catalog').select('id,title,category,feed_url,source_type,is_active', {count:'exact'}).order('title', {ascending:true}).range(sourcePage*pageSize, (sourcePage+1)*pageSize-1);
    if (sourceQuery) {
      // Supabase text filters use PostgREST syntax; escape wildcard/special characters.
      const q = sourceQuery.replace(/[%,()\\]/g,' ').trim();
      if (q) query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%,feed_url.ilike.%${q}%`);
    }
    const {data,error,count} = await query;
    if (request !== sourceRequest) return;
    if (error) throw error;
    for (const source of data || []) {
      const tr = document.createElement('tr');
      addCell(tr,source.title); addCell(tr,source.category); addCell(tr,source.source_type);
      const td = addCell(tr,'');
      const url = safeUrl(source.feed_url);
      if (url) { const a = document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=source.feed_url; td.append(a); }
      else td.textContent=source.feed_url || '—';
      addCell(tr, source.is_active ? 'Aktív' : 'Letiltva');
      const actionCell = addCell(tr, '');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'source-toggle';
      toggle.textContent = source.is_active ? 'Letiltás' : 'Aktiválás';
      toggle.addEventListener('click', () => toggleSource(source, toggle));
      actionCell.append(toggle);
      sourceBody.append(tr);
    }
    const total = count ?? 0;
    sourceStatus.textContent = `${total} találat`;
    $('sources-page').textContent = `${sourcePage+1}. oldal / ${Math.max(1,Math.ceil(total/pageSize))}`;
    $('sources-prev').disabled = sourcePage===0;
    $('sources-next').disabled = (sourcePage+1)*pageSize>=total;
    if (!data?.length) { const tr=document.createElement('tr'); const td=document.createElement('td'); td.colSpan=6; td.textContent='Nincs megjeleníthető forrás.'; tr.append(td); sourceBody.append(tr); }
    sourcesLoaded = true;
  } catch(e) {
    if (request !== sourceRequest) return;
    sourceStatus.textContent = 'Nem sikerült betölteni a forrásokat. Ellenőrizd a sources_catalog SELECT jogosultságát és a kapcsolatot.';
    console.error('Source listing failed',e);
  }
}
async function toggleSource(source, button) {
  const next = !source.is_active;
  const verb = next ? 'aktiválni' : 'letiltani';
  if (!window.confirm(`Biztosan szeretnéd ${verb} ezt a forrást?\n${source.title}`)) return;
  button.disabled = true;
  const previousStatus = sourceStatus.textContent;
  sourceStatus.textContent = 'Módosítás folyamatban…';
  try {
    const {data:{user},error:userError} = await supabase.auth.getUser();
    if (userError || !user || user.is_anonymous) throw new Error('Érvénytelen munkamenet.');
    const {data:access,error:accessError} = await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
    if (accessError || !access) throw new Error('Nincs adminjogosultság.');
    const {data,error} = await supabase.from('sources_catalog')
      .update({is_active:next}).eq('id',source.id).eq('is_active',source.is_active)
      .select('id,is_active');
    if (error) throw error;
    if (!data || data.length !== 1 || data[0].is_active !== next) throw new Error('A módosítás nem történt meg. Ellenőrizd az RLS szabályokat.');
    sourcesLoaded = false;
    await loadSources();
  } catch (e) {
    console.error('Source state update failed',e);
    sourceStatus.textContent = `Sikertelen módosítás: ${e.message || 'Ismeretlen hiba'}`;
    button.disabled = false;
  }
}
function selectTab(tab) {
  $('overview-view').hidden = tab !== 'overview';
  $('sources-view').hidden = tab !== 'sources';
  $('tab-overview').classList.toggle('active',tab==='overview');
  $('tab-sources').classList.toggle('active',tab==='sources');
  if (tab==='sources' && !sourcesLoaded) loadSources();
}
$('tab-overview').addEventListener('click',()=>selectTab('overview'));
$('tab-sources').addEventListener('click',()=>selectTab('sources'));
$('refresh-sources').addEventListener('click',()=>loadSources());
$('sources-prev').addEventListener('click',()=>{if(sourcePage>0){sourcePage--;loadSources();}});
$('sources-next').addEventListener('click',()=>{sourcePage++;loadSources();});
let searchDebounce;
$('source-search').addEventListener('input',e=>{clearTimeout(searchDebounce);searchDebounce=setTimeout(()=>{sourceQuery=e.target.value.trim();sourcePage=0;loadSources();},350);});
