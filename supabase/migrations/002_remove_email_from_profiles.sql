-- CollabOS: Security Hardening — Remove email from public profiles table
-- The email column is a PII leak because profiles has a public SELECT policy.
-- Email is safely managed in Supabase's protected auth.users table.
-- Run this in the Supabase SQL Editor.

-- Step 1: Update the trigger that auto-creates profiles on signup
-- to stop copying email into the profiles table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, mononym, dna_type, custom_dna_label, custom_dna_tags)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'mononym', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'dna_type', 'Builder'),
    NEW.raw_user_meta_data->>'custom_dna_label',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'custom_dna_tags', '[]'::jsonb)))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop the email column from the profiles table.
-- This permanently removes all stored email addresses from the public table.
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
