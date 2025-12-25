import { NextRequest, NextResponse } from 'next/server'
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
  'soup': { calories: 30, protein: 1.5, carbs: 5, fat: 0.5 },
  'sandwich': { calories: 250, protein: 12, carbs: 30, fat: 9 },
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
  'plate': { calories: 200, protein: 10, carbs: 25, fat: 8 },
  'food': { calories: 200, protein: 10, carbs: 25, fat: 8 },
  'meal': { calories: 350, protein: 20, carbs: 40, fat: 12 },
  'dish': { calories: 250, protein: 15, carbs: 30, fat: 10 },
  'bowl': { calories: 300, protein: 12, carbs: 45, fat: 8 },
}

function findClosestFood(foodName: string): string | null {
  const normalized = foodName.toLowerCase().trim()
  
  if (FOOD_DATABASE[normalized]) return normalized
  
  for (const key in FOOD_DATABASE) {
    if (normalized.includes(key) || key.includes(normalized)) return key
  }
  
  const words = normalized.split(/\s+/)
  for (const word of words) {
    if (word.length > 3 && FOOD_DATABASE[word]) return word
    for (const key in FOOD_DATABASE) {
      if (key.includes(word) || word.includes(key)) return key
    }
  }
  
  return null
}

function calculateNutrition(foodName: string, quantity: string): FoodItem {
  const foodKey = findClosestFood(foodName)
  const qty = parseFloat(quantity.match(/(\d+\.?\d*)/)?.[1] || '1')
  
  if (!foodKey) {
    return {
      name: foodName,
      quantity: quantity || '1 serving',
      calories: Math.round(qty * 150),
      protein: Math.round(qty * 10),
      carbs: Math.round(qty * 20),
      fat: Math.round(qty * 6),
    }
  }
  
  const base = FOOD_DATABASE[foodKey]
  const multiplier = qty * (quantity.toLowerCase().includes('g') ? 1 : 100) / 100
  
  return {
    name: foodName,
    quantity: quantity || '1 serving',
    calories: Math.round(base.calories * multiplier),
    protein: Math.round(base.protein * multiplier * 10) / 10,
    carbs: Math.round(base.carbs * multiplier * 10) / 10,
    fat: Math.round(base.fat * multiplier * 10) / 10,
  }
}

function getDemoResponse(): FoodItem[] {
  return [
    { name: 'Grilled Chicken', quantity: '150g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
    { name: 'Rice', quantity: '1 cup', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4 },
    { name: 'Vegetables', quantity: '100g', calories: 65, protein: 2.6, carbs: 13, fat: 0.3 },
  ]
}

async function analyzeWithHuggingFace(imageBlob: Blob, apiKey: string): Promise<string> {
  // Use BLIP model for image captioning
  const response = await fetch(
    'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBlob,
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('HF API Error:', response.status, errorText)
    throw new Error(`Hugging Face API error: ${response.status}`)
  }

  const result = await response.json()
  console.log('HF Result:', result)
  
  // Handle different response formats
  if (Array.isArray(result) && result[0]?.generated_text) {
    return result[0].generated_text
  }
  if (result.generated_text) {
    return result.generated_text
  }
  if (typeof result === 'string') {
    return result
  }
  
  throw new Error('Unexpected response format')
}

function extractFoodsFromDescription(description: string): FoodItem[] {
  console.log('Extracting foods from:', description)
  
  const foods: FoodItem[] = []
  const descLower = description.toLowerCase()
  
  // Check each food in our database
  for (const [foodName, nutrition] of Object.entries(FOOD_DATABASE)) {
    if (descLower.includes(foodName)) {
      foods.push({
        name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
        quantity: '1 serving',
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
      })
    }
  }
  
  // If we found specific foods, return them
  if (foods.length > 0) {
    return foods.slice(0, 5)
  }
  
  // Otherwise, create a generic entry based on the description
  const cleanDesc = description.replace(/^a\s+/i, '').substring(0, 40)
  return [{
    name: cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1),
    quantity: '1 serving',
    calories: 250,
    protein: 12,
    carbs: 30,
    fat: 10,
  }]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Check for Hugging Face API key
    const hfApiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY
    
    if (!hfApiKey) {
      console.log('No HF_API_KEY found in environment')
      return NextResponse.json({ 
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'No HF_API_KEY configured. Add it in Vercel Environment Variables.'
      })
    }

    console.log('Using HF API Key:', hfApiKey.substring(0, 10) + '...')

    // Convert image to blob
    const arrayBuffer = await imageFile.arrayBuffer()
    const imageBlob = new Blob([arrayBuffer], { type: imageFile.type })

    try {
      const description = await analyzeWithHuggingFace(imageBlob, hfApiKey)
      console.log('Got description:', description)
      
      const foodItems = extractFoodsFromDescription(description)
      console.log('Extracted foods:', foodItems)
      
      return NextResponse.json({ foodItems })
      
    } catch (hfError) {
      console.error('HF Error:', hfError)
      
      // Check if model is loading
      const errorMsg = hfError instanceof Error ? hfError.message : String(hfError)
      if (errorMsg.includes('loading') || errorMsg.includes('503')) {
        return NextResponse.json({ 
          foodItems: getDemoResponse(),
          isDemo: true,
          message: 'AI model is loading. Please try again in 30 seconds.'
        })
      }
      
      return NextResponse.json({ 
        foodItems: getDemoResponse(),
        isDemo: true,
        message: 'Could not analyze image. Using demo data.'
      })
    }

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      foodItems: getDemoResponse(),
      isDemo: true,
      message: 'Error processing request.'
    })
  }
}
