'use client'

import { useState } from 'react'
import { FoodItem } from '@/types'

interface CalorieResultsProps {
  foodItems: FoodItem[]
  onUpdateItems?: (items: FoodItem[]) => void
}

export default function CalorieResults({ foodItems: initialItems, onUpdateItems }: CalorieResultsProps) {
  const [items, setItems] = useState<FoodItem[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: '', calories: '' })

  // Calculate totals
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0)
  const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0)
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0)
  const totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0)

  const updateItem = (index: number, field: keyof FoodItem, value: string | number) => {
    const newItems = [...items]
    const item = { ...newItems[index] }
    
    if (field === 'quantity') {
      // Parse the new quantity
      const newQty = String(value)
      const oldQty = item.quantity
      
      // Extract numeric values
      const newNum = parseFloat(newQty.match(/(\d+\.?\d*)/)?.[1] || '1')
      const oldNum = parseFloat(oldQty.match(/(\d+\.?\d*)/)?.[1] || '1')
      
      // Calculate ratio for proportional scaling
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
  }

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    onUpdateItems?.(newItems)
  }

  const addItem = () => {
    if (!newItem.name || !newItem.calories) return
    
    const item: FoodItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity: newItem.quantity || '1 serving',
      calories: parseInt(newItem.calories) || 0,
    }
    
    const newItems = [...items, item]
    setItems(newItems)
    onUpdateItems?.(newItems)
    setNewItem({ name: '', quantity: '', calories: '' })
    setShowAddForm(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-3xl font-bold text-primary-800 mb-6">Nutritional Analysis</h2>
      
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
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click on food names to edit them</li>
          <li>Adjust portion sizes - calories will scale automatically</li>
          <li>Click the trash icon to remove items</li>
          <li>Use &quot;+ Add Item&quot; to add foods manually</li>
        </ul>
      </div>
    </div>
  )
}
