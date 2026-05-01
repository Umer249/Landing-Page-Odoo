create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  company text,
  industry text,
  project text,
  source text default 'Google Ads Landing Page',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_submitted_at on public.leads (submitted_at desc);
