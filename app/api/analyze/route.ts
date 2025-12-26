import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FoodItem } from '@/types'
import { createServerClient } from '@/lib/supabase'

interface LearnedFood {
  food_name: string
  avg_calories_per_100g: number
  avg_protein_per_100g: number
  avg_carbs_per_100g: number
  avg_fat_per_100g: number
  confidence_score: number
  sample_count: number
}

function getDemoResponse(): FoodItem[] {
  return [
    { name: 'Grilled Chicken', quantity: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
    { name: 'Rice', quantity: '1 cup', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
    { name: 'Vegetables', quantity: '100g', calories: 50, protein: 2, carbs: 10, fat: 0.3 },
  ]
}

// Get user-corrected food data from learned_foods table
async function getLearnedFoodsData(): Promise<LearnedFood[]> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('learned_foods')
      .select('*')
      .gte('confidence_score', 0.4)
      .order('sample_count', { ascending: false })
      .limit(50)
    
    return (data as LearnedFood[]) || []
  } catch {
    return []
  }
}

// Build prompt enhancement from learned foods
function buildLearnedFoodsPrompt(learnedFoods: LearnedFood[]): string {
  if (learnedFoods.length === 0) return ''
  
  const foodLines = learnedFoods.map(f => 
    `- ${f.food_name} (100g): ${Math.round(f.avg_calories_per_100g)} cal, ${Math.round(f.avg_protein_per_100g)}g protein, ${Math.round(f.avg_carbs_per_100g)}g carbs, ${Math.round(f.avg_fat_per_100g)}g fat [verified by ${f.sample_count} users]`
  ).join('\n')
  
  return `
IMPORTANT: Use these user-verified nutritional values (higher priority than general estimates):
${foodLines}
`
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
      
      // Fetch learned foods from user corrections
      const learnedFoods = await getLearnedFoodsData()
      const learnedFoodsPrompt = buildLearnedFoodsPrompt(learnedFoods)
      
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      const arrayBuffer = await imageFile.arrayBuffer()
      const base64Image = Buffer.from(arrayBuffer).toString('base64')

      const prompt = `You are an expert nutritionist with 20+ years of experience in calorie estimation.

TASK: Analyze this food image and provide PRECISE nutritional information.

CRITICAL GUIDELINES:
1. Be CONSERVATIVE with portion estimates - most people overestimate portions
2. Look for visual cues: plate size, utensils, hand references for scale
3. Consider typical serving sizes for the cuisine shown
4. Account for cooking methods (fried foods have more calories)
5. Consider visible oils, sauces, and toppings
${learnedFoodsPrompt}

STANDARD REFERENCE VALUES (per 100g unless noted):
- White Rice (cooked): 130 cal, 2.7g protein, 28g carbs, 0.3g fat
- Brown Rice (cooked): 111 cal, 2.6g protein, 23g carbs, 0.9g fat
- Chicken Breast (cooked): 165 cal, 31g protein, 0g carbs, 3.6g fat
- Chicken Curry: 150-200 cal depending on oil/sauce
- Roti/Chapati (1 piece ~40g): 80 cal, 2.5g protein, 15g carbs, 1g fat
- Naan (1 piece ~90g): 260 cal, 8g protein, 45g carbs, 5g fat
- Dal (1 cup): 150 cal, 9g protein, 20g carbs, 3g fat
- Sambar (1 cup): 140 cal, 6g protein, 18g carbs, 5g fat
- Paneer (100g): 265 cal, 18g protein, 1.2g carbs, 21g fat
- Mixed Vegetables (cooked): 50 cal, 2g protein, 10g carbs, 0.5g fat
- Biryani (1 cup): 250-350 cal depending on meat content
- Dosa (1 plain): 120 cal, 3g protein, 22g carbs, 3g fat
- Idli (1 piece): 40 cal, 2g protein, 8g carbs, 0.2g fat

OUTPUT FORMAT - Return ONLY a valid JSON array:
[
  {
    "name": "Specific Food Name (e.g., 'Jeera Rice' not just 'Rice')",
    "quantity": "precise estimate (e.g., '180g' or '1.5 cups' or '2 medium pieces')",
    "calories": number (total for the quantity shown),
    "protein": number (grams, rounded to 1 decimal),
    "carbs": number (grams, rounded to 1 decimal),
    "fat": number (grams, rounded to 1 decimal)
  }
]

Identify EACH distinct food item separately. Do not combine items.
Return ONLY the JSON array, no markdown formatting or explanation.`

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: imageFile.type } }
      ])
      
      const text = result.response.text()
      console.log('Gemini response:', text)

      // Parse the JSON response - handle markdown code blocks
      let jsonText = text
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1]
      }
      
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
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
          
          // Include info about learned foods being used
          const usingLearnedData = learnedFoods.length > 0
          
          return NextResponse.json({ 
            foodItems,
            learnedFoodsUsed: usingLearnedData,
            message: usingLearnedData ? 
              `Enhanced with ${learnedFoods.length} user-verified food entries` : 
              undefined
          })
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
