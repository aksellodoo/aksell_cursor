-- First, let's add more columns that commonly exist in SA1010 table
-- We'll make them all nullable since we don't know the exact structure

-- Add more address and contact fields
ALTER TABLE public.protheus_sa1010 
ADD COLUMN IF NOT EXISTS a1_complem text,
ADD COLUMN IF NOT EXISTS a1_pessoa text,
ADD COLUMN IF NOT EXISTS a1_dtnasc date,
ADD COLUMN IF NOT EXISTS a1_rg text,
ADD COLUMN IF NOT EXISTS a1_pfisica text,
ADD COLUMN IF NOT EXISTS a1_pjurid text,
ADD COLUMN IF NOT EXISTS a1_cnae text,
ADD COLUMN IF NOT EXISTS a1_naturez text,
ADD COLUMN IF NOT EXISTS a1_conta text,
ADD COLUMN IF NOT EXISTS a1_banco text,
ADD COLUMN IF NOT EXISTS a1_agencia text,
ADD COLUMN IF NOT EXISTS a1_numcon text,
ADD COLUMN IF NOT EXISTS a1_dvcta text,
ADD COLUMN IF NOT EXISTS a1_fax text,
ADD COLUMN IF NOT EXISTS a1_telex text,
ADD COLUMN IF NOT EXISTS a1_endent text,
ADD COLUMN IF NOT EXISTS a1_bairroe text,
ADD COLUMN IF NOT EXISTS a1_cepe text,
ADD COLUMN IF NOT EXISTS a1_mune text,
ADD COLUMN IF NOT EXISTS a1_este text,
ADD COLUMN IF NOT EXISTS a1_endcob text,
ADD COLUMN IF NOT EXISTS a1_bairroc text,
ADD COLUMN IF NOT EXISTS a1_cepc text,
ADD COLUMN IF NOT EXISTS a1_munc text,
ADD COLUMN IF NOT EXISTS a1_estc text,
ADD COLUMN IF NOT EXISTS a1_dtcad date,
ADD COLUMN IF NOT EXISTS a1_hpage text,
ADD COLUMN IF NOT EXISTS a1_status text,
ADD COLUMN IF NOT EXISTS a1_simpnac text,
ADD COLUMN IF NOT EXISTS a1_suframa text,
ADD COLUMN IF NOT EXISTS a1_vend text,
ADD COLUMN IF NOT EXISTS a1_comis numeric,
ADD COLUMN IF NOT EXISTS a1_regiao text,
ADD COLUMN IF NOT EXISTS a1_classe text,
ADD COLUMN IF NOT EXISTS a1_codpais text,
ADD COLUMN IF NOT EXISTS a1_pais text,
ADD COLUMN IF NOT EXISTS a1_cep text,
ADD COLUMN IF NOT EXISTS a1_saldup numeric,
ADD COLUMN IF NOT EXISTS a1_saldupm numeric,
ADD COLUMN IF NOT EXISTS a1_salped numeric,
ADD COLUMN IF NOT EXISTS a1_pricom date,
ADD COLUMN IF NOT EXISTS a1_ultcom date,
ADD COLUMN IF NOT EXISTS a1_nrocom numeric,
ADD COLUMN IF NOT EXISTS a1_matr text,
ADD COLUMN IF NOT EXISTS a1_metr numeric,
ADD COLUMN IF NOT EXISTS a1_transp text,
ADD COLUMN IF NOT EXISTS a1_cond text,
ADD COLUMN IF NOT EXISTS a1_desc numeric,
ADD COLUMN IF NOT EXISTS a1_tpfret text,
ADD COLUMN IF NOT EXISTS a1_risco text,
ADD COLUMN IF NOT EXISTS a1_lc numeric,
ADD COLUMN IF NOT EXISTS a1_vcto date,
ADD COLUMN IF NOT EXISTS a1_vlcred numeric,
ADD COLUMN IF NOT EXISTS a1_obs text,
ADD COLUMN IF NOT EXISTS a1_tabela text,
ADD COLUMN IF NOT EXISTS a1_recinss text,
ADD COLUMN IF NOT EXISTS a1_reccofi text,
ADD COLUMN IF NOT EXISTS a1_reccsll text,
ADD COLUMN IF NOT EXISTS a1_recpis text,
ADD COLUMN IF NOT EXISTS a1_contrib text,
ADD COLUMN IF NOT EXISTS a1_recirrf text,
ADD COLUMN IF NOT EXISTS a1_userlgi text,
ADD COLUMN IF NOT EXISTS a1_userlga text;

-- Add a generic jsonb column to store any additional fields we might not have anticipated
ALTER TABLE public.protheus_sa1010 
ADD COLUMN IF NOT EXISTS raw_data jsonb DEFAULT '{}';

-- Create an index on the raw_data column for better performance
CREATE INDEX IF NOT EXISTS idx_protheus_sa1010_raw_data_gin ON public.protheus_sa1010 USING GIN(raw_data);

-- Update the unique constraint to handle the case where we might have better data
-- First drop the existing constraint if it exists
ALTER TABLE public.protheus_sa1010 DROP CONSTRAINT IF EXISTS protheus_sa1010_a1_cod_a1_loja_key;

-- Create a new unique constraint that ignores deleted records
CREATE UNIQUE INDEX IF NOT EXISTS idx_protheus_sa1010_unique_active 
ON public.protheus_sa1010 (a1_cod, a1_loja) 
WHERE (d_e_l_e_t_ IS NULL OR d_e_l_e_t_ != '*');