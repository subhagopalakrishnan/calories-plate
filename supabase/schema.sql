-- Supabase Database Schema for Calories Plate
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  daily_calorie_goal INTEGER DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food logs table
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  food_items JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(10,2) NOT NULL DEFAULT 0,
  meal_count INTEGER NOT NULL DEFAULT 0,
  goal_met BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at ON food_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for food_logs
CREATE POLICY "Users can view own food logs" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for daily_summaries
CREATE POLICY "Users can view own daily summaries" ON daily_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries" ON daily_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily summaries" ON daily_summaries
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- LEARNING SYSTEM TABLES
-- ============================================

-- User corrections table - stores when users edit AI estimates
CREATE TABLE IF NOT EXISTS user_corrections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  original_quantity TEXT,
  corrected_quantity TEXT,
  original_calories INTEGER,
  corrected_calories INTEGER,
  original_protein DECIMAL(10,2),
  corrected_protein DECIMAL(10,2),
  original_carbs DECIMAL(10,2),
  corrected_carbs DECIMAL(10,2),
  original_fat DECIMAL(10,2),
  corrected_fat DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learned foods table - aggregated nutritional data from all users
CREATE TABLE IF NOT EXISTS learned_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  food_name TEXT NOT NULL UNIQUE,
  food_name_normalized TEXT NOT NULL, -- lowercase, trimmed for matching
  avg_calories_per_100g DECIMAL(10,2),
  avg_protein_per_100g DECIMAL(10,2),
  avg_carbs_per_100g DECIMAL(10,2),
  avg_fat_per_100g DECIMAL(10,2),
  sample_count INTEGER DEFAULT 1, -- how many data points
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1 based on sample count
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback table - thumbs up/down on estimates
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  food_log_id UUID REFERENCES food_logs(id) ON DELETE CASCADE,
  is_accurate BOOLEAN NOT NULL, -- true = good, false = needs improvement
  feedback_text TEXT, -- optional detailed feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for learning tables
CREATE INDEX IF NOT EXISTS idx_corrections_food_name ON user_corrections(food_name);
CREATE INDEX IF NOT EXISTS idx_learned_foods_normalized ON learned_foods(food_name_normalized);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON user_feedback(user_id);

-- RLS for learning tables
ALTER TABLE user_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Everyone can read learned foods (public knowledge base)
CREATE POLICY "Anyone can view learned foods" ON learned_foods
  FOR SELECT USING (true);

-- Only authenticated users can contribute to learned foods
CREATE POLICY "Authenticated users can insert learned foods" ON learned_foods
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update learned foods" ON learned_foods
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Users can only manage their own corrections
CREATE POLICY "Users can view own corrections" ON user_corrections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own corrections" ON user_corrections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only manage their own feedback
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update learned foods when a correction is made
CREATE OR REPLACE FUNCTION update_learned_food()
RETURNS TRIGGER AS $$
DECLARE
  normalized_name TEXT;
  existing_food learned_foods%ROWTYPE;
BEGIN
  normalized_name := LOWER(TRIM(NEW.food_name));
  
  -- Try to find existing entry
  SELECT * INTO existing_food FROM learned_foods 
  WHERE food_name_normalized = normalized_name;
  
  IF existing_food IS NULL THEN
    -- Insert new learned food
    INSERT INTO learned_foods (
      food_name, 
      food_name_normalized,
      avg_calories_per_100g,
      avg_protein_per_100g,
      avg_carbs_per_100g,
      avg_fat_per_100g,
      sample_count,
      confidence_score
    ) VALUES (
      NEW.food_name,
      normalized_name,
      NEW.corrected_calories,
      NEW.corrected_protein,
      NEW.corrected_carbs,
      NEW.corrected_fat,
      1,
      0.3
    );
  ELSE
    -- Update with running average
    UPDATE learned_foods SET
      avg_calories_per_100g = (
        (avg_calories_per_100g * sample_count + NEW.corrected_calories) / (sample_count + 1)
      ),
      avg_protein_per_100g = (
        (avg_protein_per_100g * sample_count + COALESCE(NEW.corrected_protein, 0)) / (sample_count + 1)
      ),
      avg_carbs_per_100g = (
        (avg_carbs_per_100g * sample_count + COALESCE(NEW.corrected_carbs, 0)) / (sample_count + 1)
      ),
      avg_fat_per_100g = (
        (avg_fat_per_100g * sample_count + COALESCE(NEW.corrected_fat, 0)) / (sample_count + 1)
      ),
      sample_count = sample_count + 1,
      confidence_score = LEAST(0.95, 0.3 + (sample_count * 0.05)),
      last_updated = NOW()
    WHERE food_name_normalized = normalized_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update learned foods when corrections are made
DROP TRIGGER IF EXISTS on_correction_made ON user_corrections;
CREATE TRIGGER on_correction_made
  AFTER INSERT ON user_corrections
  FOR EACH ROW EXECUTE FUNCTION update_learned_food();

