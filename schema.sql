-- Drop and recreate with full schema for LIFT app
drop table if exists logs;
drop table if exists sessions;

create table sessions (
  id bigint generated always as identity primary key,
  date timestamp default now(),
  day_type text,
  equipment text[],
  fatigue_level int,
  notes text,
  phase text,
  block_key text,
  session_number int
);

create table logs (
  id bigint generated always as identity primary key,
  created_at timestamp default now(),
  session_id bigint references sessions(id),
  exercise_name text,
  exercise_id text,
  sets jsonb,
  target_reps text,
  target_rir int,
  felt text
);
