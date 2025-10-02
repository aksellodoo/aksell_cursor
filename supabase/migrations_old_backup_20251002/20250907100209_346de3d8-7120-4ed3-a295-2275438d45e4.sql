-- Create sequence for pf_number
CREATE SEQUENCE IF NOT EXISTS purchases_potential_suppliers_pf_number_seq;

-- Add pf_number column with default from sequence
ALTER TABLE public.purchases_potential_suppliers 
ADD COLUMN pf_number integer DEFAULT nextval('purchases_potential_suppliers_pf_number_seq') NOT NULL;

-- Backfill existing records with sequential numbers (this will use the sequence)
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.purchases_potential_suppliers
)
UPDATE public.purchases_potential_suppliers 
SET pf_number = numbered_rows.row_num
FROM numbered_rows 
WHERE purchases_potential_suppliers.id = numbered_rows.id;

-- Add pf_code as a generated stored column
ALTER TABLE public.purchases_potential_suppliers 
ADD COLUMN pf_code text GENERATED ALWAYS AS ('PF-' || pf_number::text) STORED;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_potential_suppliers_pf_number 
ON public.purchases_potential_suppliers(pf_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_potential_suppliers_pf_code 
ON public.purchases_potential_suppliers(pf_code);