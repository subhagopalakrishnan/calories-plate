import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (use in React components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (use in API routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}

// Get learned foods data for API use
export async function getLearnedFoods(foodNames: string[]) {
  const client = createServerClient()
  const normalizedNames = foodNames.map(name => name.toLowerCase().trim())
  
  const { data } = await client
    .from('learned_foods')
    .select('*')
    .in('food_name_normalized', normalizedNames)
    .gte('confidence_score', 0.3)

  return data || []
}
