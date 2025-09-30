-- Fix Microsoft account linking for junior@aksell.com.br
-- Update the microsoft account to link to the correct user ID
UPDATE microsoft_accounts 
SET user_id = 'bc49489b-8d8d-4a1d-91c1-7ac9259b4aba',
    updated_at = now()
WHERE email = 'junior@aksell.com.br' 
  AND user_id = '3104bcf9-4f2e-4af7-9813-f4e037669403';