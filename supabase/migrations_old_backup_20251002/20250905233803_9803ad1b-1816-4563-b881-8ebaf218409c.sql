-- Add attendance_type and representative_id columns to purchases_potential_suppliers
ALTER TABLE public.purchases_potential_suppliers 
ADD COLUMN attendance_type TEXT NOT NULL DEFAULT 'direct' CHECK (attendance_type IN ('direct', 'representative')),
ADD COLUMN representative_id UUID REFERENCES public.commercial_representatives(id);

-- Add index for performance
CREATE INDEX idx_potential_suppliers_representative_id ON public.purchases_potential_suppliers(representative_id) WHERE representative_id IS NOT NULL;