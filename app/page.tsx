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
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageAnalysis = async (imageFile: File) => {
    setLoading(true)
    setError(null)
    setFoodItems([])
    setIsDemo(false)
    setDemoMessage(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(imageFile)

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

      // Add IDs to food items for editing
      const itemsWithIds = (data.foodItems || []).map((item: FoodItem, index: number) => ({
        ...item,
        id: `item-${index}-${Date.now()}`
      }))

      setFoodItems(itemsWithIds)
      setIsDemo(data.isDemo || false)
      setDemoMessage(data.message || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error analyzing image:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItems = (updatedItems: FoodItem[]) => {
    setFoodItems(updatedItems)
  }

  const handleReset = () => {
    setFoodItems([])
    setImagePreview(null)
    setError(null)
    setIsDemo(false)
    setDemoMessage(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-800 mb-2">
            🍽️ Calories Plate
          </h1>
          <p className="text-lg text-gray-600">
            Take a photo of your food and get instant calorie calculations
          </p>
        </div>

        {/* Image Upload / Preview */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {foodItems.length > 0 && imagePreview ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700">Analyzed Image</h3>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Analyze New Photo
                </button>
              </div>
              <img
                src={imagePreview}
                alt="Food preview"
                className="w-full h-auto rounded-lg max-h-64 object-contain mx-auto"
              />
            </div>
          ) : (
            <ImageUpload
              onImageSelect={handleImageAnalysis}
              loading={loading}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="mt-1 text-sm">
              {demoMessage || 'Showing sample results. Configure API key for real analysis.'}
            </p>
          </div>
        )}

        {/* Results */}
        {foodItems.length > 0 && (
          <CalorieResults 
            foodItems={foodItems} 
            onUpdateItems={handleUpdateItems}
          />
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Google Gemini AI • Calorie estimates may vary</p>
        </footer>
      </div>
    </main>
  )
}
