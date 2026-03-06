-- =====================================================
-- MindTrack: Counsellor Portal Tables
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Counsellors table
CREATE TABLE IF NOT EXISTS counsellors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT 'S.A. Engineering College',
  department TEXT NOT NULL DEFAULT 'Student Wellness',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Session tokens (separate from Supabase auth)
CREATE TABLE IF NOT EXISTS counsellor_sessions (
  token TEXT PRIMARY KEY,
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Counsellor-to-patient assignments
CREATE TABLE IF NOT EXISTS counsellor_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  counsellor_id UUID NOT NULL REFERENCES counsellors(id) ON DELETE CASCADE,
  patient_user_id UUID NOT NULL,
  nickname TEXT NOT NULL DEFAULT 'Patient',
  notes TEXT DEFAULT '',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(counsellor_id, patient_user_id)
);

-- Enable RLS (service role key bypasses it in API routes)
ALTER TABLE counsellors ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsellor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsellor_patients ENABLE ROW LEVEL SECURITY;

-- Service role policies (allow all via service role)
CREATE POLICY "Service role full access" ON counsellors FOR ALL USING (true);
CREATE POLICY "Service role full access" ON counsellor_sessions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON counsellor_patients FOR ALL USING (true);
