'use client'

import { FoodItem } from '@/types'

interface CalorieResultsProps {
  foodItems: FoodItem[]
}

export default function CalorieResults({ foodItems }: CalorieResultsProps) {
  const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0)
  const totalProtein = foodItems.reduce((sum, item) => sum + (item.protein || 0), 0)
  const totalCarbs = foodItems.reduce((sum, item) => sum + (item.carbs || 0), 0)
  const totalFat = foodItems.reduce((sum, item) => sum + (item.fat || 0), 0)

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-3xl font-bold text-primary-800 mb-6">Nutritional Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary-700">{totalCalories}</div>
          <div className="text-sm text-gray-600">Total Calories</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{totalProtein.toFixed(1)}g</div>
          <div className="text-sm text-gray-600">Protein</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{totalCarbs.toFixed(1)}g</div>
          <div className="text-sm text-gray-600">Carbs</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-700">{totalFat.toFixed(1)}g</div>
          <div className="text-sm text-gray-600">Fat</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Food Items Detected:</h3>
        {foodItems.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-lg text-gray-800">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.quantity}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary-600">{item.calories} cal</div>
              </div>
            </div>
            {(item.protein || item.carbs || item.fat) && (
              <div className="flex gap-4 mt-3 text-sm">
                {item.protein && (
                  <span className="text-blue-600">Protein: {item.protein}g</span>
                )}
                {item.carbs && (
                  <span className="text-yellow-600">Carbs: {item.carbs}g</span>
                )}
                {item.fat && (
                  <span className="text-orange-600">Fat: {item.fat}g</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

