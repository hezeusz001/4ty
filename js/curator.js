// js/curator.js - 4ty.hu Kliensoldali Pontozó & Szűrő Motor (v2 - stabil source_id affinity)

import { CATEGORY_META } from '4ty/config';

var PROFILE_STORAGE_KEY = '4ty_user_dna';

var LEGACY_CATEGORIES = [
  "gazdasag",
  "tech",
  "auto",
  "tudomany",
  "politika",
  "reddit",
  "sport",
  "bulvar"
];

export var VALID_CATEGORIES = [...Object.keys(CATEGORY_META).filter(key => key !== 'reflektor'), 'reddit'];

var DEFAULT_SUMMARY = "Alapértelmezett, teljes hírfolyam.";

export function loadUserProfile() {
  try {
    var raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return normalizeUserProfile(raw ? JSON.parse(raw) : null);
  } catch (e) {
    return normalizeUserProfile(null);
  }
}

function normalizeUserProfile(value) {
  var input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  var strings = values => Array.isArray(values)
    ? [...new Set(values.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean))] : [];
  var active = Array.isArray(input.active_categories) ? strings(input.active_categories) : [...VALID_CATEGORIES];
  // A régi alapértelmezett nyolcas lista korábban nem szűrt; ne rejtse el az új rovatokat.
  if (active.length === LEGACY_CATEGORIES.length && LEGACY_CATEGORIES.every(key => active.includes(key))) {
    active = [...VALID_CATEGORIES];
  }
  var weights = {};
  for (var key of VALID_CATEGORIES) {
    var weight = input.category_weights?.[key];
    weights[key] = typeof weight === 'number' && Number.isFinite(weight) ? Math.max(0, Math.min(3, weight)) : 1;
  }
  var affinity = Object.create(null);
  if (input.source_affinity && typeof input.source_affinity === 'object' && !Array.isArray(input.source_affinity)) {
    for (var [source, score] of Object.entries(input.source_affinity)) {
      if (typeof score === 'number' && Number.isFinite(score)) affinity[source] = Math.max(-5, Math.min(5, score));
    }
  }
  active = active.filter(key => VALID_CATEGORIES.includes(key));
  var muted = strings(input.mute_categories).map(key => key === 'politics' ? 'politika' : key)
    .filter(key => VALID_CATEGORIES.includes(key) || key === 'reflektor');
  return {
    active_categories: active,
    mute_categories: [...new Set([...muted, ...VALID_CATEGORIES.filter(key => !active.includes(key))])],
    blocked_stems: strings(input.blocked_stems),
    preferred_stems: strings(input.preferred_stems),
    category_weights: weights,
    source_affinity: affinity,
    summary: typeof input.summary === 'string' ? input.summary : DEFAULT_SUMMARY
  };
}

export function saveUserProfile(profile) {
  var normalized = normalizeUserProfile(profile);
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {}
  return normalized;
}

function normalizeText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'„”]/g, " ")
    .trim();
}


function getSourceAffinityKey(article) {
  if (!article) return '';
  return String(article.source_id || article.sourceId || '').trim();
}

function getLegacySourceAffinityKey(article) {
  if (!article) return '';
  return String(article.source || article.source_name || '').trim();
}

function getSourceAffinity(profile, article) {
  if (!profile || !profile.source_affinity) return 0;

  var sourceId = getSourceAffinityKey(article);
  if (sourceId && profile.source_affinity[sourceId] !== undefined) {
    return Number(profile.source_affinity[sourceId]) || 0;
  }

  var legacyName = getLegacySourceAffinityKey(article);
  if (legacyName && profile.source_affinity[legacyName] !== undefined) {
    return Number(profile.source_affinity[legacyName]) || 0;
  }

  return 0;
}

function updateSourceAffinity(profile, article, delta) {
  if (!profile || !article) return;
  if (!profile.source_affinity || typeof profile.source_affinity !== 'object') {
    profile.source_affinity = {};
  }

  var sourceId = getSourceAffinityKey(article);
  var legacyName = getLegacySourceAffinityKey(article);

  if (sourceId) {
    var base = profile.source_affinity[sourceId];

    // Régi, név-alapú érték egyszeri migrációja az első új interakciónál.
    if (base === undefined && legacyName && profile.source_affinity[legacyName] !== undefined) {
      base = profile.source_affinity[legacyName];
      delete profile.source_affinity[legacyName];
    }

    base = Number(base) || 0;
    profile.source_affinity[sourceId] = Math.max(-5.0, Math.min(5.0, base + delta));
    return;
  }

  // Kompatibilitás régi/cache-elt cikkekhez, ahol source_id még nincs.
  if (legacyName) {
    var legacyBase = Number(profile.source_affinity[legacyName]) || 0;
    profile.source_affinity[legacyName] = Math.max(-5.0, Math.min(5.0, legacyBase + delta));
  }
}

