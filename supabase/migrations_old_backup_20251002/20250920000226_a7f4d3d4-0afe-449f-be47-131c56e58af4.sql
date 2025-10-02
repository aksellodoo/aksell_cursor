-- Criar cronjob para envio automático de notificações Protheus
select
  cron.schedule(
    'send-protheus-notifications',
    '* * * * *', -- a cada minuto
    $$
    select
      net.http_post(
          url:='https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/send-protheus-notifications',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg"}'::jsonb,
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );