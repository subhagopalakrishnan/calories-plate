import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FoodItem } from '@/types'

// Food database with common foods and their nutritional values per 100g
const FOOD_DATABASE: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  'noodles': { calories: 138, protein: 4.5, carbs: 25, fat: 2.1 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 12 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33 },
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
  'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  'beef': { calories: 250, protein: 26, carbs: 0, fat: 17 },
  'steak': { calories: 271, protein: 26, carbs: 0, fat: 18 },
  'pork': { calories: 242, protein: 27, carbs: 0, fat: 14 },
  'fish': { calories: 206, protein: 22, carbs: 0, fat: 12 },
  'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10 },
  'burger': { calories: 295, protein: 17, carbs: 30, fat: 12 },
  'hamburger': { calories: 295, protein: 17, carbs: 30, fat: 12 },
  'fries': { calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  'french fries': { calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  'salad': { calories: 15, protein: 1.4, carbs: 3, fat: 0.2 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'pepper': { calories: 31, protein: 1, carbs: 7, fat: 0.3 },
  'cucumber': { calories: 16, protein: 0.7, carbs: 4, fat: 0.1 },
  'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15 },
  'strawberry': { calories: 32, protein: 0.7, carbs: 8, fat: 0.3 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  'grape': { calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  'chocolate': { calories: 546, protein: 7.8, carbs: 45, fat: 31 },
  'cake': { calories: 367, protein: 5.4, carbs: 53, fat: 14 },
  'cookie': { calories: 488, protein: 6.8, carbs: 68, fat: 22 },
  'ice cream': { calories: 207, protein: 3.5, carbs: 24, fat: 11 },
  'coffee': { calories: 2, protein: 0.1, carbs: 0, fat: 0 },
  'tea': { calories: 2, protein: 0, carbs: 0.3, fat: 0 },
  'water': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'soup': { calories: 30, protein: 1.5, carbs: 5, fat: 0.5 },
  'sandwich': { calories: 250, protein: 12, carbs: 30, fat: 9 },
  'wrap': { calories: 220, protein: 10, carbs: 28, fat: 8 },
  'sushi': { calories: 150, protein: 6, carbs: 30, fat: 0.5 },
  'curry': { calories: 150, protein: 8, carbs: 12, fat: 8 },
  'biryani': { calories: 200, protein: 8, carbs: 30, fat: 6 },
  'dal': { calories: 120, protein: 9, carbs: 20, fat: 1 },
  'roti': { calories: 120, protein: 3, carbs: 25, fat: 1 },
  'naan': { calories: 260, protein: 9, carbs: 45, fat: 5 },
  'dosa': { calories: 133, protein: 4, carbs: 24, fat: 2 },
  'idli': { calories: 39, protein: 2, carbs: 8, fat: 0.1 },
  'samosa': { calories: 262, protein: 4, carbs: 24, fat: 17 },
  'paneer': { calories: 265, protein: 18, carbs: 1.2, fat: 21 },
  'tofu': { calories: 76, protein: 8, carbs: 2, fat: 4.8 },
  'beans': { calories: 127, protein: 8.7, carbs: 23, fat: 0.5 },
  'lentils': { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  'corn': { calories: 96, protein: 3.4, carbs: 21, fat: 1.5 },
  'peas': { calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'shrimp': { calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  'crab': { calories: 97, protein: 19, carbs: 0, fat: 1.5 },
  'lobster': { calories: 89, protein: 19, carbs: 0, fat: 0.9 },
  'bacon': { calories: 541, protein: 37, carbs: 1.4, fat: 42 },
  'sausage': { calories: 301, protein: 12, carbs: 2, fat: 27 },
  'hotdog': { calories: 290, protein: 11, carbs: 24, fat: 18 },
  'taco': { calories: 226, protein: 9, carbs: 20, fat: 13 },
  'burrito': { calories: 206, protein: 8, carbs: 26, fat: 8 },
  'oatmeal': { calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
  'cereal': { calories: 379, protein: 7, carbs: 84, fat: 1 },
  'pancake': { calories: 227, protein: 6, carbs: 28, fat: 10 },
  'waffle': { calories: 291, protein: 8, carbs: 33, fat: 14 },
  'donut': { calories: 452, protein: 5, carbs: 51, fat: 25 },
  'muffin': { calories: 377, protein: 6, carbs: 52, fat: 16 },
  'croissant': { calories: 406, protein: 8, carbs: 45, fat: 21 },
  'bagel': { calories: 250, protein: 10, carbs: 48, fat: 1.5 },
}

function findClosestFood(foodName: string): string | null {
  const normalized = foodName.toLowerCase().trim()
  
  if (FOOD_DATABASE[normalized]) {
    return normalized
  }
  
  for (const key in FOOD_DATABASE) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key
    }
  }
  
  const words = normalized.split(/\s+/)
  for (const word of words) {
    if (word.length > 3) {
      for (const key in FOOD_DATABASE) {
        if (key.includes(word) || word.includes(key)) {
          return key
        }
      }
    }
  }
  
  return null
}

function parseQuantity(quantityStr: string): number {
  const match = quantityStr.match(/(\d+\.?\d*)/)
  if (match) {
    return parseFloat(match[1])
  }
  return 1
}

function estimateWeight(quantity: number, unit: string, foodName: string): number {
  const unitLower = unit.toLowerCase()
  
  if (unitLower.includes('g') || unitLower.includes('gram')) return quantity
  if (unitLower.includes('kg')) return quantity * 1000
  if (unitLower.includes('oz')) return quantity * 28.35
  if (unitLower.includes('lb')) return quantity * 453.6
  if (unitLower.includes('cup')) return quantity * 240
  if (unitLower.includes('tbsp')) return quantity * 15
  if (unitLower.includes('tsp')) return quantity * 5
  
  if (unitLower.includes('piece') || unitLower.includes('serving') || unitLower.includes('slice')) {
    const pieceWeights: Record<string, number> = {
      'apple': 182, 'banana': 118, 'egg': 50, 'bread': 25,
      'cookie': 15, 'pizza': 100, 'burger': 150, 'samosa': 50,
      'idli': 40, 'dosa': 100, 'roti': 40,
    }
    for (const [food, weight] of Object.entries(pieceWeights)) {
      if (foodName.toLowerCase().includes(food)) return quantity * weight
    }
    return quantity * 100
  }
  
  return quantity * 100
}

function calculateNutrition(foodName: string, quantity: string): FoodItem {
  const foodKey = findClosestFood(foodName)
  
  if (!foodKey) {
    return {
      name: foodName,
      quantity,
      calories: Math.round(parseQuantity(quantity) * 100),
      protein: Math.round(parseQuantity(quantity) * 8),
      carbs: Math.round(parseQuantity(quantity) * 15),
      fat: Math.round(parseQuantity(quantity) * 5),
    }
  }
  
  const baseNutrition = FOOD_DATABASE[foodKey]
  const qty = parseQuantity(quantity)
  const weightGrams = estimateWeight(qty, quantity.toLowerCase(), foodName)
  const multiplier = weightGrams / 100
  
  return {
    name: foodName,
    quantity,
    calories: Math.round(baseNutrition.calories * multiplier),
    protein: Math.round(baseNutrition.protein * multiplier * 10) / 10,
    carbs: Math.round(baseNutrition.carbs * multiplier * 10) / 10,
    fat: Math.round(baseNutrition.fat * multiplier * 10) / 10,
  }
}

function getDemoResponse(): FoodItem[] {
  return [
    { name: 'Grilled Chicken Breast', quantity: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
    { name: 'Steamed Rice', quantity: '1 cup', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
    { name: 'Mixed Vegetables', quantity: '100g', calories: 65, protein: 2.6, carbs: 13, fat: 0.3 },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'No API key configured. Set GEMINI_API_KEY in Vercel environment variables.'
      })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type

    const prompt = `Analyze this food image and identify all food items visible. For each food item, provide:
1. The name of the food
2. An estimated quantity (e.g., "1 cup", "200g", "2 pieces", "1 serving")

Format your response as a JSON array of objects with "name" and "quantity" fields.
Example: [{"name": "Grilled Chicken", "quantity": "200g"}, {"name": "Rice", "quantity": "1 cup"}]

Return ONLY the JSON array, no other text.`

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = result.response
    const content = response.text()

    if (!content) {
      return NextResponse.json({ 
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'Could not analyze image.'
      })
    }

    // Parse JSON response
    let foodData: Array<{ name: string; quantity: string }>
    try {
      let cleanContent = content.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
      
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        foodData = JSON.parse(jsonMatch[0])
      } else {
        foodData = JSON.parse(cleanContent)
      }
    } catch {
      console.error('Failed to parse response:', content)
      return NextResponse.json({ 
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'Could not parse food data.'
      })
    }

    const foodItems = foodData.map(item => calculateNutrition(item.name, item.quantity))

    return NextResponse.json({ foodItems })

  } catch (error) {
    console.error('Error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    
    if (errMsg.includes('429') || errMsg.includes('quota')) {
      return NextResponse.json({ 
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'API quota exceeded. Please try again later.'
      })
    }
    
    return NextResponse.json({ 
      foodItems: getDemoResponse(),
      isDemo: true,
      message: 'Error analyzing image.'
    })
  }
}
