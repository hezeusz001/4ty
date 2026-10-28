// js/config.js - 4ty.hu Konfiguráció (Központi verziókezeléssel)
export const APP_VERSION = '91.8';

export const CONFIG = {
  SUPABASE_PROJECT_REF: "fbixujbyfrvuesnvamzm",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaXh1amJ5ZnJ2dWVzbnZhbXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4ODE2NDgsImV4cCI6MjEwNTQ1NzY0OH0.SJrPmkPFhXOoJ1T-wkG0tyc62V9wc5L-rt4BlcMtQJo",
  get REST_URL() { return `https://${this.SUPABASE_PROJECT_REF}.supabase.co/rest/v1`; },
  get AI_CURATOR_URL() { return `https://${this.SUPABASE_PROJECT_REF}.supabase.co/functions/v1/ai-curator`; },
  get DISCOVER_FEED_URL() { return `https://${this.SUPABASE_PROJECT_REF}.supabase.co/functions/v1/discover-feed`; },
  get FEED_WORKER_URL() { return `https://${this.SUPABASE_PROJECT_REF}.supabase.co/functions/v1/feed-worker`; }
};

export const DEFAULT_SECTION_ORDER = [
  'reflektor', 'gazdasag', 'tech', 'auto', 'tudomany', 'politika',
  'sport', 'bulvar', 'kultura', 'gaming', 'eletmod', 'csalad',
  'idojaras', 'nemzetkozi', 'bunugy', 'egyeb'
];

export const CATEGORY_META = {
  reflektor: { label: '4ty Reflektor', icon: '💡', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold' },
  gazdasag: { label: 'Gazdaság / Pénzügy', icon: '📊', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' },
  tech: { label: 'Technológia / AI', icon: '💻', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' },
  auto: { label: 'Autó / Közlekedés', icon: '🚗', badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30' },
  tudomany: { label: 'Tudomány', icon: '🔬', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30' },
  politika: { label: 'Közélet / Politika', icon: '🏛️', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' },
  sport: { label: 'Sport', icon: '⚽', badgeClass: 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/30' },
  bulvar: { label: 'Szórakozás / Bulvár', icon: '🎭', badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/30' },
  kultura: { label: 'Kultúra / Film / Könyv', icon: '🎬', badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30' },
  gaming: { label: 'Gaming', icon: '🎮', badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' },
  eletmod: { label: 'Életmód / Egészség', icon: '❤️', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30' },
  csalad: { label: 'Gyerek / Család', icon: '👨‍👩‍👧', badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' },
  idojaras: { label: 'Időjárás / Környezet', icon: '🌦️', badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' },
  nemzetkozi: { label: 'Nemzetközi hírek', icon: '🌍', badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30' },
  bunugy: { label: 'Bűnügy / Rendőrségi hírek', icon: '🛡️', badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30' },
  egyeb: { label: 'Általános / Vegyes', icon: '📰', badgeClass: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30' }
};
