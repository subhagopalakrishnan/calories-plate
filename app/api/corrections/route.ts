import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Save a user correction when they edit food data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      foodName, 
      originalQuantity, 
      correctedQuantity,
      originalCalories, 
      correctedCalories,
      originalProtein,
      correctedProtein,
      originalCarbs,
      correctedCarbs,
      originalFat,
      correctedFat
    } = body

    if (!foodName || correctedCalories === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Save the correction
    const { error } = await supabase
      .from('user_corrections')
      .insert({
        user_id: userId || null,
        food_name: foodName,
        original_quantity: originalQuantity,
        corrected_quantity: correctedQuantity,
        original_calories: originalCalories,
        corrected_calories: correctedCalories,
        original_protein: originalProtein,
        corrected_protein: correctedProtein,
        original_carbs: originalCarbs,
        corrected_carbs: correctedCarbs,
        original_fat: originalFat,
        corrected_fat: correctedFat,
      })

    if (error) {
      console.error('Error saving correction:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

