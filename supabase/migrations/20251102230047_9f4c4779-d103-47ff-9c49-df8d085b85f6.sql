-- Fix 1: Restrict profile access to authenticated users and connections
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view connected profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.connections
    WHERE (user_id = auth.uid() AND connected_user_id = profiles.id AND status = 'accepted')
    OR (connected_user_id = auth.uid() AND user_id = profiles.id AND status = 'accepted')
  )
);

-- Fix 2: Enforce proper visibility for hives (connections-only support)
DROP POLICY IF EXISTS "Public hives are viewable by everyone" ON public.hives;

CREATE POLICY "Hives visible based on access rules"
ON public.hives FOR SELECT
USING (
  visibility = 'public'
  OR host_id = auth.uid()
  OR (
    visibility = 'connections' AND EXISTS (
      SELECT 1 FROM public.connections
      WHERE ((user_id = auth.uid() AND connected_user_id = host_id AND status = 'accepted')
      OR (connected_user_id = auth.uid() AND user_id = host_id AND status = 'accepted'))
    )
  )
);

-- Fix 2b: Enforce proper visibility for buzz (connections-only support)
DROP POLICY IF EXISTS "Public buzz are viewable by everyone" ON public.buzz;

CREATE POLICY "Buzz visible based on access rules"
ON public.buzz FOR SELECT
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR (
    visibility = 'connections' AND EXISTS (
      SELECT 1 FROM public.connections
      WHERE ((user_id = auth.uid() AND connected_user_id = buzz.user_id AND status = 'accepted')
      OR (connected_user_id = auth.uid() AND user_id = buzz.user_id AND status = 'accepted'))
    )
  )
);

-- Fix 2c: Enforce proper visibility for hive_attendees based on hive visibility
DROP POLICY IF EXISTS "Hive attendees are viewable by everyone" ON public.hive_attendees;

CREATE POLICY "View attendees based on hive visibility"
ON public.hive_attendees FOR SELECT
USING (
  -- Public hive attendees are visible
  EXISTS (
    SELECT 1 FROM public.hives
    WHERE hives.id = hive_attendees.hive_id
    AND hives.visibility = 'public'
  )
  OR
  -- Own RSVP always visible
  auth.uid() = user_id
  OR
  -- Connected users for connections-only hives
  EXISTS (
    SELECT 1 FROM public.hives h
    INNER JOIN public.connections c ON (
      (c.user_id = auth.uid() AND c.connected_user_id = hive_attendees.user_id AND c.status = 'accepted')
      OR (c.connected_user_id = auth.uid() AND c.user_id = hive_attendees.user_id AND c.status = 'accepted')
    )
    WHERE h.id = hive_attendees.hive_id
    AND h.visibility = 'connections'
  )
  OR
  -- Host can always see attendees
  EXISTS (
    SELECT 1 FROM public.hives
    WHERE hives.id = hive_attendees.hive_id
    AND hives.host_id = auth.uid()
  )
);

-- Fix 3: Add input validation constraints (length limits)
ALTER TABLE public.profiles ADD CONSTRAINT username_length CHECK (char_length(username) > 0 AND char_length(username) <= 50);
ALTER TABLE public.profiles ADD CONSTRAINT bio_length CHECK (bio IS NULL OR char_length(bio) <= 500);
ALTER TABLE public.profiles ADD CONSTRAINT location_length CHECK (location IS NULL OR char_length(location) <= 200);

ALTER TABLE public.hives ADD CONSTRAINT hive_name_length CHECK (char_length(name) > 0 AND char_length(name) <= 200);
ALTER TABLE public.hives ADD CONSTRAINT hive_description_length CHECK (char_length(description) > 0 AND char_length(description) <= 2000);
ALTER TABLE public.hives ADD CONSTRAINT hive_location_length CHECK (char_length(location) > 0 AND char_length(location) <= 200);

ALTER TABLE public.buzz ADD CONSTRAINT buzz_description_length CHECK (char_length(description) > 0 AND char_length(description) <= 1000);
ALTER TABLE public.buzz ADD CONSTRAINT buzz_location_length CHECK (location IS NULL OR char_length(location) <= 200);