// js/api.js - 4ty.hu Adatlekérési Modul (v18.4 - Reflektor mezőlista javítás)
import { CONFIG } from '4ty/config';
import { supabase, ensureAnonymousSession } from '4ty/auth';

function parseArrayField(value) {
if (Array.isArray(value)) return value;
if (typeof value === 'string') {
try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch (_) {}
}
return [];
}

const ARTICLE_FIELDS = [
'id','source_id','source_name','category','url',
'original_title','clean_title','lead','image_url',
'bullets','tags','is_opinion','is_politics','is_sport','is_tabloid',
'related_sources','reading_time','published_at','created_at'
].join(',');

const SOURCE_FIELDS = [
'id','title','category','feed_url','source_type',
'upvotes','is_community','submitted_by','image_url'
].join(',');

// A reflektor_posts tábla ténylegesen létező oszlopai.
const REFLEKTOR_FIELDS = [
'id','author','title','lead','content','published_at','reading_time'
].join(',');

const MEDIA_FIELDS = [
'id','media_type','source','source_id','category','title','lead',
'published_at','duration_minutes','audio_url','spotify_url',
'youtube_id','image_url','url','upvotes','clickbait_count',
'is_community','submitted_by'
].join(',');

const headers = {
'apikey': CONFIG.SUPABASE_ANON_KEY,
'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
'Content-Type': 'application/json'
};

// 1. Cikk rekord normalizálása
function mapArticle(item) {
return {
id: item.id,
source_id: item.source_id,
source: item.source_name,
source_name: item.source_name,
cat: item.category,
category: item.category,
title: item.original_title,
cleanTitle: item.clean_title || item.original_title,
clean_title: item.clean_title || item.original_title,
lead: item.lead || '',
imageUrl: item.image_url,
bullets: parseArrayField(item.bullets),
tags: parseArrayField(item.tags),
isOpinion: item.is_opinion || false,
is_opinion: item.is_opinion || false,
isPolitics: item.is_politics || false,
is_politics: item.is_politics || false,
isSport: item.is_sport || false,
is_sport: item.is_sport || false,
isTabloid: item.is_tabloid || false,
is_tabloid: item.is_tabloid || false,
relatedSources: parseArrayField(item.related_sources),
related_sources: parseArrayField(item.related_sources),
url: item.url,
published_at: item.published_at || item.created_at || '',
time: item.published_at || item.created_at || '',
timestamp: (item.published_at || item.created_at) ? new Date(item.published_at || item.created_at).getTime() : Date.now(),
readMinutes: item.reading_time || 3,
upvotes: 80,
clickbaitCount: 0
};
}

// 2. Általános sajtóhírek lekérése – könnyű, globális fő feed
export async function fetchArticlesFromDb() {
try {
const res = await fetch(`${CONFIG.REST_URL}/articles?select=${ARTICLE_FIELDS}&order=published_at.desc&limit=150`, { headers });
if (!res.ok) throw new Error(`Articles DB hiba: ${res.status}`);
const data = await res.json();
return Array.isArray(data) ? data.map(mapArticle) : [];
} catch (err) {
console.warn("Nem sikerült elérni az articles táblát:", err);
return [];
}
}

// 3. Követett források cikkei – nem veszhetnek el a globális top 150 miatt.
// Forrásonként külön, kis lekérést végzünk, így sok követésnél sem kérjük le az egész adatbázist.
export async function fetchArticlesBySourceIds(sourceIds, perSourceLimit = 10) {
const ids = [...new Set((Array.isArray(sourceIds) ? sourceIds : []).filter(Boolean))];
if (!ids.length) return [];

const batches = [];
for (let i = 0; i < ids.length; i += 10) batches.push(ids.slice(i, i + 10));

try {
const results = await Promise.all(batches.map(async batch => {
const filter = batch.map(id => `"${String(id).replace(/"/g, '')}"`).join(',');
const limit = Math.max(10, Math.min(100, perSourceLimit * batch.length));
const url = `${CONFIG.REST_URL}/articles?select=${ARTICLE_FIELDS}&source_id=in.(${encodeURIComponent(filter)})&order=published_at.desc&limit=${limit}`;
const res = await fetch(url, { headers });
if (!res.ok) throw new Error(`Követett cikkek DB hiba: ${res.status}`);
const data = await res.json();
return Array.isArray(data) ? data.map(mapArticle) : [];
}));
return results.flat();
} catch (err) {
console.warn("Nem sikerült a követett források cikkeit lekérni:", err);
return [];
}
}

