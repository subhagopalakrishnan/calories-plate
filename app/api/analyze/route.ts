import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { FoodItem } from '@/types'

// Food database with common foods and their nutritional values per 100g
const FOOD_DATABASE: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
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
  'pork': { calories: 242, protein: 27, carbs: 0, fat: 14 },
  'fish': { calories: 206, protein: 22, carbs: 0, fat: 12 },
  'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10 },
  'burger': { calories: 295, protein: 17, carbs: 30, fat: 12 },
  'fries': { calories: 312, protein: 3.4, carbs: 41, fat: 15 },
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
}

function findClosestFood(foodName: string): string | null {
  const normalized = foodName.toLowerCase().trim()
  
  // Direct match
  if (FOOD_DATABASE[normalized]) {
    return normalized
  }
  
  // Partial match
  for (const key in FOOD_DATABASE) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key
    }
  }
  
  // Common variations
  const variations: Record<string, string> = {
    'chicken': 'chicken breast',
    'rice': 'rice',
    'pasta': 'pasta',
    'bread': 'bread',
    'eggs': 'egg',
    'salmon': 'salmon',
    'beef': 'beef',
    'pork': 'pork',
    'fish': 'fish',
    'pizza': 'pizza',
    'burger': 'burger',
    'french fries': 'fries',
    'fries': 'fries',
    'salad': 'salad',
    'tomato': 'tomato',
    'onion': 'onion',
    'pepper': 'pepper',
    'cucumber': 'cucumber',
    'avocado': 'avocado',
    'strawberry': 'strawberry',
    'orange': 'orange',
    'grape': 'grape',
    'chocolate': 'chocolate',
    'cake': 'cake',
    'cookie': 'cookie',
    'ice cream': 'ice cream',
    'coffee': 'coffee',
    'tea': 'tea',
  }
  
  for (const [variation, key] of Object.entries(variations)) {
    if (normalized.includes(variation)) {
      return key
    }
  }
  
  return null
}

function parseQuantity(quantityStr: string): number {
  // Extract numbers from quantity string (e.g., "1 cup", "200g", "2 pieces")
  const match = quantityStr.match(/(\d+\.?\d*)/)
  if (match) {
    return parseFloat(match[1])
  }
  return 1 // Default to 1 if no number found
}

function estimateWeight(quantity: number, unit: string, foodName: string): number {
  const unitLower = unit.toLowerCase()
  
  // Common weight conversions (in grams)
  if (unitLower.includes('g') || unitLower.includes('gram')) {
    return quantity
  }
  
  if (unitLower.includes('kg') || unitLower.includes('kilogram')) {
    return quantity * 1000
  }
  
  if (unitLower.includes('oz') || unitLower.includes('ounce')) {
    return quantity * 28.35
  }
  
  if (unitLower.includes('lb') || unitLower.includes('pound')) {
    return quantity * 453.6
  }
  
  // Volume to weight approximations (in grams)
  if (unitLower.includes('cup')) {
    // Rough estimates - varies by food
    return quantity * 240 // Average for most foods
  }
  
  if (unitLower.includes('tbsp') || unitLower.includes('tablespoon')) {
    return quantity * 15
  }
  
  if (unitLower.includes('tsp') || unitLower.includes('teaspoon')) {
    return quantity * 5
  }
  
  // Piece-based estimates (in grams)
  if (unitLower.includes('piece') || unitLower.includes('item') || unitLower.includes('serving')) {
    const pieceWeights: Record<string, number> = {
      'apple': 182,
      'banana': 118,
      'egg': 50,
      'bread': 25, // slice
      'cookie': 15,
      'pizza': 100, // slice
      'burger': 150,
    }
    
    for (const [food, weight] of Object.entries(pieceWeights)) {
      if (foodName.toLowerCase().includes(food)) {
        return quantity * weight
      }
    }
    
    return quantity * 100 // Default piece weight
  }
  
  return quantity * 100 // Default estimate
}

function calculateNutrition(foodName: string, quantity: string): FoodItem | null {
  const foodKey = findClosestFood(foodName)
  
  if (!foodKey) {
    // If food not in database, estimate based on common values
    return {
      name: foodName,
      quantity,
      calories: Math.round(parseQuantity(quantity) * 100), // Rough estimate
      protein: Math.round(parseQuantity(quantity) * 10),
      carbs: Math.round(parseQuantity(quantity) * 15),
      fat: Math.round(parseQuantity(quantity) * 5),
    }
  }
  
  const baseNutrition = FOOD_DATABASE[foodKey]
  const qty = parseQuantity(quantity)
  const unit = quantity.toLowerCase()
  const weightGrams = estimateWeight(qty, unit, foodName)
  const multiplier = weightGrams / 100 // Convert to per 100g basis
  
  return {
    name: foodName,
    quantity,
    calories: Math.round(baseNutrition.calories * multiplier),
    protein: Math.round(baseNutrition.protein * multiplier * 10) / 10,
    carbs: Math.round(baseNutrition.carbs * multiplier * 10) / 10,
    fat: Math.round(baseNutrition.fat * multiplier * 10) / 10,
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your .env file. Get a free API key at https://makersuite.google.com/app/apikey' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type

    // Use Gemini Vision API to identify foods
    const prompt = `Analyze this food image and identify all food items visible. For each food item, provide:
1. The name of the food
2. An estimated quantity (e.g., "1 cup", "200g", "2 pieces", "1 serving")

Format your response as a JSON array of objects, where each object has:
- "name": the food item name
- "quantity": the estimated quantity

Example response:
[
  {"name": "Grilled Chicken Breast", "quantity": "200g"},
  {"name": "Steamed Rice", "quantity": "1 cup"},
  {"name": "Broccoli", "quantity": "150g"}
]

Be specific and accurate. Only include foods that are clearly visible. Return ONLY the JSON array, no other text.`

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const content = response.text()
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to analyze image' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let foodData: Array<{ name: string; quantity: string }>
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        foodData = JSON.parse(jsonMatch[0])
      } else {
        foodData = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', content)
      // Fallback: try to extract food items from text
      const lines = content.split('\n').filter(line => line.trim())
      foodData = lines.map(line => {
        const match = line.match(/(.+?):\s*(.+)/)
        if (match) {
          return { name: match[1].trim(), quantity: match[2].trim() }
        }
        return { name: line.trim(), quantity: '1 serving' }
      })
    }

    // Calculate calories for each food item
    const foodItems: FoodItem[] = foodData
      .map(item => calculateNutrition(item.name, item.quantity))
      .filter((item): item is FoodItem => item !== null)

    return NextResponse.json({ foodItems })
  } catch (error) {
    console.error('Error analyzing image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    )
  }
}

