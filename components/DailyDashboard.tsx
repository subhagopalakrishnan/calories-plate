'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { FoodLog } from '@/types/database'

export default function DailyDashboard() {
  const { user } = useAuth()
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (user) {
      fetchTodayData()
    }
  }, [user])

  async function fetchTodayData() {
    setLoading(true)
    
    try {
      const startOfDay = `${today}T00:00:00.000Z`
      const endOfDay = `${today}T23:59:59.999Z`

      const { data: logsData } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('logged_at', startOfDay)
        .lte('logged_at', endOfDay)
        .order('logged_at', { ascending: false })

      setTodayLogs(logsData || [])
    } catch (e) {
      console.log('Error fetching logs:', e)
    }
    setLoading(false)
  }

  // Calculate today's totals from saved meals
  const todayTotals = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + log.total_calories,
    protein: acc.protein + log.total_protein,
    carbs: acc.carbs + log.total_carbs,
    fat: acc.fat + log.total_fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Today&apos;s Saved Meals</h4>
      
      {/* Today's totals */}
      {todayLogs.length > 0 && (
        <div className="bg-primary-50 rounded-lg p-3 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-700">{todayTotals.calories}</div>
            <div className="text-xs text-gray-500">calories logged today</div>
          </div>
          <div className="flex justify-center gap-3 mt-2 text-xs">
            <span className="text-blue-600">P: {todayTotals.protein.toFixed(0)}g</span>
            <span className="text-yellow-600">C: {todayTotals.carbs.toFixed(0)}g</span>
            <span className="text-orange-600">F: {todayTotals.fat.toFixed(0)}g</span>
          </div>
        </div>
      )}
      
      {/* Meal list */}
      {todayLogs.length === 0 ? (
        <p className="text-gray-400 text-center py-3 text-sm">
          No meals saved today yet
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {todayLogs.map((log) => (
            <div key={log.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
              <div>
                <span className="font-medium text-gray-700 capitalize">{log.meal_type}</span>
                <span className="text-gray-400 text-xs ml-1">
                  {new Date(log.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <span className="font-medium text-primary-600">{log.total_calories} cal</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
