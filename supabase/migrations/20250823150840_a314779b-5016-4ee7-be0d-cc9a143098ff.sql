-- Adicionar campo para telemetria de schedule executado nos logs de sync
ALTER TABLE public.protheus_sync_logs ADD COLUMN IF NOT EXISTS executed_for_schedule TEXT;