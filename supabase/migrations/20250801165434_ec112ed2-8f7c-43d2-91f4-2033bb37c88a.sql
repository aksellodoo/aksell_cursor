-- Update protheus_config table to support endpoint configurations
UPDATE public.protheus_config 
SET endpoints_documentation = jsonb_set(
  endpoints_documentation,
  '{endpoints}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN endpoint->>'path' = '/ping' THEN 
          endpoint || '{"enabled": true, "critical": true, "security_level": "low"}'::jsonb
        WHEN endpoint->>'path' = '/consulta' THEN
          endpoint || '{"enabled": true, "critical": false, "security_level": "medium"}'::jsonb
        WHEN endpoint->>'path' = '/sql' THEN
          endpoint || '{"enabled": false, "critical": false, "security_level": "high"}'::jsonb
        ELSE endpoint
      END
    )
    FROM jsonb_array_elements(endpoints_documentation->'endpoints') AS endpoint
  )
)
WHERE endpoints_documentation IS NOT NULL;