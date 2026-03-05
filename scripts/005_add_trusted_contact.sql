-- Add trusted contact fields to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trusted_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS trusted_contact_name TEXT;
