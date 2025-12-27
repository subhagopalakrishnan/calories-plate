'use client'

import { useState, useRef, useCallback } from 'react'
import { FoodItem } from '@/types'

interface CalorieResultsProps {
  foodItems: FoodItem[]
  onUpdateItems?: (items: FoodItem[]) => void
  userId?: string
}

// Track original values for corrections
interface OriginalValues {
  [key: string]: {
    name: string
    quantity: string
    calories: number
    protein?: number
    carbs?: number
    fat?: number
  }
}

export default function CalorieResults({ foodItems: initialItems, onUpdateItems, userId }: CalorieResultsProps) {
  const [items, setItems] = useState<FoodItem[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: '', calories: '' })
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [savingCorrection, setSavingCorrection] = useState(false)
  
  // Store original values when items first load
  const originalValues = useRef<OriginalValues>({})
  
  // Initialize original values
  if (Object.keys(originalValues.current).length === 0) {
    initialItems.forEach(item => {
      const id = item.id || item.name
      originalValues.current[id] = {
        name: item.name,
        quantity: item.quantity,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }
    })
  }

  // Calculate totals
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0)
  const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0)
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0)
  const totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0)

  // Save correction to database
  const saveCorrection = useCallback(async (item: FoodItem, original: OriginalValues[string]) => {
    try {
      setSavingCorrection(true)
      await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          foodName: item.name,
          originalQuantity: original.quantity,
          correctedQuantity: item.quantity,
          originalCalories: original.calories,
          correctedCalories: item.calories,
          originalProtein: original.protein,
          correctedProtein: item.protein,
          originalCarbs: original.carbs,
          correctedCarbs: item.carbs,
          originalFat: original.fat,
          correctedFat: item.fat,
        }),
      })
      console.log('Correction saved for:', item.name)
    } catch (error) {
      console.error('Failed to save correction:', error)
    } finally {
      setSavingCorrection(false)
    }
  }, [userId])

  // Debounced correction save
  const correctionTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({})
  
  const updateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    const newItems = [...items]
    const item = { ...newItems[index] }
    const itemId = item.id || item.name
    
    // Get original values
    const original = originalValues.current[itemId]
    
    if (field === 'quantity') {
      const newQty = String(value)
      const oldQty = item.quantity
      
      const newNum = parseFloat(newQty.match(/(\d+\.?\d*)/)?.[1] || '1')
      const oldNum = parseFloat(oldQty.match(/(\d+\.?\d*)/)?.[1] || '1')
      
      const ratio = newNum / oldNum
      
      item.quantity = newQty
      item.calories = Math.round(item.calories * ratio)
      item.protein = item.protein ? Math.round(item.protein * ratio * 10) / 10 : undefined
      item.carbs = item.carbs ? Math.round(item.carbs * ratio * 10) / 10 : undefined
      item.fat = item.fat ? Math.round(item.fat * ratio * 10) / 10 : undefined
    } else if (field === 'calories') {
      item.calories = Number(value) || 0
    } else if (field === 'name') {
      item.name = String(value)
    }
    
    newItems[index] = item
    setItems(newItems)
    onUpdateItems?.(newItems)
    
    // Debounce saving corrections (wait 2 seconds after last edit)
    if (original) {
      const hasChanges = 
        item.calories !== original.calories ||
        item.quantity !== original.quantity
      
      if (hasChanges) {
        // Clear existing timeout
        if (correctionTimeouts.current[itemId]) {
          clearTimeout(correctionTimeouts.current[itemId])
        }
        
        // Set new timeout to save correction
        correctionTimeouts.current[itemId] = setTimeout(() => {
          saveCorrection(item, original)
        }, 2000)
      }
    }
  }

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    onUpdateItems?.(newItems)
  }

  const addItem = () => {
    if (!newItem.name || !newItem.calories) return
    
    const itemId = Date.now().toString()
    const item: FoodItem = {
      id: itemId,
      name: newItem.name,
      quantity: newItem.quantity || '1 serving',
      calories: parseInt(newItem.calories) || 0,
    }
    
    // Store original values for new item
    originalValues.current[itemId] = {
      name: item.name,
      quantity: item.quantity,
      calories: item.calories,
    }
    
    const newItems = [...items, item]
    setItems(newItems)
    onUpdateItems?.(newItems)
    setNewItem({ name: '', quantity: '', calories: '' })
    setShowAddForm(false)
  }

  // Submit feedback
  const submitFeedback = async (isAccurate: boolean) => {
    if (feedbackGiven) return
    
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isAccurate,
          feedbackText: isAccurate ? 'User confirmed accuracy' : 'User indicated estimates need improvement',
        }),
      })
      setFeedbackGiven(true)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-bold text-primary-800">Nutritional Analysis</h2>
        
        {/* Feedback Buttons */}
        {!feedbackGiven ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Accurate?</span>
            <button
              onClick={() => submitFeedback(true)}
              className="p-2 rounded-full hover:bg-green-50 transition-colors group"
              title="Yes, this is accurate!"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
            <button
              onClick={() => submitFeedback(false)}
              className="p-2 rounded-full hover:bg-red-50 transition-colors group"
              title="No, needs improvement"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Thanks for the feedback!
          </div>
        )}
      </div>
      
      {/* Saving indicator */}
      {savingCorrection && (
        <div className="mb-4 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Learning from your correction...
        </div>
      )}
      
      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

      {/* Food Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Food Items Detected:</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
          >
            + Add Item
          </button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="border-2 border-dashed border-primary-300 rounded-lg p-4 bg-primary-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Food name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Quantity (e.g., 100g)"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                placeholder="Calories"
                value={newItem.calories}
                onChange={(e) => setNewItem({ ...newItem, calories: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={addItem}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {editingId === (item.id || String(index)) ? (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="font-semibold text-lg text-gray-800 w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onBlur={() => setEditingId(null)}
                    autoFocus
                  />
                ) : (
                  <h4 
                    className="font-semibold text-lg text-gray-800 cursor-pointer hover:text-primary-600"
                    onClick={() => setEditingId(item.id || String(index))}
                    title="Click to edit"
                  >
                    {item.name}
                  </h4>
                )}
                
                {/* Editable Quantity */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Portion:</span>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="text-sm text-gray-700 px-2 py-1 border rounded w-24 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    title="Edit portion size"
                  />
                </div>
              </div>
              
              <div className="text-right flex items-start gap-2">
                {/* Editable Calories */}
                <div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={item.calories}
                      onChange={(e) => updateItem(index, 'calories', e.target.value)}
                      className="text-xl font-bold text-primary-600 w-20 text-right px-1 py-0.5 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-500">cal</span>
                  </div>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={() => deleteItem(index)}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Remove item"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Macros */}
            {(item.protein || item.carbs || item.fat) && (
              <div className="flex gap-4 mt-3 text-sm flex-wrap">
                {item.protein !== undefined && (
                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Protein: {item.protein}g
                  </span>
                )}
                {item.carbs !== undefined && (
                  <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                    Carbs: {item.carbs}g
                  </span>
                )}
                {item.fat !== undefined && (
                  <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    Fat: {item.fat}g
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-sm text-gray-600 border border-blue-100">
        <p className="font-medium mb-1">🧠 AI Learning:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Your corrections help improve estimates for everyone</li>
          <li>Edit portions or calories - changes are saved automatically</li>
          <li>Use the feedback buttons to rate accuracy</li>
          <li>The more you use the app, the smarter it gets!</li>
        </ul>
      </div>
    </div>
  )
}
