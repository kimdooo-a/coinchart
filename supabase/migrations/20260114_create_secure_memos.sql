-- Create secure_memos table for encrypted memo storage
-- Password is NEVER stored - only salt, IV, and encrypted content

CREATE TABLE IF NOT EXISTS secure_memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    encrypted_content TEXT NOT NULL,  -- Base64 encoded AES-256-GCM ciphertext
    salt TEXT NOT NULL,               -- Base64 encoded PBKDF2 salt (16 bytes)
    iv TEXT NOT NULL,                 -- Base64 encoded AES-GCM IV (12 bytes)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_secure_memos_user_id ON secure_memos(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_memos_updated_at ON secure_memos(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE secure_memos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own memos
CREATE POLICY "Users can view own memos" ON secure_memos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memos" ON secure_memos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos" ON secure_memos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos" ON secure_memos
    FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_secure_memos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_secure_memos_updated_at
    BEFORE UPDATE ON secure_memos
    FOR EACH ROW
    EXECUTE FUNCTION update_secure_memos_updated_at();
