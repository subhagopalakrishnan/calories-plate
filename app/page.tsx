'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'
import CalorieResults from '@/components/CalorieResults'
import DailyDashboard from '@/components/DailyDashboard'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/components/AuthProvider'
import { FoodItem } from '@/types'

export default function Home() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [demoMessage, setDemoMessage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleImageAnalysis = async (imageFile: File) => {
    setLoading(true)
    setError(null)
    setFoodItems([])
    setIsDemo(false)
    setDemoMessage(null)
    setSaveSuccess(false)

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

      const itemsWithIds = (data.foodItems || []).map((item: FoodItem, index: number) => ({
        ...item,
        id: `item-${index}-${Date.now()}`
      }))

      setFoodItems(itemsWithIds)
      setIsDemo(data.isDemo || false)
      setDemoMessage(data.message || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMeal = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mealType,
          foodItems: foodItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            calories: item.calories,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0,
          })),
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error saving meal:', err)
    }
  }

  const handleReset = () => {
    setFoodItems([])
    setImagePreview(null)
    setError(null)
    setIsDemo(false)
    setDemoMessage(null)
    setSaveSuccess(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-800">
              🍽️ Calories Plate
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered food calorie tracking
            </p>
          </div>
          <div>
            {authLoading ? (
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden md:block">
                  👋 {profile?.full_name || user.email}
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Upload / Preview */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {foodItems.length > 0 && imagePreview ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Analyzed Image</h3>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      New Photo
                    </button>
                  </div>
                  <img
                    src={imagePreview}
                    alt="Food preview"
                    className="w-full h-auto rounded-lg max-h-48 object-contain mx-auto"
                  />
                </div>
              ) : (
                <ImageUpload onImageSelect={handleImageAnalysis} loading={loading} />
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Demo Notice */}
            {isDemo && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <strong>Demo Mode:</strong> {demoMessage}
              </div>
            )}

            {/* Results */}
            {foodItems.length > 0 && (
              <>
                <CalorieResults 
                  foodItems={foodItems} 
                  onUpdateItems={setFoodItems}
                  userId={user?.id}
                />
                
                {/* Save Meal */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Save This Meal</h3>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setMealType(type)}
                        className={`px-4 py-2 rounded-lg capitalize ${
                          mealType === type
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveMeal}
                    className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    {user ? 'Save to My Diary' : 'Sign In to Save'}
                  </button>

                  {saveSuccess && (
                    <div className="mt-3 text-center text-green-600 font-medium">
                      ✓ Meal saved successfully!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Dashboard */}
          <div className="lg:col-span-1">
            {user ? (
              <DailyDashboard />
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Daily Nutrition Goals</h3>
                
                {/* Sample Goals Preview */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">🔥 Calories</span>
                      <span className="text-gray-400">0 / 2000</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">🥩 Protein</span>
                      <span className="text-gray-400">0 / 50g</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">🍞 Carbs</span>
                      <span className="text-gray-400">0 / 250g</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">🥑 Fat</span>
                      <span className="text-gray-400">0 / 65g</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full" />
                  </div>
                </div>

                <div className="border-t pt-4 text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    Sign in to track your daily nutrition and set personalized goals
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Get Started Free
                  </button>
                </div>

                {/* Quick Tips */}
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Did you know?</strong> Tracking nutrition helps you make better food choices and achieve your health goals!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Google Gemini AI • 🧠 AI learns from your corrections</p>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  )
}
