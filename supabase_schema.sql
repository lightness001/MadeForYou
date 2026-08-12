-- ============================================================================
-- MadeForYou Digital Surprise Platform - Supabase PostgreSQL Database Schema
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Surprises Master Table
CREATE TABLE IF NOT EXISTS surprises (
    id VARCHAR(36) PRIMARY KEY,
    short_code VARCHAR(12) UNIQUE NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    creator_name VARCHAR(100) DEFAULT 'Someone Special',
    relationship VARCHAR(50) DEFAULT 'My Love',
    occasion VARCHAR(50) DEFAULT 'Love',
    password_hash TEXT NOT NULL,
    password_raw TEXT DEFAULT '',
    message TEXT NOT NULL,
    font_family VARCHAR(50) DEFAULT 'Dancing Script',
    theme VARCHAR(50) DEFAULT 'love',
    music_track VARCHAR(50) DEFAULT 'piano',
    reaction_note TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NULL
);

-- 3. Memories Table (1 surprise to Many memory photos)
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surprise_id VARCHAR(36) REFERENCES surprises(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexing for Fast Querying
CREATE INDEX IF NOT EXISTS idx_surprises_short_code ON surprises(short_code);
CREATE INDEX IF NOT EXISTS idx_memories_surprise_id ON memories(surprise_id);

-- 5. Row Level Security (RLS) Policies for Public Link Access
ALTER TABLE surprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to surprises
CREATE POLICY "Allow public read access for surprises"
    ON surprises FOR SELECT
    USING (true);

-- Allow public creation of new surprises
CREATE POLICY "Allow public insert for surprises"
    ON surprises FOR INSERT
    WITH CHECK (true);

-- Allow public updates (e.g. saving recipient reaction notes)
CREATE POLICY "Allow public update for surprises"
    ON surprises FOR UPDATE
    USING (true);

-- Allow public read access for memories
CREATE POLICY "Allow public read access for memories"
    ON memories FOR SELECT
    USING (true);

-- Allow public insertion for memories
CREATE POLICY "Allow public insert for memories"
    ON memories FOR INSERT
    WITH CHECK (true);
