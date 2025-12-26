import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Save user feedback on analysis accuracy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, foodLogId, isAccurate, feedbackText } = body

    if (!userId || isAccurate === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        food_log_id: foodLogId || null,
        is_accurate: isAccurate,
        feedback_text: feedbackText || null,
      })

    if (error) {
      console.error('Error saving feedback:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get feedback stats
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('user_feedback')
      .select('is_accurate')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = data?.length || 0
    const accurate = data?.filter(f => f.is_accurate).length || 0
    const accuracyRate = total > 0 ? (accurate / total * 100).toFixed(1) : 0

    return NextResponse.json({ 
      total,
      accurate,
      accuracyRate: `${accuracyRate}%`
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

