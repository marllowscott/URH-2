-- Drop old resources table
DROP TABLE IF EXISTS public.resources CASCADE;

-- Create resources table
CREATE TABLE public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  url TEXT,
  file_path TEXT,
  program TEXT NOT NULL CHECK (program IN ('Software Development', 'Digital Marketing', 'Product Design')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row-Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Row-Level Security Policies
-- Anyone can select (view) resources
CREATE POLICY "Anyone can view resources" ON public.resources
FOR SELECT USING (true);

-- Only instructors can insert
CREATE POLICY "Instructors can insert resources" ON public.resources
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'instructor'
);

-- Only instructors can update their own resources
CREATE POLICY "Instructors can update their resources" ON public.resources
FOR UPDATE USING (
  auth.uid() = created_by AND
  (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'instructor'
);

-- Only instructors can delete their own resources
CREATE POLICY "Instructors can delete their resources" ON public.resources
FOR DELETE USING (
  auth.uid() = created_by AND
  (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'instructor'
);

-- Create storage bucket for resource files
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
-- Public access to view resource files
CREATE POLICY "Anyone can view resource files" ON storage.objects
FOR SELECT USING (bucket_id = 'resources');

-- Only instructors can upload files
CREATE POLICY "Instructors can upload resource files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resources' AND
  auth.role() = 'authenticated' AND
  (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'instructor'
);

-- Only instructors can update their files
CREATE POLICY "Instructors can update their resource files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'resources' AND
  auth.role() = 'authenticated' AND
  (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'instructor'
);

-- Only instructors can delete their files
CREATE POLICY "Instructors can delete their resource files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resources' AND
  auth.role() = 'authenticated' AND
  (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'instructor'
);

-- Enable realtime for resources table
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;