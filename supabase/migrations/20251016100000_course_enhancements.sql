-- Add XP reward to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 10;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_progress table for tracking student task completion
CREATE TABLE IF NOT EXISTS task_progress (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (task_id, student_id)
);

-- Add duration to modules table (in minutes)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- Enable RLS on new tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Instructors can manage tasks" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'instructor'
    )
  );

CREATE POLICY "Students can view tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'student'
    )
  );

-- RLS Policies for task_progress
CREATE POLICY "Students can manage their task progress" ON task_progress
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view all task progress" ON task_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'instructor'
    )
  );