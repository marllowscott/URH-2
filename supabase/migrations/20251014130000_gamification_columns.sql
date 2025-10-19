-- Add required columns for enhanced gamification flows

-- Courses: duration and expiry
alter table public.courses add column if not exists duration text;
alter table public.courses add column if not exists expiry_date timestamptz;

-- Modules: resource linkage and time limits
alter table public.modules add column if not exists resource_url text;
alter table public.modules add column if not exists file_path text;
alter table public.modules add column if not exists time_limit_minutes integer;
alter table public.modules add column if not exists expiry_date timestamptz;

-- Tasks: xp reward and attachments
alter table public.tasks add column if not exists xp_reward integer not null default 0;
alter table public.tasks add column if not exists attachment_url text;
alter table public.tasks add column if not exists attachment_path text;


