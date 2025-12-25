import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FoodItem } from '@/types'

// Comprehensive food database
const FOOD_DATABASE: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 12 },
  'salad': { calories: 15, protein: 1.4, carbs: 3, fat: 0.2 },
  'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10 },
  'burger': { calories: 295, protein: 17, carbs: 30, fat: 12 },
  'fries': { calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  'soup': { calories: 30, protein: 1.5, carbs: 5, fat: 0.5 },
  'sandwich': { calories: 250, protein: 12, carbs: 30, fat: 9 },
  'steak': { calories: 271, protein: 26, carbs: 0, fat: 18 },
  'fish': { calories: 206, protein: 22, carbs: 0, fat: 12 },
  'vegetables': { calories: 50, protein: 2, carbs: 10, fat: 0.3 },
  'fruit': { calories: 60, protein: 0.5, carbs: 15, fat: 0.2 },
  'curry': { calories: 150, protein: 8, carbs: 12, fat: 8 },
  'biryani': { calories: 200, protein: 8, carbs: 30, fat: 6 },
  'dal': { calories: 120, protein: 9, carbs: 20, fat: 1 },
  'roti': { calories: 120, protein: 3, carbs: 25, fat: 1 },
  'naan': { calories: 260, protein: 9, carbs: 45, fat: 5 },
  'dosa': { calories: 133, protein: 4, carbs: 24, fat: 2 },
  'idli': { calories: 39, protein: 2, carbs: 8, fat: 0.1 },
  'paneer': { calories: 265, protein: 18, carbs: 1.2, fat: 21 },
  'cake': { calories: 367, protein: 5.4, carbs: 53, fat: 14 },
  'ice cream': { calories: 207, protein: 3.5, carbs: 24, fat: 11 },
  'coffee': { calories: 2, protein: 0.1, carbs: 0, fat: 0 },
}

function findClosestFood(name: string): string | null {
  const n = name.toLowerCase()
  if (FOOD_DATABASE[n]) return n
  for (const key of Object.keys(FOOD_DATABASE)) {
    if (n.includes(key) || key.includes(n)) return key
  }
  return null
}

function calculateNutrition(name: string, quantity: string): FoodItem {
  const key = findClosestFood(name)
  const qty = parseFloat(quantity.match(/(\d+\.?\d*)/)?.[1] || '1')
  const mult = quantity.toLowerCase().includes('g') ? qty / 100 : qty
  
  const base = key ? FOOD_DATABASE[key] : { calories: 150, protein: 8, carbs: 20, fat: 6 }
  
  return {
    name,
    quantity: quantity || '1 serving',
    calories: Math.round(base.calories * mult),
    protein: Math.round(base.protein * mult * 10) / 10,
    carbs: Math.round(base.carbs * mult * 10) / 10,
    fat: Math.round(base.fat * mult * 10) / 10,
  }
}

function getDemoResponse(): FoodItem[] {
  return [
    { name: 'Grilled Chicken', quantity: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
    { name: 'Rice', quantity: '1 cup', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
    { name: 'Vegetables', quantity: '100g', calories: 50, protein: 2, carbs: 10, fat: 0.3 },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Check for API keys - try Gemini first, then HF
    const geminiKey = process.env.GEMINI_API_KEY
    const hfKey = process.env.HF_API_KEY

    // Try Gemini if key exists
    if (geminiKey && geminiKey.startsWith('AIza')) {
      try {
        console.log('Using Gemini API...')
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const arrayBuffer = await imageFile.arrayBuffer()
        const base64Image = Buffer.from(arrayBuffer).toString('base64')

        const prompt = `Analyze this food image. List each food item with estimated quantity.
Return ONLY a JSON array like: [{"name": "Chicken", "quantity": "150g"}]`

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Image, mimeType: imageFile.type } }
        ])
        
        const text = result.response.text()
        console.log('Gemini response:', text)

        const match = text.match(/\[[\s\S]*\]/)
        if (match) {
          const foods = JSON.parse(match[0])
          const items = foods.map((f: {name: string, quantity: string}) => 
            calculateNutrition(f.name, f.quantity)
          )
          return NextResponse.json({ foodItems: items })
        }
      } catch (geminiError) {
        console.error('Gemini error:', geminiError)
        const msg = geminiError instanceof Error ? geminiError.message : ''
        
        // If quota exceeded, return with message
        if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          return NextResponse.json({
            foodItems: getDemoResponse(),
            isDemo: true,
            message: 'API rate limited. Wait 1 minute and try again, or check billing is enabled.'
          })
        }
      }
    }

    // If no working API, return demo with helpful message
    let message = 'Demo mode. '
    if (!geminiKey) {
      message += 'Add GEMINI_API_KEY to Vercel environment variables.'
    } else if (!geminiKey.startsWith('AIza')) {
      message += 'GEMINI_API_KEY format invalid. Should start with AIza...'
    } else {
      message += 'API call failed. Check Vercel logs for details.'
    }

    return NextResponse.json({
      foodItems: getDemoResponse(),
      isDemo: true,
      message
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      foodItems: getDemoResponse(),
      isDemo: true,
      message: 'Error processing image.'
    })
  }
}
