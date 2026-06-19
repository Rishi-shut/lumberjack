-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_needed INTEGER DEFAULT 100,
  highscore INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 100,
  diamonds INTEGER DEFAULT 0,
  tickets INTEGER DEFAULT 0,
  equipped_character TEXT DEFAULT 'char_lumberjack',
  equipped_weapon TEXT DEFAULT 'weap_axe_wood',
  equipped_trail TEXT DEFAULT 'trail_none',
  equipped_title TEXT DEFAULT 'title_none',
  equipped_badge TEXT DEFAULT 'Chop Icon',
  equipped_frame TEXT DEFAULT 'Standard',
  last_daily_claim TEXT,
  has_premium_pass BOOLEAN DEFAULT FALSE,
  claimed_free_tiers JSONB DEFAULT '[]'::jsonb,
  claimed_premium_tiers JSONB DEFAULT '[]'::jsonb,
  stats_data JSONB DEFAULT '{}'::jsonb,
  shop_data JSONB DEFAULT '[]'::jsonb,
  achievements_data JSONB DEFAULT '[]'::jsonb,
  missions_data JSONB DEFAULT '[]'::jsonb,
  settings_data JSONB DEFAULT '{}'::jsonb,
  telemetry_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Allow anyone to read profiles (needed for global leaderboard)
CREATE POLICY "Allow public read access to profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

-- 2. Insert Policy: Authenticated users can insert their own profile
CREATE POLICY "Allow users to insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. Update Policy: Users can update their own profile
CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 4. Admin Update Policy: Allow admin 'mriga' to update any profile
CREATE POLICY "Allow admin mriga to update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid() 
      AND LOWER(public.profiles.username) = 'mriga'
    )
  );

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
