
-- Adiciona a coluna contact_type, se ainda não existir
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS contact_type text;

-- Documenta os valores esperados (slugs)
COMMENT ON COLUMN public.contacts.contact_type IS
'Tipo de contato (slug). Valores esperados:
vendas:clientes,
vendas:representantes,
compras:fornecedores_prestadores,
compras:representantes_fornecedores,
compras:transportadoras,
institucional:amigos_familiares,
institucional:funcionarios_publicos_policia_controle,
institucional:associacoes_sindicatos,
institucional:parceiros_externos';
