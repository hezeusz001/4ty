// js/submitter.js - Közösségi forrás bekötő modul (v45.8 - egységes discover-feed mentés)
import { CONFIG } from '4ty/config';
import { supabase, ensureAnonymousSession } from '4ty/auth';

const submitterHeaders = {
  'apikey': CONFIG.SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

async function triggerFeedWorker(feedUrl) {
  if (!CONFIG.FEED_WORKER_URL || !feedUrl) return { ok: false };
  try {
    const res = await fetch(CONFIG.FEED_WORKER_URL, {
      method: 'POST',
      headers: submitterHeaders,
      body: JSON.stringify({ feed_url: feedUrl })
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.warn('Feed worker indítási hiba:', error);
    return { ok: false, error };
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function detectCategoryIntelligently(inputUrl, title) {
  const lower = (inputUrl + ' ' + title).toLowerCase();
  if (lower.includes('tech') || lower.includes('hwsw') || lower.includes('bitport') || lower.includes('g7') || lower.includes('mertek')) return 'tech';
  if (lower.includes('sport') || lower.includes('nso') || lower.includes('foci')) return 'sport';
  if (lower.includes('velvet') || lower.includes('index') || lower.includes('444') || lower.includes('telex') || lower.includes('nlc') || lower.includes('cult')) return 'bulvar';
  if (lower.includes('podcasts.spotify') || lower.includes('youtube.com/@') || lower.includes('podcast')) return 'podcast';
  if (lower.includes('auto') || lower.includes('totalcar') || lower.includes('villanyautos')) return 'auto';
  if (lower.includes('tudomany') || lower.includes('qubit')) return 'tudomany';
  if (lower.includes('portfolio') || lower.includes('vg') || lower.includes('penzcentrum')) return 'gazdasag';
  return 'gazdasag';
}

async function getAuthenticatedSubmitter() {
  const user = await ensureAnonymousSession();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token || !user?.id) {
    throw error || new Error('Nem sikerült létrehozni a hitelesített munkamenetet.');
  }
  return {
    userId: user.id,
    headers: {
      ...submitterHeaders,
      Authorization: `Bearer ${data.session.access_token}`
    }
  };
}

// Egyidejű azonos beküldések esetén ugyanazt a folyamatban lévő kérést használjuk.
const pendingSubmissions = new Map();

export async function submitCommunitySource(rawInput, selectedCat, showToastCallback, enableSourceLocallyFn, userUuid, submitterName) {
  const input = String(rawInput || '').trim();
  if (!input) throw new Error('Add meg a forrás linkjét vagy csatornáját!');
  const finalCategory = (selectedCat === 'auto_ai' || !selectedCat) ? 'auto_ai' : selectedCat;
  const key = `${input}|${finalCategory}|${userUuid || ''}`;
  if (pendingSubmissions.has(key)) return pendingSubmissions.get(key);

  const task = submitCommunitySourceOnce(input, finalCategory, showToastCallback, enableSourceLocallyFn, userUuid, submitterName);
  pendingSubmissions.set(key, task);
  try {
    return await task;
  } finally {
    pendingSubmissions.delete(key);
  }
}

async function submitCommunitySourceOnce(input, finalCategory, showToastCallback, enableSourceLocallyFn, userUuid, submitterName) {
  let feedUrl = input;
  let sourceType = 'article';
  let title = input;
  showToastCallback('🔍 Forrás elemzése...');

  if (input.includes('youtube.com/') || input.includes('youtu.be/') || input.startsWith('@')) {
    sourceType = 'video';
    const handleMatch = input.match(/@([a-zA-Z0-9_\.-]+)/);
    if (handleMatch) {
      title = `YouTube: @${handleMatch[1]}`;
      if (input.startsWith('@')) feedUrl = `https://www.youtube.com/${input}`;
    } else if (input.includes('/channel/')) {
      title = 'YouTube Csatorna';
    } else if (input.includes('/c/') || input.includes('/user/')) {
      const parts = input.split('/');
      const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
      title = `YouTube: ${lastPart}`;
    } else {
      title = 'YouTube Forrás';
    }
  } else if (input.includes('spotify.com/show/')) {
    sourceType = 'podcast';
    title = 'Spotify Podcast Ajánlás';
  } else {
    let cleanInput = input;
    if (!cleanInput.startsWith('http://') && !cleanInput.startsWith('https://')) cleanInput = 'https://' + cleanInput;
    try {
      const parsed = new URL(cleanInput);
      title = parsed.hostname;
    } catch (_) {
      title = cleanInput;
    }
    feedUrl = cleanInput;
  }

  // MINDEN forrás (a közvetlen .xml/.rss linkek is) a discover-feed-en át kerül mentésre.
  // A discover-feed kezeli a meglévő forrást, annak eredeti tulajdonosát és a követést.
  if (!CONFIG.DISCOVER_FEED_URL) throw new Error('Hiányzik a discover-feed szerver címe.');
  showToastCallback(sourceType === 'video'
    ? '📡 YouTube csatorna feloldása a szerveren...'
    : '📡 RSS feed keresése a megadott oldalon...');

  let discovered;
  try {
    const { userId, headers: authHeaders } = await getAuthenticatedSubmitter();
    const discoverRes = await fetch(CONFIG.DISCOVER_FEED_URL, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        url: feedUrl,
        userUuid: userId,
        submitterName: submitterName ? submitterName.trim() : null,
        category: finalCategory
      })
    });
    discovered = await discoverRes.json().catch(() => null);
    if (!discoverRes.ok) {
      throw new Error(discovered?.error || `A szerver nem tudta feldolgozni a forrást (${discoverRes.status}).`);
    }
    if (!discovered?.success) {
      throw new Error(discovered?.error || 'Nem sikerült feloldani ezt a forrást.');
    }
  } catch (err) {
    throw new Error(err.message || 'A forrás feldolgozása elakadt.');
  }

  if (discovered.feedUrl) feedUrl = discovered.feedUrl;
  if (discovered.channelName) title = discovered.channelName;
  if (discovered.sourceType) sourceType = discovered.sourceType;

  // A szerver a mentésért és a követésért is felel. Itt NINCS második
  // sources_catalog POST, PATCH vagy user_subscriptions POST.
  enableSourceLocallyFn(title);
  // A védett feed-worker nem hívható biztonságosan közvetlenül böngészőből.
  /* A szerveroldali feldolgozást a backendnek kell ütemeznie.
  if (CONFIG.FEED_WORKER_URL && feedUrl) {
    showToastCallback(sourceType === 'article'
      ? '⚡ Friss cikkek feldolgozása...'
      : '⚡ Friss epizódok feldolgozása...');
    const workerResult = await triggerFeedWorker(feedUrl);
    if (!workerResult.ok) console.warn('A forrás mentve, de az azonnali worker frissítés nem sikerült:', workerResult);
  }
  */

  const successMessage = discovered.message || (discovered.alreadyExists
    ? `✨ Ez a forrás már létezett, és a követése ellenőrizve: "${title}"`
    : `✨ "${title}" sikeresen bekötve és aktiválva!`);

  return {
    success: true,
    message: successMessage,
    sourceId: discovered.sourceId || null,
    feedUrl,
    sourceType,
    title
  };
}

export async function incrementCommunitySourceByUrl(feedUrl, enableSourceLocallyFn) {
  try {
    const getRes = await fetch(`${CONFIG.REST_URL}/sources_catalog?feed_url=eq.${encodeURIComponent(feedUrl)}`, { headers: submitterHeaders });
    const data = await getRes.json();

    if (Array.isArray(data) && data.length > 0) {
      const sourceRecord = data[0];
      await fetch(`${CONFIG.REST_URL}/rpc/increment_community_source`, {
        method: 'POST',
        headers: submitterHeaders,
        body: JSON.stringify({ source_id: sourceRecord.id })
      });

      enableSourceLocallyFn(sourceRecord.title);
      return { success: true, message: 'Forrás támogatása rögzítve!' };
    }
    return { success: false, message: 'A forrás nem található.' };
  } catch (e) {
    throw new Error('Hiba történt a forrás hozzáadásakor.');
  }
}

export async function fetchCommunitySources() {
  try {
    const response = await fetch(`${CONFIG.REST_URL}/sources_catalog?select=*&is_community=eq.true&order=add_count.desc&limit=300`, { headers: submitterHeaders });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch (_) {
    return [];
  }
}