-- Adicionar campos para notificação Telegram na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN notification_telegram boolean NOT NULL DEFAULT false,
ADD COLUMN telegram_chat_id text,
ADD COLUMN telegram_username text,
ADD COLUMN telegram_setup_code text,
ADD COLUMN telegram_setup_code_expires_at timestamp with time zone;

-- Atualizar a estrutura notification_types para incluir telegram
-- Primeiro, vamos atualizar os registros existentes para incluir telegram: false por padrão
UPDATE public.profiles 
SET notification_types = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        notification_types,
        '{tasks,telegram}', 'false'::jsonb, true
      ),
      '{approvals,telegram}', 'false'::jsonb, true
    ),
    '{corrections,telegram}', 'false'::jsonb, true
  ),
  '{access_requests,telegram}', 'false'::jsonb, true
)
WHERE notification_types IS NOT NULL;

-- Para perfis que ainda não têm notification_types estruturado, vamos criar a estrutura completa
UPDATE public.profiles 
SET notification_types = '{
  "tasks": {"app": true, "email": false, "telegram": false},
  "approvals": {"app": true, "email": true, "telegram": false}, 
  "corrections": {"app": true, "email": false, "telegram": false},
  "access_requests": {"app": false, "email": true, "telegram": false},
  "chatter": true,
  "mentions": true,
  "changes": true,
  "assignments": true
}'::jsonb
WHERE notification_types IS NULL OR 
      (notification_types->>'chatter' IS NOT NULL AND 
       notification_types->'tasks' IS NULL);

-- Função para gerar código de setup do Telegram
CREATE OR REPLACE FUNCTION generate_telegram_setup_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  code TEXT;
BEGIN
  -- Gerar código de 6 dígitos
  code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN code;
END;
$$;

-- Função para limpar códigos expirados do Telegram
CREATE OR REPLACE FUNCTION cleanup_expired_telegram_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.profiles 
  SET telegram_setup_code = NULL,
      telegram_setup_code_expires_at = NULL
  WHERE telegram_setup_code_expires_at < NOW();
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;