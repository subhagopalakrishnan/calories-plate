import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Get learned food data for a specific food name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const foodName = searchParams.get('name')

    if (!foodName) {
      return NextResponse.json({ error: 'Food name required' }, { status: 400 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ food: null })
    }

    const normalizedName = foodName.toLowerCase().trim()

    // Try exact match first
    let { data } = await supabase
      .from('learned_foods')
      .select('*')
      .eq('food_name_normalized', normalizedName)
      .single()

    // If no exact match, try partial match
    if (!data) {
      const { data: partialMatches } = await supabase
        .from('learned_foods')
        .select('*')
        .ilike('food_name_normalized', `%${normalizedName}%`)
        .order('confidence_score', { ascending: false })
        .limit(1)

      data = partialMatches?.[0] || null
    }

    return NextResponse.json({ food: data })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get all learned foods (for building local cache)
export async function POST() {
  try {
    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ foods: [] })
    }

    const { data, error } = await supabase
      .from('learned_foods')
      .select('*')
      .gte('confidence_score', 0.5) // Only return foods with decent confidence
      .order('sample_count', { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ foods: data })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
