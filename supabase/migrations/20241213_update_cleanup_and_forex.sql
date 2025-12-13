-- 1. Update the Constraint to allow 'FOREX' type
-- We need to drop the old check and add a new one
alter table market_prices drop constraint if exists market_prices_type_check;
alter table market_prices add constraint market_prices_type_check check (type in ('CRYPTO', 'STOCK', 'FOREX'));

-- 2. Update the Cleanup Function to 3 Years
create or replace function delete_old_market_prices()
returns void as $$
begin
  -- Delete rows where the date is older than 3 years from today
  delete from market_prices 
  where date < (current_date - interval '3 years');
end;
$$ language plpgsql;

-- No need to reschedule the cron job if the function name is the same, 
-- but we can re-verify the selection if needed. 
-- The cron job calls 'select delete_old_market_prices()', which will now use the new code.
