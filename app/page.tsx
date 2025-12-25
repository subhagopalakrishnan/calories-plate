'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import CalorieResults from '@/components/CalorieResults'
import { FoodItem } from '@/types'

export default function Home() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [demoMessage, setDemoMessage] = useState<string | null>(null)

  const handleImageAnalysis = async (imageFile: File) => {
    setLoading(true)
    setError(null)
    setFoodItems([])
    setIsDemo(false)
    setDemoMessage(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (!response.ok && !data.foodItems) {
        throw new Error(data.error || 'Failed to analyze image')
      }

      setFoodItems(data.foodItems || [])
      setIsDemo(data.isDemo || false)
      setDemoMessage(data.message || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error analyzing image:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary-800 mb-2">
            Calories Plate
          </h1>
          <p className="text-lg text-gray-600">
            Take a photo of your food and get instant calorie calculations
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <ImageUpload
            onImageSelect={handleImageAnalysis}
            loading={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isDemo && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="mt-1 text-sm">
              {demoMessage || 'Showing sample results. For real food analysis, configure a valid Gemini API key.'}
            </p>
          </div>
        )}

        {foodItems.length > 0 && (
          <CalorieResults foodItems={foodItems} />
        )}
      </div>
    </main>
  )
}
