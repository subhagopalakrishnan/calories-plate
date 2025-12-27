import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables - using function to ensure fresh reads
function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

// Singleton for client-side usage
let clientSideSupabase: SupabaseClient | null = null

// Create or get client-side Supabase client
function getClientSideSupabase(): SupabaseClient {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  
  // If we already have a client with valid credentials, return it
  if (clientSideSupabase && url && key) {
    return clientSideSupabase
  }
  
  // If we don't have credentials, throw a helpful error
  if (!url || !key) {
    throw new Error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.')
  }
  
  // Create new client with actual credentials
  clientSideSupabase = createClient(url, key)
  return clientSideSupabase
}

// Proxy object that defers client creation to runtime
// This prevents build-time errors while ensuring runtime access works
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClientSideSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

// Server-side Supabase client (use in API routes)
export function createServerClient(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  
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
