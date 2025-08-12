-- Create a predefined set of currencies
CREATE TYPE public.currency_code AS ENUM ('AUD', 'NZD', 'USD', 'EUR', 'GBP', 'CAD', 'JPY');

-- Create extension for UUID generation and cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table with enhanced settings and type safety
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT 'https://via.placeholder.com/150',  -- Added default avatar
  settings JSONB NOT NULL DEFAULT jsonb_build_object(
    'defaultCurrency', 'AUD'::text,
    'enabledCurrencies', jsonb_build_array('AUD', 'NZD')
  ),
  deleted_at TIMESTAMPTZ,  -- Soft delete column
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Added constraint to validate default currency
  CONSTRAINT valid_default_currency 
    CHECK ((settings->>'defaultCurrency')::public.currency_code IS NOT NULL)
);

-- Enhanced user creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  BEGIN
    -- More robust full name generation with guaranteed non-null value
    INSERT INTO public.profiles (
      id, 
      full_name, 
      avatar_url
    )
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        'Anonymous User'
      ),
      NULLIF(NEW.raw_user_meta_data->>'avatar_url', 'https://via.placeholder.com/150')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log the error (you'd need to set up proper error logging)
      RAISE NOTICE 'Error inserting profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END$$;

-- Audit log table for tracking user actions
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate the trigger to ensure it's attached correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Expenses table creation
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency public.currency_code NOT NULL DEFAULT 'AUD',
  description TEXT,
  vendor TEXT,
  category TEXT,
  export_id UUID,  -- Reference to export if needed
  receipt_url TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses"
ON public.expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
ON public.expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
ON public.expenses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
ON public.expenses FOR DELETE
USING (auth.uid() = user_id);

-- Additional index for expenses export references
CREATE INDEX IF NOT EXISTS expenses_export_id_idx ON public.expenses(export_id);

-- Modify the storage policies to fix type casting issue
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'storage' 
      AND table_name = 'objects'
  ) THEN
    -- Receipts bucket policies with explicit type casting
    DROP POLICY IF EXISTS "Receipts owner read" ON storage.objects;
    DROP POLICY IF EXISTS "Receipts owner write" ON storage.objects;
    DROP POLICY IF EXISTS "Receipts owner update/delete" ON storage.objects;

    CREATE POLICY "Receipts owner read"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'receipts' 
        AND owner_id = auth.uid()::text
      );

    CREATE POLICY "Receipts owner write"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'receipts' 
        AND owner_id = auth.uid()::text
      );

    CREATE POLICY "Receipts owner update/delete"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'receipts' 
        AND owner_id = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'receipts' 
        AND owner_id = auth.uid()::text
      );

    -- Similar modifications for exports bucket
    DROP POLICY IF EXISTS "Exports owner read" ON storage.objects;
    DROP POLICY IF EXISTS "Exports owner write" ON storage.objects;
    DROP POLICY IF EXISTS "Exports owner update/delete" ON storage.objects;

    CREATE POLICY "Exports owner read"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'exports' 
        AND owner_id = auth.uid()::text
      );

    CREATE POLICY "Exports owner write"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'exports' 
        AND owner_id = auth.uid()::text
      );

    CREATE POLICY "Exports owner update/delete"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'exports' 
        AND owner_id = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'exports' 
        AND owner_id = auth.uid()::text
      );
  END IF;
END$$;