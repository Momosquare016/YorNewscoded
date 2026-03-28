-- Add newsletter columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_frequency VARCHAR(10) DEFAULT 'daily'; -- 'daily' or 'weekly'
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_day INTEGER DEFAULT 1; -- 0=Sunday, 1=Monday, ..., 6=Saturday (used for weekly)
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_time VARCHAR(5) DEFAULT '08:00'; -- HH:MM in 24h format (UTC)
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_unsubscribe_token UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_last_sent_at TIMESTAMP;
