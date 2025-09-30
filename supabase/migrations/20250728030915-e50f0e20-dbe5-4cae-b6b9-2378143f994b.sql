-- Add company_relationship field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN company_relationship TEXT;

-- Add comment to explain the field usage
COMMENT ON COLUMN public.profiles.company_relationship IS 'Relationship with company when user is not an employee (e.g., client, partner, consultant, etc.)';