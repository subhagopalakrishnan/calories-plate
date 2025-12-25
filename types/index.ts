export interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface AnalysisResponse {
  foodItems: FoodItem[]
  totalCalories: number
}

