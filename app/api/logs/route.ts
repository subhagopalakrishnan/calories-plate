import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, mealType, foodItems, imageUrl } = body

    if (!userId || !foodItems || foodItems.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Calculate totals
    const totalCalories = foodItems.reduce((sum: number, item: { calories: number }) => sum + item.calories, 0)
    const totalProtein = foodItems.reduce((sum: number, item: { protein?: number }) => sum + (item.protein || 0), 0)
    const totalCarbs = foodItems.reduce((sum: number, item: { carbs?: number }) => sum + (item.carbs || 0), 0)
    const totalFat = foodItems.reduce((sum: number, item: { fat?: number }) => sum + (item.fat || 0), 0)

    // Insert food log
    const { data, error } = await supabase
      .from('food_logs')
      .insert({
        user_id: userId,
        meal_type: mealType || 'snack',
        food_items: foodItems,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        image_url: imageUrl || null,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving food log:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update daily summary
    const today = new Date().toISOString().split('T')[0]
    
    const { data: existingSummary } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existingSummary) {
      await supabase
        .from('daily_summaries')
        .update({
          total_calories: existingSummary.total_calories + totalCalories,
          total_protein: existingSummary.total_protein + totalProtein,
          total_carbs: existingSummary.total_carbs + totalCarbs,
          total_fat: existingSummary.total_fat + totalFat,
          meal_count: existingSummary.meal_count + 1,
        })
        .eq('id', existingSummary.id)
    } else {
      await supabase.from('daily_summaries').insert({
        user_id: userId,
        date: today,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        meal_count: 1,
      })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ logs: [] })
    }

    let query = supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })

    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`
      const endOfDay = `${date}T23:59:59.999Z`
      query = query.gte('logged_at', startOfDay).lte('logged_at', endOfDay)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs: data })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
