-- Programs, Courses, Modules, Lessons, Tasks, Submissions, Progress, XP/Streaks, Notifications (MVP)

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  program text not null check (program in ('Software Development','Digital Marketing','Product Design')),
  title text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  video_url text,
  notes text,
  quiz jsonb, -- { questions: [...] } for MVP
  weight_video numeric not null default 0.34,
  weight_notes numeric not null default 0.33,
  weight_quiz numeric not null default 0.33,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  program text not null check (program in ('Software Development','Digital Marketing','Product Design')),
  title text not null,
  description text,
  schedule text not null check (schedule in ('daily','weekly','monthly','ad-hoc')),
  due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Student assignments/submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  student_id uuid not null references auth.users(id) on delete cascade,
  content_url text, -- uploaded file link or content reference
  answers jsonb, -- quiz answers payload
  score numeric,
  status text not null default 'submitted' check (status in ('submitted','graded','approved','rejected')),
  created_at timestamptz not null default now(),
  graded_at timestamptz
);

-- Lesson stage progress (video/notes/quiz)
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  completed_video boolean not null default false,
  completed_notes boolean not null default false,
  completed_quiz boolean not null default false,
  progress_percent numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

-- Aggregated course progress (cached for quick UI)
create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  progress_percent numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (course_id, student_id)
);

-- Gamification: XP events and streaks
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  xp integer not null,
  reason text not null,
  program text check (program in ('Software Development','Digital Marketing','Product Design')),
  created_at timestamptz not null default now()
);

create table if not exists public.streaks (
  student_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date
);

-- Notifications (for instructors to notify students)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  program text check (program in ('Software Development','Digital Marketing','Product Design')),
  student_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helper views/materialized views could be added later for leaderboard. For MVP, compute from xp_events.

-- Basic RLS (keep permissive for MVP; tighten later)
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.course_progress enable row level security;
alter table public.xp_events enable row level security;
alter table public.streaks enable row level security;
alter table public.notifications enable row level security;

-- Policies (MVP): allow authenticated read; instructors (role metadata) can write; students write their own submissions/progress
create policy if not exists auth_read_courses on public.courses for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_modules on public.modules for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_lessons on public.lessons for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_tasks on public.tasks for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_submissions on public.submissions for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_lesson_progress on public.lesson_progress for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_course_progress on public.course_progress for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_xp_events on public.xp_events for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_streaks on public.streaks for select using (auth.role() = 'authenticated');
create policy if not exists auth_read_notifications on public.notifications for select using (auth.role() = 'authenticated');

-- Instructor writes (assumes JWT has user_metadata.role = 'instructor')
create policy if not exists instructor_write_courses on public.courses for insert with check (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_update_courses on public.courses for update using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_delete_courses on public.courses for delete using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');

create policy if not exists instructor_write_modules on public.modules for insert with check (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_update_modules on public.modules for update using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_delete_modules on public.modules for delete using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');

create policy if not exists instructor_write_lessons on public.lessons for insert with check (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_update_lessons on public.lessons for update using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_delete_lessons on public.lessons for delete using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');

create policy if not exists instructor_write_tasks on public.tasks for insert with check (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_update_tasks on public.tasks for update using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists instructor_delete_tasks on public.tasks for delete using (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');

-- Student writes
create policy if not exists student_insert_submission on public.submissions for insert with check (auth.uid() = student_id);
create policy if not exists student_update_submission on public.submissions for update using (auth.uid() = student_id);

create policy if not exists student_upsert_lesson_progress on public.lesson_progress for insert with check (auth.uid() = student_id);
create policy if not exists student_update_lesson_progress on public.lesson_progress for update using (auth.uid() = student_id);

create policy if not exists student_upsert_course_progress on public.course_progress for insert with check (auth.uid() = student_id);
create policy if not exists student_update_course_progress on public.course_progress for update using (auth.uid() = student_id);

create policy if not exists student_insert_xp on public.xp_events for insert with check (auth.uid() = student_id);
create policy if not exists student_update_streaks on public.streaks for insert with check (auth.uid() = student_id);
create policy if not exists student_update_streaks_update on public.streaks for update using (auth.uid() = student_id);

-- Notifications writes by instructor; students can mark as read for their own
create policy if not exists instructor_insert_notifications on public.notifications for insert with check (coalesce((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'instructor');
create policy if not exists student_update_notifications on public.notifications for update using (auth.uid() = student_id);
