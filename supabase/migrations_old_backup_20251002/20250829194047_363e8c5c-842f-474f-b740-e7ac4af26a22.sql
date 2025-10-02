-- Add website field to sales_leads table
ALTER TABLE public.sales_leads 
ADD COLUMN website TEXT;