-- Tornar device_fingerprint nullable para permitir valores mascarados
ALTER TABLE public.trusted_devices 
ALTER COLUMN device_fingerprint DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.trusted_devices.device_fingerprint IS 'Valor mascarado para exibição, não usado para identificação';
COMMENT ON COLUMN public.trusted_devices.device_fp_hash IS 'Hash do fingerprint usado como chave de identificação única';