// Közös, rövid élettartamú forrásadat-cache a katalógushoz és a médiához.
// A párhuzamos hívások ugyanazt a hálózati kérést használják.
const SOURCE_CACHE_MS = 60_000;
let sourceCache = null;
let sourceCacheUntil = 0;
let sourcePending = null;
async function loadSourceRows() {
  if (sourceCache && Date.now() < sourceCacheUntil) return sourceCache;
  if (sourcePending) return sourcePending;
  sourcePending = (async () => {
    const fields = `${SOURCE_FIELDS},is_active`;
    const res = await fetch(`${CONFIG.REST_URL}/sources_catalog?select=${fields}&order=title.asc`, { headers });
    if (!res.ok) throw new Error(`sources_catalog hiba: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Érvénytelen forráskatalógus válasz.');
    sourceCache = data;
    sourceCacheUntil = Date.now() + SOURCE_CACHE_MS;
    return data;
  })();
  try { return await sourcePending; }
  finally { sourcePending = null; }
}

// 4. Forráskatalógus lekérése (beleértve a submitted_by mezőt is)
export async function fetchSourcesFromDb() {
try {
const data = await loadSourceRows();
return data.filter(s => s.is_active === true).map(s => ({
id: s.id,
title: s.title,
category: s.category,
feed_url: s.feed_url,
source_type: s.source_type,
upvotes: s.upvotes || 80,
is_community: s.is_community || false,
submitted_by: s.submitted_by || null,
imageUrl: s.image_url || '',
image_url: s.image_url || ''
}));
} catch (e) {
console.warn("Forráskatalógus hiba:", e);
return [];
}
}

// 3. Reflektor bejegyzések lekérése
export async function fetchReflektorPostsFromDb() {
try {
const res = await fetch(`${CONFIG.REST_URL}/reflektor_posts?select=${REFLEKTOR_FIELDS}&order=published_at.desc`, { headers });
if (!res.ok) throw new Error(`Reflektor DB hiba: ${res.status}`);
const data = await res.json();
return data.map(post => ({
id: post.id,
isReflektor: true,
cat: 'reflektor',
category: 'reflektor',
author: {
name: post.author || post.author_name || "4ty Reflektor",
bio: post.author_bio || "Független elemzés."
},
source: "4ty Reflektor",
source_name: "4ty Reflektor",
title: post.title,
cleanTitle: post.title,
lead: post.lead,
content: post.content,
time: "Kiemelt",
timestamp: post.published_at ? new Date(post.published_at).getTime() : Date.now(),
readMinutes: parseInt(post.reading_time) || 5,
upvotes: post.upvotes || 95,
clickbaitCount: 0
}));
} catch (err) {
console.warn("Nem sikerült elérni a reflektor_posts táblát:", err);
return [];
}
}

// 4. Média elemek lekérése (Biztonságos kétlépcsős lekérdezés, különválasztott csatorna fix képpel és tulajdonos adatokkal)
export async function fetchMediaFromDb() {
try {
// A médiaelemeket és a forrásmetaadatokat párhuzamosan kérjük le.
// A 04-es javítás közös forrás-cache-e továbbra is működik.
const [sourcesData, data] = await Promise.all([
  loadSourceRows().catch(err => {
    console.warn('Médiaforrások metaadatai nem érhetők el:', err);
    return [];
  }),
  (async () => {
    const res = await fetch(`${CONFIG.REST_URL}/media_items?select=${MEDIA_FIELDS}&order=published_at.desc&limit=2500`, { headers });
    if (!res.ok) throw new Error(`Média DB hiba: ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error('Érvénytelen médiaadat-válasz.');
    return rows;
  })()
]);
const sourceImageMap = {};
const sourceMetaMap = {};
sourcesData.forEach(s => {
if (s.id && s.image_url) {
sourceImageMap[s.id] = s.image_url;
}
sourceMetaMap[s.id] = {
submitted_by: s.submitted_by || null,
is_community: s.is_community || false
};
});

