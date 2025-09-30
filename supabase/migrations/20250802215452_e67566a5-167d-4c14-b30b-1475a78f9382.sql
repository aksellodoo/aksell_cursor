-- Add created_by column to profiles table to fix trigger_record_created error
ALTER TABLE public.profiles 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Set default value for existing records
UPDATE public.profiles 
SET created_by = id 
WHERE created_by IS NULL;