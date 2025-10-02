-- Remover a função antiga is_device_trusted que causava conflito
DROP FUNCTION IF EXISTS public.is_device_trusted(text);

-- Testar a verificação de dispositivo com alguns dados de exemplo
-- Verificar se a tabela trusted_devices tem dados
DO $$
DECLARE
    device_count integer;
    sample_device record;
BEGIN
    SELECT COUNT(*) INTO device_count FROM public.trusted_devices;
    RAISE NOTICE 'Total trusted devices: %', device_count;
    
    -- Buscar um dispositivo de exemplo
    SELECT * INTO sample_device FROM public.trusted_devices LIMIT 1;
    IF FOUND THEN
        RAISE NOTICE 'Sample device: user_id=%, fingerprint=%, is_active=%, expires_at=%', 
            sample_device.user_id, sample_device.device_fingerprint, sample_device.is_active, sample_device.expires_at;
            
        -- Testar a função
        RAISE NOTICE 'Testing is_device_trusted function result: %', 
            public.is_device_trusted(sample_device.user_id, sample_device.device_fingerprint);
    END IF;
END $$;