function containsStem(normalizedContent, stem) {
  var normStem = normalizeText(stem);
  if (!normStem) return false;
  if (normStem.length < 3) {
    var escapedStem = normStem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(^|[^\\p{L}\\p{N}])' + escapedStem + '(?=$|[^\\p{L}\\p{N}])', 'iu');
    return regex.test(normalizedContent);
  }
  return normalizedContent.includes(normStem);
}

export function isArticleBlocked(article, profile) {
  if (!profile || !article) return false;

  var itemCat = (article.cat || article.category || '').toLowerCase();
  var rawTags = Array.isArray(article.tags) ? article.tags.map(function(t) { return String(t).toLowerCase(); }) : [];
  var isMuted = profile.mute_categories || [];

  if (VALID_CATEGORIES.includes(itemCat) && Array.isArray(profile.active_categories) &&
      !profile.active_categories.includes(itemCat)) return true;

  if (isMuted.indexOf('politika') !== -1 || isMuted.indexOf('politics') !== -1) {
    if (article.is_politics === true || article.isPolitics === true) return true;
    if (itemCat === 'politika' || rawTags.indexOf('politics') !== -1 || rawTags.indexOf('war') !== -1) return true;
  }

  if (isMuted.indexOf('bulvar') !== -1) {
    if (article.is_tabloid === true || article.isTabloid === true) return true;
    if (itemCat === 'bulvar' || rawTags.indexOf('tabloid') !== -1 || rawTags.indexOf('tabloid_celeb') !== -1) return true;
  }

  if (isMuted.indexOf('sport') !== -1) {
    if (article.is_sport === true || article.isSport === true) return true;
    if (itemCat === 'sport' || rawTags.indexOf('sport') !== -1) return true;
  }

  if (isMuted.indexOf(itemCat) !== -1) {
    return true;
  }

  if (profile.blocked_stems && profile.blocked_stems.length > 0) {
    var title = article.title || article.original_title || '';
    var cleanTitle = article.cleanTitle || article.clean_title || '';
    var lead = article.lead || '';
    var normText = normalizeText(title + ' ' + cleanTitle + ' ' + lead);

    for (var i = 0; i < profile.blocked_stems.length; i++) {
      if (containsStem(normText, profile.blocked_stems[i])) return true;
    }
  }

  return false;
}

export function calculatePersonalScore(article, profile) {
  var score = 50.0;
  if (!profile || !article) return score;

  var title = article.title || article.original_title || '';
  var cleanTitle = article.cleanTitle || article.clean_title || '';
  var lead = article.lead || '';
  var normText = normalizeText(title + ' ' + cleanTitle + ' ' + lead);

  var itemCat = (article.cat || article.category || '').toLowerCase();
  var catWeight = (profile.category_weights && profile.category_weights[itemCat] !== undefined)
    ? profile.category_weights[itemCat] 
    : 1.0;
  score = score * catWeight;

  var preferredMatches = 0;
  if (profile.preferred_stems && profile.preferred_stems.length > 0) {
    for (var j = 0; j < profile.preferred_stems.length; j++) {
      if (containsStem(normText, profile.preferred_stems[j])) preferredMatches++;
    }
  }
  score += preferredMatches * 40.0;

  var sourceAffinity = getSourceAffinity(profile, article);
  if (sourceAffinity) {
    score += sourceAffinity * 10.0;
  }

  var elapsedHours = Math.max(0, (Date.now() - (article.timestamp || Date.now())) / 3600000);
  score = score / Math.pow(elapsedHours + 2, 1.2);

  article.isPreferredMatch = preferredMatches > 0;
  return score;
}

export function recordInteraction(article, type, currentProfile = null) {
  if (!article) return currentProfile;
  var interactionType = type || 'read';
  var profile = currentProfile || loadUserProfile();
  var itemCat = (article.cat || article.category || '').toLowerCase();

  if (interactionType === 'read' || interactionType === 'tldr') {
    updateSourceAffinity(profile, article, 0.2);
    if (itemCat && profile.category_weights[itemCat] !== undefined) {
      profile.category_weights[itemCat] = Math.min(3.0, profile.category_weights[itemCat] + 0.05);
    }
  } else if (interactionType === 'clickbait') {
    updateSourceAffinity(profile, article, -1.5);
  }
  
  saveUserProfile(profile);
  return profile;
}

export function applyAiCuratorConfig(config) {
  var current = loadUserProfile();
  var updated = Object.assign({}, current, {
    active_categories: config.active_categories || current.active_categories,
    mute_categories: config.mute_categories ?? current.mute_categories,
    blocked_stems: config.blocked_stems ?? current.blocked_stems,
    preferred_stems: config.preferred_stems ?? current.preferred_stems,
    category_weights: Object.assign({}, current.category_weights, config.category_weights || {}),
    summary: config.summary || current.summary
  });
  return saveUserProfile(updated);
}
