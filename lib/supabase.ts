import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

// Server-side Supabase client with SERVICE ROLE (bypasses RLS)
// Use this for API routes that need to insert/update on behalf of users
export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    console.warn('Supabase service role key not configured, falling back to anon key')
    // Fall back to anon key if service role not available
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) return null
    return createClient(url, anonKey, {
      auth: { persistSession: false }
    })
  }
  
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Server-side Supabase client with anon key (respects RLS)
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Supabase environment variables not configured')
    return null
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

// Get learned foods data for API use
export async function getLearnedFoods(foodNames: string[]) {
  try {
    const client = createServerClient()
    if (!client) return []
    
    const normalizedNames = foodNames.map(name => name.toLowerCase().trim())
    
    const { data } = await client
      .from('learned_foods')
      .select('*')
      .in('food_name_normalized', normalizedNames)
      .gte('confidence_score', 0.3)

    return data || []
  } catch {
    return []
  }
}
