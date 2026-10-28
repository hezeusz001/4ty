
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

export async function ensureAnonymousSession() {
  const { data: existing, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (existing.session) {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  const { data, error } =
    await supabase.auth.signInAnonymously();

  if (error) throw error;

  return data.user;
}
