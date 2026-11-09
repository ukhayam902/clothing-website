import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Public Supabase project found in the user's dashboard (no keys invented):
// Organization: UK Mobile Zone (Free plan) — Project: "ukhayam902's Project"
// Public URL: https://cnkdeotxnaxlavvrmzyr.supabase.co — Region: eu-west-1
// The anon key is NOT stored here and was not invented. Live mode requires it.
// This clothing store uses the clothing_* tables (see supabase/migrations) in
// the SAME project. The existing public.profiles / public.user_roles tables
// and public.is_admin() function are reused — they are NOT recreated here.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL as string | undefined
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null

export const isSupabaseConfigured = Boolean(supabase)
export const demoMode = !isSupabaseConfigured
// Never use a service-role key in frontend code. See README.md.
