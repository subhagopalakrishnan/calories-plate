import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FoodItem } from '@/types'

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

    const geminiKey = process.env.GEMINI_API_KEY

    if (!geminiKey || !geminiKey.startsWith('AIza')) {
      return NextResponse.json({
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'Add valid GEMINI_API_KEY to Vercel environment variables.'
      })
    }

    try {
      console.log('Using Gemini API...')
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const arrayBuffer = await imageFile.arrayBuffer()
      const base64Image = Buffer.from(arrayBuffer).toString('base64')

      const prompt = `You are a professional nutritionist. Analyze this food image carefully.

For each food item visible in the image:
1. Identify the food item
2. Estimate the portion size/quantity as accurately as possible
3. Calculate the nutritional values based on the estimated portion

Return ONLY a valid JSON array with this exact format:
[
  {
    "name": "Food Name",
    "quantity": "estimated amount (e.g., 150g, 1 cup, 2 pieces)",
    "calories": number,
    "protein": number (in grams),
    "carbs": number (in grams),
    "fat": number (in grams)
  }
]

Be accurate with calorie calculations. Use standard nutritional data:
- Rice (1 cup cooked): ~200 calories
- Chicken breast (100g): ~165 calories
- Roti/Chapati (1 piece): ~70-80 calories
- Dal (1 cup): ~150 calories
- Vegetables (1 cup): ~25-50 calories
- Paneer (100g): ~265 calories

Return ONLY the JSON array, no other text or explanation.`

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: imageFile.type } }
      ])
      
      const text = result.response.text()
      console.log('Gemini response:', text)

      // Parse the JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          const foods = JSON.parse(jsonMatch[0])
          
          // Validate and clean the response
          const foodItems: FoodItem[] = foods.map((f: Record<string, unknown>) => ({
            name: String(f.name || 'Unknown Food'),
            quantity: String(f.quantity || '1 serving'),
            calories: Math.round(Number(f.calories) || 100),
            protein: Math.round((Number(f.protein) || 5) * 10) / 10,
            carbs: Math.round((Number(f.carbs) || 10) * 10) / 10,
            fat: Math.round((Number(f.fat) || 3) * 10) / 10,
          }))
          
          return NextResponse.json({ foodItems })
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
        }
      }

      // If parsing failed, return demo
      return NextResponse.json({
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'Could not parse food data from image.'
      })

    } catch (geminiError) {
      console.error('Gemini error:', geminiError)
      const msg = geminiError instanceof Error ? geminiError.message : ''
      
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json({
          foodItems: getDemoResponse(),
          isDemo: true,
          message: 'API rate limited. Wait 1 minute and try again.'
        })
      }

      return NextResponse.json({
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'API error. Please try again.'
      })
    }

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      foodItems: getDemoResponse(),
      isDemo: true,
      message: 'Error processing image.'
    })
  }
}
