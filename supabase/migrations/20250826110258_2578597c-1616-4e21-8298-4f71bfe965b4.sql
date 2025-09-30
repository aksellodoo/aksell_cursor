
-- Enforce composite uniqueness: same name (via name_id) + same compound_type cannot be duplicated.
-- Isso permite múltiplos produtos com o mesmo name, desde que o compound_type seja diferente.

-- Observação: este índice considera compound_type com comparação padrão (case-sensitive).
-- Se você desejar case-insensitive (ex.: 'Anidro' == 'anidro'), podemos trocar por um índice em expressão:
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_site_products_nameid_compound_ci
--   ON public.site_products (name_id, lower(compound_type));

CREATE UNIQUE INDEX IF NOT EXISTS uq_site_products_nameid_compound_type
  ON public.site_products (name_id, compound_type);
