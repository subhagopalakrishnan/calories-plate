export interface FoodItem {
  id?: string
  name: string
  quantity: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  // Base values per 100g for recalculation
  caloriesPer100g?: number
  proteinPer100g?: number
  carbsPer100g?: number
  fatPer100g?: number
}

export interface AnalysisResponse {
  foodItems: FoodItem[]
  totalCalories: number
  isDemo?: boolean
  message?: string
}
