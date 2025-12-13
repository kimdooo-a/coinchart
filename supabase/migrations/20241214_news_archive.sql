-- Create News Table for Archiving (15 Days)
create table if not exists news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  link text not null unique,
  pub_date timestamp with time zone not null,
  source text,
  sentiment text check (sentiment in ('positive', 'negative', 'neutral', 'mixed')),
  snippet text,
  symbol text default 'ALL', -- related coin symbol or 'ALL'
  created_at timestamp with time zone default now()
);

-- Index for faster querying and cleanup
create index if not exists idx_news_pub_date on news(pub_date);
create index if not exists idx_news_symbol on news(symbol);

-- Enable RLS
alter table news enable row level security;

-- Policy: Everyone can read news
create policy "Public can read news" on news
  for select using (true);

-- Policy: Only service_role can insert/delete (for Cron/API)
-- Note: In Supabase, service_role bypasses RLS, but explicit policy helps clarity if using authenticated users later.
-- We usually don't need Insert policy for service_role as it bypasses RLS.
