
-- Add the missing columns to the sales_leads table
ALTER TABLE public.sales_leads 
ADD COLUMN attendance_type text CHECK (attendance_type IN ('direct', 'representative')) DEFAULT 'direct',
ADD COLUMN representative_id uuid REFERENCES public.commercial_representatives(id);

-- Add a comment to document the columns
COMMENT ON COLUMN public.sales_leads.attendance_type IS 'Type of attendance: direct or representative';
COMMENT ON COLUMN public.sales_leads.representative_id IS 'Reference to commercial representative when attendance_type is representative';
