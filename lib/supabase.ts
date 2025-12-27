import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null

// Client-side Supabase client (use in React components)
export const supabase = {
  get client() {
    if (!supabaseInstance) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        throw new Error('Supabase environment variables not configured')
      }
      
      supabaseInstance = createClient(url, key)
    }
    return supabaseInstance
  },
  
  // Proxy common methods
  get auth() { return this.client.auth },
  from(table: string) { return this.client.from(table) },
  channel(name: string) { return this.client.channel(name) },
  removeChannel(channel: ReturnType<SupabaseClient['channel']>) { 
    return this.client.removeChannel(channel) 
  },
}

// Server-side Supabase client (use in API routes)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    // Return a mock client that won't throw during build
    return {
      from: () => ({
        select: () => ({ data: null, error: new Error('Supabase not configured') }),
        insert: () => ({ data: null, error: new Error('Supabase not configured') }),
        update: () => ({ data: null, error: new Error('Supabase not configured') }),
        upsert: () => ({ data: null, error: new Error('Supabase not configured') }),
        delete: () => ({ data: null, error: new Error('Supabase not configured') }),
      }),
    } as unknown as SupabaseClient
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
