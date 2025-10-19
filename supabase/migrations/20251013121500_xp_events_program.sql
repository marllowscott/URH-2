-- Add program to xp_events for program-specific leaderboard
alter table public.xp_events add column if not exists program text;
create index if not exists xp_events_program_idx on public.xp_events(program);

