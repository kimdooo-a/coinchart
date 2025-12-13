-- Add language column to news table
alter table news 
add column if not exists language varchar(2) default 'ko';

-- Create index for faster filtering by language
create index if not exists idx_news_language on news(language);
