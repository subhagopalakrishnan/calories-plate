-- =============================================
-- CALORIES PLATE - COMPLETE DATABASE SETUP
-- =============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STEP 1: CLEAN UP (Remove existing tables/triggers)
-- =============================================

-- Drop functions first (this will cascade drop their triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_learned_food() CASCADE;

-- Drop tables in correct order (children before parents)
DROP TABLE IF EXISTS user_feedback CASCADE;
DROP TABLE IF EXISTS user_corrections CASCADE;
DROP TABLE IF EXISTS learned_foods CASCADE;
DROP TABLE IF EXISTS daily_summaries CASCADE;
DROP TABLE IF EXISTS food_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- STEP 2: CREATE TABLES
-- =============================================

-- 1. PROFILES TABLE (User accounts)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  daily_calorie_goal INTEGER DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FOOD_LOGS TABLE (Saved meals)
CREATE TABLE food_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  food_items JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DAILY_SUMMARIES TABLE (Daily totals)
CREATE TABLE daily_summaries (
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

-- 4. USER_CORRECTIONS TABLE (Learning from edits)
CREATE TABLE user_corrections (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LEARNED_FOODS TABLE (Aggregated food data)
CREATE TABLE learned_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  food_name TEXT NOT NULL UNIQUE,
  food_name_normalized TEXT NOT NULL,
  avg_calories_per_100g DECIMAL(10,2),
  avg_protein_per_100g DECIMAL(10,2),
  avg_carbs_per_100g DECIMAL(10,2),
  avg_fat_per_100g DECIMAL(10,2),
  sample_count INTEGER DEFAULT 1,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 6. USER_FEEDBACK TABLE (Accuracy ratings)
CREATE TABLE user_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  food_log_id UUID REFERENCES food_logs(id) ON DELETE CASCADE,
  is_accurate BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 3: CREATE INDEXES
-- =============================================
CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_logged_at ON food_logs(logged_at);
CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, date);
CREATE INDEX idx_corrections_food_name ON user_corrections(food_name);
CREATE INDEX idx_learned_foods_normalized ON learned_foods(food_name_normalized);

-- =============================================
-- STEP 4: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- FOOD_LOGS policies
CREATE POLICY "Users can view own food logs" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food logs" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food logs" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food logs" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);

-- DAILY_SUMMARIES policies
CREATE POLICY "Users can view own summaries" ON daily_summaries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON daily_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON daily_summaries
  FOR UPDATE USING (auth.uid() = user_id);

-- USER_CORRECTIONS policies
CREATE POLICY "Users can view own corrections" ON user_corrections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert corrections" ON user_corrections
  FOR INSERT WITH CHECK (true);

-- LEARNED_FOODS policies (public read, auth write)
CREATE POLICY "Anyone can view learned foods" ON learned_foods
  FOR SELECT USING (true);
CREATE POLICY "Auth users can insert learned foods" ON learned_foods
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update learned foods" ON learned_foods
  FOR UPDATE USING (true);

-- USER_FEEDBACK policies
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert feedback" ON user_feedback
  FOR INSERT WITH CHECK (true);

-- =============================================
-- STEP 5: TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update learned foods when corrections are made
CREATE OR REPLACE FUNCTION public.update_learned_food()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  normalized_name TEXT;
  existing_food learned_foods%ROWTYPE;
BEGIN
  normalized_name := LOWER(TRIM(NEW.food_name));
  
  SELECT * INTO existing_food FROM learned_foods 
  WHERE food_name_normalized = normalized_name;
  
  IF existing_food IS NULL THEN
    INSERT INTO learned_foods (
      food_name, food_name_normalized,
      avg_calories_per_100g, avg_protein_per_100g,
      avg_carbs_per_100g, avg_fat_per_100g,
      sample_count, confidence_score
    ) VALUES (
      NEW.food_name, normalized_name,
      NEW.corrected_calories, NEW.corrected_protein,
      NEW.corrected_carbs, NEW.corrected_fat,
      1, 0.3
    );
  ELSE
    UPDATE learned_foods SET
      avg_calories_per_100g = (avg_calories_per_100g * sample_count + COALESCE(NEW.corrected_calories, 0)) / (sample_count + 1),
      avg_protein_per_100g = (avg_protein_per_100g * sample_count + COALESCE(NEW.corrected_protein, 0)) / (sample_count + 1),
      avg_carbs_per_100g = (avg_carbs_per_100g * sample_count + COALESCE(NEW.corrected_carbs, 0)) / (sample_count + 1),
      avg_fat_per_100g = (avg_fat_per_100g * sample_count + COALESCE(NEW.corrected_fat, 0)) / (sample_count + 1),
      sample_count = sample_count + 1,
      confidence_score = LEAST(0.95, 0.3 + (sample_count * 0.05)),
      last_updated = NOW()
    WHERE food_name_normalized = normalized_name;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_correction_made
  AFTER INSERT ON user_corrections
  FOR EACH ROW EXECUTE FUNCTION public.update_learned_food();

-- =============================================
-- DONE! Verify tables were created
-- =============================================
SELECT 
  '✅ SUCCESS! All tables created.' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count;

