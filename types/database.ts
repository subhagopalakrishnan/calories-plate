export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          daily_calorie_goal: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          daily_calorie_goal?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          daily_calorie_goal?: number
          updated_at?: string
        }
      }
      food_logs: {
        Row: {
          id: string
          user_id: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_items: FoodItemDB[]
          total_calories: number
          total_protein: number
          total_carbs: number
          total_fat: number
          image_url: string | null
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_items: FoodItemDB[]
          total_calories: number
          total_protein: number
          total_carbs: number
          total_fat: number
          image_url?: string | null
          logged_at?: string
          created_at?: string
        }
        Update: {
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_items?: FoodItemDB[]
          total_calories?: number
          total_protein?: number
          total_carbs?: number
          total_fat?: number
          image_url?: string | null
          logged_at?: string
        }
      }
      daily_summaries: {
        Row: {
          id: string
          user_id: string
          date: string
          total_calories: number
          total_protein: number
          total_carbs: number
          total_fat: number
          meal_count: number
          goal_met: boolean
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          total_calories?: number
          total_protein?: number
          total_carbs?: number
          total_fat?: number
          meal_count?: number
          goal_met?: boolean
        }
        Update: {
          total_calories?: number
          total_protein?: number
          total_carbs?: number
          total_fat?: number
          meal_count?: number
          goal_met?: boolean
        }
      }
      user_corrections: {
        Row: {
          id: string
          user_id: string | null
          food_name: string
          original_quantity: string | null
          corrected_quantity: string | null
          original_calories: number | null
          corrected_calories: number | null
          original_protein: number | null
          corrected_protein: number | null
          original_carbs: number | null
          corrected_carbs: number | null
          original_fat: number | null
          corrected_fat: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          food_name: string
          original_quantity?: string | null
          corrected_quantity?: string | null
          original_calories?: number | null
          corrected_calories?: number | null
          original_protein?: number | null
          corrected_protein?: number | null
          original_carbs?: number | null
          corrected_carbs?: number | null
          original_fat?: number | null
          corrected_fat?: number | null
          created_at?: string
        }
        Update: {
          food_name?: string
          original_quantity?: string | null
          corrected_quantity?: string | null
          original_calories?: number | null
          corrected_calories?: number | null
          original_protein?: number | null
          corrected_protein?: number | null
          original_carbs?: number | null
          corrected_carbs?: number | null
          original_fat?: number | null
          corrected_fat?: number | null
        }
      }
      learned_foods: {
        Row: {
          id: string
          food_name: string
          food_name_normalized: string
          avg_calories_per_100g: number | null
          avg_protein_per_100g: number | null
          avg_carbs_per_100g: number | null
          avg_fat_per_100g: number | null
          sample_count: number
          confidence_score: number
          last_updated: string
        }
        Insert: {
          id?: string
          food_name: string
          food_name_normalized: string
          avg_calories_per_100g?: number | null
          avg_protein_per_100g?: number | null
          avg_carbs_per_100g?: number | null
          avg_fat_per_100g?: number | null
          sample_count?: number
          confidence_score?: number
          last_updated?: string
        }
        Update: {
          food_name?: string
          food_name_normalized?: string
          avg_calories_per_100g?: number | null
          avg_protein_per_100g?: number | null
          avg_carbs_per_100g?: number | null
          avg_fat_per_100g?: number | null
          sample_count?: number
          confidence_score?: number
          last_updated?: string
        }
      }
      user_feedback: {
        Row: {
          id: string
          user_id: string
          food_log_id: string | null
          is_accurate: boolean
          feedback_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          food_log_id?: string | null
          is_accurate: boolean
          feedback_text?: string | null
          created_at?: string
        }
        Update: {
          is_accurate?: boolean
          feedback_text?: string | null
        }
      }
    }
  }
}

export interface FoodItemDB {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type FoodLog = Database['public']['Tables']['food_logs']['Row']
export type DailySummary = Database['public']['Tables']['daily_summaries']['Row']
export type UserCorrection = Database['public']['Tables']['user_corrections']['Row']
export type LearnedFood = Database['public']['Tables']['learned_foods']['Row']
export type UserFeedback = Database['public']['Tables']['user_feedback']['Row']

