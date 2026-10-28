
import { createClient } from
  'https://esm.sh/@supabase/supabase-js@2';

import { CONFIG } from '4ty/config';

export const supabase = createClient(
  `https://${CONFIG.SUPABASE_PROJECT_REF}.supabase.co`,
  CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  }
);

// Egy lapon belül a párhuzamos hívások ugyanazt az Auth-ellenőrzést várják.
// Csak a folyamatban lévő Promise-t osztjuk meg, felhasználót nem cache-elünk.
let sessionPending = null;

export async function ensureAnonymousSession() {
  if (sessionPending) return sessionPending;
  sessionPending = resolveAnonymousSession();
  try {
    return await sessionPending;
  } finally {
    sessionPending = null;
  }
}

async function resolveAnonymousSession() {
  const { data: existing, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (existing.session) {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user?.id) throw new Error('A munkamenet felhasználója nem ellenőrizhető.');
    return data.user;
  }

  const { data, error } =
    await supabase.auth.signInAnonymously();

  if (error) throw error;

  if (!data?.user?.id) throw new Error('Az anonim munkamenet nem jött létre.');
  return data.user;
}
