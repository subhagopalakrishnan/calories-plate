'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { FoodLog, DailySummary } from '@/types/database'

// Daily nutrition goals (can be customized per user)
interface NutritionGoals {
  calories: number
  protein: number  // grams
  carbs: number    // grams
  fat: number      // grams
}

// Default goals based on 2000 calorie diet
const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 50,    // ~10% of calories
  carbs: 250,     // ~50% of calories
  fat: 65,        // ~30% of calories
}

export default function DailyDashboard() {
  const { user, profile } = useAuth()
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoalsEditor, setShowGoalsEditor] = useState(false)
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS)
  const [editingGoals, setEditingGoals] = useState<NutritionGoals>(DEFAULT_GOALS)

  const today = new Date().toISOString().split('T')[0]

  // Load goals from profile or localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('nutritionGoals')
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals))
      setEditingGoals(JSON.parse(savedGoals))
    } else if (profile?.daily_calorie_goal) {
      const customGoals = calculateGoalsFromCalories(profile.daily_calorie_goal)
      setGoals(customGoals)
      setEditingGoals(customGoals)
    }
  }, [profile])

  useEffect(() => {
    if (user) {
      fetchTodayData()
    }
  }, [user])

  // Calculate macro goals based on calorie target
  function calculateGoalsFromCalories(calories: number): NutritionGoals {
    return {
      calories,
      protein: Math.round(calories * 0.20 / 4),  // 20% protein, 4 cal/g
      carbs: Math.round(calories * 0.50 / 4),    // 50% carbs, 4 cal/g
      fat: Math.round(calories * 0.30 / 9),      // 30% fat, 9 cal/g
    }
  }

  async function fetchTodayData() {
    setLoading(true)
    
    const { data: summaryData } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today)
      .single()

    setSummary(summaryData)

    const startOfDay = `${today}T00:00:00.000Z`
    const endOfDay = `${today}T23:59:59.999Z`

    const { data: logsData } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', startOfDay)
      .lte('logged_at', endOfDay)
      .order('logged_at', { ascending: true })

    setTodayLogs(logsData || [])
    setLoading(false)
  }

  function saveGoals() {
    setGoals(editingGoals)
    localStorage.setItem('nutritionGoals', JSON.stringify(editingGoals))
    setShowGoalsEditor(false)
  }

  // Current consumption
  const consumed = {
    calories: summary?.total_calories || 0,
    protein: summary?.total_protein || 0,
    carbs: summary?.total_carbs || 0,
    fat: summary?.total_fat || 0,
  }

  // Progress percentages
  const progress = {
    calories: Math.min((consumed.calories / goals.calories) * 100, 100),
    protein: Math.min((consumed.protein / goals.protein) * 100, 100),
    carbs: Math.min((consumed.carbs / goals.carbs) * 100, 100),
    fat: Math.min((consumed.fat / goals.fat) * 100, 100),
  }

  // Remaining
  const remaining = {
    calories: goals.calories - consumed.calories,
    protein: goals.protein - consumed.protein,
    carbs: goals.carbs - consumed.carbs,
    fat: goals.fat - consumed.fat,
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Daily Nutrition</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => setShowGoalsEditor(true)}
            className="p-1 text-gray-400 hover:text-primary-600 rounded"
            title="Edit goals"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calorie Progress Ring */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="10" fill="none" />
            <circle
              cx="80" cy="80" r="70"
              stroke={remaining.calories >= 0 ? '#22c55e' : '#ef4444'}
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress.calories / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{consumed.calories}</span>
            <span className="text-xs text-gray-500">of {goals.calories}</span>
            <span className="text-xs text-gray-400">calories</span>
          </div>
        </div>
      </div>

      {/* Remaining Calories Banner */}
      <div className={`text-center mb-4 p-2 rounded-lg text-sm ${
        remaining.calories >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        {remaining.calories >= 0 ? (
          <span><strong>{remaining.calories}</strong> cal remaining</span>
        ) : (
          <span><strong>{Math.abs(remaining.calories)}</strong> cal over budget!</span>
        )}
      </div>

      {/* Macro Progress Bars */}
      <div className="space-y-3 mb-6">
        {/* Protein */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">🥩 Protein</span>
            <span className="text-gray-800 font-medium">
              {consumed.protein.toFixed(0)}g / {goals.protein}g
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.protein}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {remaining.protein > 0 ? `${remaining.protein.toFixed(0)}g left` : 'Goal reached! ✓'}
          </div>
        </div>

        {/* Carbs */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">🍞 Carbs</span>
            <span className="text-gray-800 font-medium">
              {consumed.carbs.toFixed(0)}g / {goals.carbs}g
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.carbs}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {remaining.carbs > 0 ? `${remaining.carbs.toFixed(0)}g left` : 'Goal reached! ✓'}
          </div>
        </div>

        {/* Fat */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">🥑 Fat</span>
            <span className="text-gray-800 font-medium">
              {consumed.fat.toFixed(0)}g / {goals.fat}g
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.fat}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {remaining.fat > 0 ? `${remaining.fat.toFixed(0)}g left` : 'Goal reached! ✓'}
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Today&apos;s Meals</h3>
        {todayLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4 text-sm">
            No meals logged today.<br/>Start by analyzing a food photo!
          </p>
        ) : (
          <div className="space-y-2">
            {todayLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800 capitalize text-sm">{log.meal_type}</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {new Date(log.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <div className="text-xs text-gray-400">
                    {log.food_items.length} item{log.food_items.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600 text-sm">{log.total_calories} cal</div>
                  <div className="text-xs text-gray-400">
                    P:{log.total_protein.toFixed(0)} C:{log.total_carbs.toFixed(0)} F:{log.total_fat.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nutrition Tips */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> {getNutritionTip(consumed, goals)}
        </p>
      </div>

      {/* Goals Editor Modal */}
      {showGoalsEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Set Daily Goals</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Calories
                </label>
                <input
                  type="number"
                  value={editingGoals.calories}
                  onChange={(e) => {
                    const cal = Number(e.target.value)
                    setEditingGoals(calculateGoalsFromCalories(cal))
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={editingGoals.protein}
                    onChange={(e) => setEditingGoals({ ...editingGoals, protein: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={editingGoals.carbs}
                    onChange={(e) => setEditingGoals({ ...editingGoals, carbs: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={editingGoals.fat}
                    onChange={(e) => setEditingGoals({ ...editingGoals, fat: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Quick Presets</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: '1500 cal', calories: 1500 },
                    { label: '2000 cal', calories: 2000 },
                    { label: '2500 cal', calories: 2500 },
                    { label: '3000 cal', calories: 3000 },
                  ].map((preset) => (
                    <button
                      key={preset.calories}
                      onClick={() => setEditingGoals(calculateGoalsFromCalories(preset.calories))}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        editingGoals.calories === preset.calories
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-primary-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Macro Split Info */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <div className="font-medium mb-1">Macro Split:</div>
                <div className="flex gap-4">
                  <span>Protein: {Math.round((editingGoals.protein * 4 / editingGoals.calories) * 100)}%</span>
                  <span>Carbs: {Math.round((editingGoals.carbs * 4 / editingGoals.calories) * 100)}%</span>
                  <span>Fat: {Math.round((editingGoals.fat * 9 / editingGoals.calories) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGoalsEditor(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveGoals}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dynamic nutrition tips based on current progress
function getNutritionTip(consumed: { calories: number; protein: number; carbs: number; fat: number }, goals: NutritionGoals): string {
  const proteinPct = consumed.protein / goals.protein
  const carbsPct = consumed.carbs / goals.carbs
  const fatPct = consumed.fat / goals.fat
  const calPct = consumed.calories / goals.calories

  if (calPct < 0.3) {
    return "You've just started tracking today. Keep logging your meals!"
  }
  if (proteinPct < 0.5 && calPct > 0.5) {
    return "Consider adding protein-rich foods like chicken, eggs, or legumes."
  }
  if (fatPct > 1 && calPct < 1) {
    return "You've hit your fat goal. Try lean proteins for remaining calories."
  }
  if (carbsPct > 1 && calPct < 1) {
    return "Carb goal met! Balance with protein or healthy fats."
  }
  if (calPct > 0.8 && calPct < 1) {
    return "Almost at your calorie goal! Choose wisely for your last meal."
  }
  if (calPct >= 1) {
    return "Daily goal reached! Light snacks or wait for tomorrow."
  }
  return "You're on track! Keep up the balanced eating."
}
