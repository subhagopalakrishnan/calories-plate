'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { FoodLog, DailySummary } from '@/types/database'

export default function DailyDashboard() {
  const { user, profile } = useAuth()
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const calorieGoal = profile?.daily_calorie_goal || 2000

  useEffect(() => {
    if (user) {
      fetchTodayData()
    }
  }, [user])

  async function fetchTodayData() {
    setLoading(true)
    
    // Fetch daily summary
    const { data: summaryData } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today)
      .single()

    setSummary(summaryData)

    // Fetch today's logs
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

  const caloriesConsumed = summary?.total_calories || 0
  const caloriesRemaining = calorieGoal - caloriesConsumed
  const progressPercent = Math.min((caloriesConsumed / calorieGoal) * 100, 100)

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Today&apos;s Progress</h2>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Calorie Progress Ring */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke={progressPercent >= 100 ? '#ef4444' : '#22c55e'}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{caloriesConsumed}</span>
            <span className="text-sm text-gray-500">of {calorieGoal} cal</span>
          </div>
        </div>
      </div>

      {/* Remaining Calories */}
      <div className={`text-center mb-6 p-3 rounded-lg ${
        caloriesRemaining >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        {caloriesRemaining >= 0 ? (
          <p><strong>{caloriesRemaining}</strong> calories remaining today</p>
        ) : (
          <p><strong>{Math.abs(caloriesRemaining)}</strong> calories over budget!</p>
        )}
      </div>

      {/* Macros Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">
            {(summary?.total_protein || 0).toFixed(0)}g
          </div>
          <div className="text-xs text-gray-500">Protein</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-700">
            {(summary?.total_carbs || 0).toFixed(0)}g
          </div>
          <div className="text-xs text-gray-500">Carbs</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-700">
            {(summary?.total_fat || 0).toFixed(0)}g
          </div>
          <div className="text-xs text-gray-500">Fat</div>
        </div>
      </div>

      {/* Today's Meals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Today&apos;s Meals</h3>
        {todayLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No meals logged today. Start by analyzing a food photo!</p>
        ) : (
          <div className="space-y-3">
            {todayLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800 capitalize">{log.meal_type}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {new Date(log.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <div className="text-xs text-gray-400">
                    {log.food_items.length} item{log.food_items.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600">{log.total_calories} cal</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

