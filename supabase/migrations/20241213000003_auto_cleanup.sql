-- 1. Enable the pg_cron extension (if not already enabled)
-- Note: You might need to enable this in the Supabase Dashboard -> Database -> Extensions
create extension if not exists pg_cron;

-- 2. Create the cleanup function
create or replace function delete_old_market_prices()
returns void as $$
begin
  -- Delete rows where the date is older than 1 year from today
  delete from market_prices 
  where date < (current_date - interval '3 years');
end;
$$ language plpgsql;

-- 3. Schedule the cron job to run daily at 03:00 AM (UTC)
-- The job name is 'cleanup-old-prices'
select cron.schedule(
  'cleanup-old-prices', -- unique job name
  '0 3 * * *',          -- cron syntax: minute hour day month day_of_week
  $$ select delete_old_market_prices() $$
);
