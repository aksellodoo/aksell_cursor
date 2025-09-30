-- Create sequence for pf_number if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS purchases_potential_suppliers_pf_number_seq;

-- Backfill existing null pf_number values with sequence
UPDATE public.purchases_potential_suppliers 
SET pf_number = nextval('purchases_potential_suppliers_pf_number_seq')
WHERE pf_number IS NULL;

-- Set default for pf_number to use sequence
ALTER TABLE public.purchases_potential_suppliers 
ALTER COLUMN pf_number SET DEFAULT nextval('purchases_potential_suppliers_pf_number_seq');

-- Make pf_number NOT NULL since it should always have a value
ALTER TABLE public.purchases_potential_suppliers 
ALTER COLUMN pf_number SET NOT NULL;

-- Add pf_code as a generated stored column
ALTER TABLE public.purchases_potential_suppliers 
ADD COLUMN IF NOT EXISTS pf_code text GENERATED ALWAYS AS ('PF-' || pf_number::text) STORED;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_potential_suppliers_pf_number 
ON public.purchases_potential_suppliers(pf_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_potential_suppliers_pf_code 
ON public.purchases_potential_suppliers(pf_code);