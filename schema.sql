-- LIFT App v2 Schema
-- Run this in Supabase SQL Editor

drop table if exists logs;
drop table if exists sessions;
drop table if exists bodyweight;

create table sessions (
  id bigint generated always as identity primary key,
  date timestamp default now(),
  day_type text,
  equipment text[],
  fatigue_level int,
  notes text,
  phase text,
  block_key text,
  block_number int,
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
  phase text,
  block_key text
);

create table bodyweight (
  id bigint generated always as identity primary key,
  date timestamp default now(),
  weight numeric
);
