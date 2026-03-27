-- Funduq Supabase SQL Schema (MVP)

-- Enable pgcrypto (if not already for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PROFILES TABLE
-- Linked to auth.users, stores personal information and roles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'owner', 'admin')),
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTIES TABLE
-- Stores information about villas and penthouses
CREATE TABLE public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- e.g., 'Villa', 'Penthouse'
    price_min NUMERIC NOT NULL,
    price_max NUMERIC NOT NULL,
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    location_emirate TEXT NOT NULL, -- e.g., 'Dubai', 'Abu Dhabi', 'Ras Al Khaimah'
    location_district TEXT NOT NULL, -- e.g., 'Palm Jumeirah', 'Downtown', 'Al Barari'
    main_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS TABLE
-- Handles short-term rental transactions and reservation states
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_guests INTEGER NOT NULL CHECK (total_guests > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure check_out is after check_in
    CONSTRAINT valid_booking_dates CHECK (check_out > check_in)
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Anyone can read their own profile, admins see everything
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: 
-- 1. Guests can read active properties
CREATE POLICY "Guests can view active properties" 
ON public.properties FOR SELECT USING (status = 'active');

-- 2. Owners can manage their own properties
CREATE POLICY "Owners can create properties" 
ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own properties" 
ON public.properties FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own properties" 
ON public.properties FOR DELETE USING (auth.uid() = owner_id);

-- Bookings: 
-- Read access for involved parties (Guest or Property Owner)
CREATE POLICY "Parties can view bookings" 
ON public.bookings FOR SELECT USING (
    auth.uid() = guest_id 
    OR auth.uid() IN (SELECT owner_id FROM public.properties WHERE id = property_id)
);

-- Guest can insert bookings
CREATE POLICY "Guests can book properties" 
ON public.bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);

-- Involved parties can update booking status
CREATE POLICY "Parties can update bookings" 
ON public.bookings FOR UPDATE USING (
    auth.uid() = guest_id 
    OR auth.uid() IN (SELECT owner_id FROM public.properties WHERE id = property_id)
);

-- TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', COALESCE(new.raw_user_meta_data->>'role', 'guest'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
