import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client (anon key) — for client-side use
export function createPublicClient() {
  return createClient(supabaseUrl, anonKey)
}

// Service client (service role) — for server-side / API routes only
export function createServiceClient() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}
