-- Add icon column to departments table
ALTER TABLE public.departments
ADD COLUMN icon TEXT NOT NULL DEFAULT 'Building2';

-- Add comment for documentation
COMMENT ON COLUMN public.departments.icon IS 'Lucide React icon name for the department (e.g., Users, Calculator, Briefcase)';