return data.map(item => {
const yId = item.youtube_id || item.youtubeId;
const sourceDefaultImage = item.source_id ? sourceImageMap[item.source_id] : '';
const computedImageUrl = item.image_url || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : '');
const meta = (item.source_id && sourceMetaMap[item.source_id]) ? sourceMetaMap[item.source_id] : {};

return {
id: item.id,
isAudio: item.media_type === 'podcast',
isVideo: item.media_type === 'video',
source: item.source,
source_name: item.source,
source_id: item.source_id,
vcat: item.category || 'gazdasag',
title: item.title,
cleanTitle: item.title,
lead: item.lead || '',
published_at: item.published_at || '',
time: item.published_at || '',
timestamp: item.published_at ? new Date(item.published_at).getTime() : Date.now(),
readMinutes: item.duration_minutes || 45,
audioUrl: item.audio_url,
spotifyUrl: item.spotify_url,
youtubeId: yId,
imageUrl: computedImageUrl,
image_url: computedImageUrl,
sourceImageUrl: sourceDefaultImage,
source_image_url: sourceDefaultImage,
url: item.url,
upvotes: item.upvotes || 50,
clickbaitCount: item.clickbait_count || 0,
is_community: meta.is_community || item.is_community || false,
isCommunity: meta.is_community || item.isCommunity || false,
submitted_by: meta.submitted_by || null
};
});
} catch (err) {
console.warn("Nem sikerült elérni a media_items táblát:", err);
return [];
}
}

// 5. Upvote küldése
export async function sendUpvoteToDb(targetId, isMedia = false) {
try {
await fetch(`${CONFIG.REST_URL}/rpc/increment_upvote`, {
method: 'POST',
headers,
body: JSON.stringify({ target_id: targetId, is_media: isMedia })
});
} catch (err) {
console.error("Upvote hiba:", err);
}
}

// 6–8. Követések: a régi userUuid paraméter csak kompatibilitás miatt marad.
// A szervernek kizárólag a hitelesített Supabase-felhasználó azonosítóját küldjük.
async function subscriptionAuth() {
  await ensureAnonymousSession();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) throw userError || new Error('Nincs hitelesített felhasználó');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.access_token) {
    throw sessionError || new Error('Nincs érvényes munkamenet');
  }
  return {
    userId: userData.user.id,
    authHeaders: {
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json'
    }
  };
}

export async function fetchUserSubscriptions(_legacyUserUuid) {
  try {
    const { userId, authHeaders } = await subscriptionAuth();
    const response = await fetch(
      `${CONFIG.REST_URL}/user_subscriptions?select=source_id&user_uuid=eq.${encodeURIComponent(userId)}`,
      { headers: authHeaders }
    );
    if (!response.ok) throw new Error(`Követések lekérése: HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data.map(item => item.source_id) : [];
  } catch (error) {
    console.warn('Követések lekérése sikertelen:', error);
    return [];
  }
}

export async function followCommunitySourceInDb(_legacyUserUuid, sourceId) {
  if (!sourceId) return false;
  try {
    const { userId, authHeaders } = await subscriptionAuth();
    const response = await fetch(`${CONFIG.REST_URL}/user_subscriptions`, {
      method: 'POST',
      headers: { ...authHeaders, Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({ user_uuid: userId, source_id: sourceId })
    });
    if (!response.ok) console.warn('Bekövetés sikertelen:', response.status, await response.text());
    return response.ok || response.status === 409;
  } catch (error) {
    console.warn('Bekövetés sikertelen:', error);
    return false;
  }
}

export async function unfollowCommunitySourceInDb(_legacyUserUuid, sourceId) {
  if (!sourceId) return false;
  try {
    const { userId, authHeaders } = await subscriptionAuth();
    const response = await fetch(
      `${CONFIG.REST_URL}/user_subscriptions?user_uuid=eq.${encodeURIComponent(userId)}&source_id=eq.${encodeURIComponent(sourceId)}`,
      { method: 'DELETE', headers: authHeaders }
    );
    if (!response.ok) console.warn('Kikövetés sikertelen:', response.status, await response.text());
    return response.ok;
  } catch (error) {
    console.warn('Kikövetés sikertelen:', error);
    return false;
  }
}
