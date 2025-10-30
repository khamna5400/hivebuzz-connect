-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create hives table
CREATE TABLE public.hives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'connections')),
  cover_image_url TEXT,
  external_link TEXT,
  recurring TEXT DEFAULT 'one-time' CHECK (recurring IN ('one-time', 'daily', 'weekly', 'monthly')),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hives ENABLE ROW LEVEL SECURITY;

-- Hives policies
CREATE POLICY "Public hives are viewable by everyone"
  ON public.hives FOR SELECT
  USING (visibility = 'public' OR host_id = auth.uid());

CREATE POLICY "Users can create hives"
  ON public.hives FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own hives"
  ON public.hives FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their own hives"
  ON public.hives FOR DELETE
  USING (auth.uid() = host_id);

-- Create buzz table
CREATE TABLE public.buzz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  location TEXT,
  date TIMESTAMP WITH TIME ZONE,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'connections')),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hive_id UUID REFERENCES public.hives(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.buzz ENABLE ROW LEVEL SECURITY;

-- Buzz policies
CREATE POLICY "Public buzz are viewable by everyone"
  ON public.buzz FOR SELECT
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create buzz"
  ON public.buzz FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buzz"
  ON public.buzz FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buzz"
  ON public.buzz FOR DELETE
  USING (auth.uid() = user_id);

-- Create buzz_photos table
CREATE TABLE public.buzz_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buzz_id UUID NOT NULL REFERENCES public.buzz(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.buzz_photos ENABLE ROW LEVEL SECURITY;

-- Buzz photos policies
CREATE POLICY "Buzz photos are viewable with their buzz"
  ON public.buzz_photos FOR SELECT
  USING (true);

CREATE POLICY "Users can add photos to their buzz"
  ON public.buzz_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.buzz
      WHERE buzz.id = buzz_photos.buzz_id
      AND buzz.user_id = auth.uid()
    )
  );

-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Connections policies
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update connections they're part of"
  ON public.connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can delete their own connection requests"
  ON public.connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create hive_attendees table
CREATE TABLE public.hive_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID NOT NULL REFERENCES public.hives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hive_id, user_id)
);

-- Enable RLS
ALTER TABLE public.hive_attendees ENABLE ROW LEVEL SECURITY;

-- Hive attendees policies
CREATE POLICY "Hive attendees are viewable by everyone"
  ON public.hive_attendees FOR SELECT
  USING (true);

CREATE POLICY "Users can RSVP to hives"
  ON public.hive_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVP"
  ON public.hive_attendees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVP"
  ON public.hive_attendees FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hives_updated_at
  BEFORE UPDATE ON public.hives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buzz_updated_at
  BEFORE UPDATE ON public.buzz
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();