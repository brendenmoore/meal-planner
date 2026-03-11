-- Create tables for Meal Planner App

-- 1. Recipes Table
CREATE TABLE public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ingredients JSONB DEFAULT '[]'::jsonb NOT NULL,
  instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Meal Plans Table (A combination of recipes)
CREATE TABLE public.meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipe_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Meal Plan Templates (A sequence/list of meal plans)
CREATE TABLE public.meal_plan_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_plan_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Schedules (Items scheduled for a specific date)
CREATE TABLE public.schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_plan_ids UUID[] DEFAULT '{}'::uuid[],
  recipe_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date) -- Ensure only one schedule record per user per date
);

-- 5. Staples (Standard non-recipe shopping items)
CREATE TABLE public.staples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup Row Level Security (RLS) policies
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staples ENABLE ROW LEVEL SECURITY;

-- Policies for Recipes
CREATE POLICY "Users can view own recipes." ON public.recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes." ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes." ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes." ON public.recipes FOR DELETE USING (auth.uid() = user_id);

-- Policies for Meal Plans
CREATE POLICY "Users can view own meal plans." ON public.meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans." ON public.meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans." ON public.meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans." ON public.meal_plans FOR DELETE USING (auth.uid() = user_id);

-- Policies for Meal Plan Templates
CREATE POLICY "Users can view own templates." ON public.meal_plan_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates." ON public.meal_plan_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates." ON public.meal_plan_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates." ON public.meal_plan_templates FOR DELETE USING (auth.uid() = user_id);

-- Policies for Schedules
CREATE POLICY "Users can view own schedules." ON public.schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules." ON public.schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules." ON public.schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules." ON public.schedules FOR DELETE USING (auth.uid() = user_id);

-- Policies for Staples
CREATE POLICY "Users can view own staples." ON public.staples FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own staples." ON public.staples FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own staples." ON public.staples FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own staples." ON public.staples FOR DELETE USING (auth.uid() = user_id);
