-- Migration: test_workflow
-- Created: 2024-10-02 17:43:20
-- Description: Test migration to validate the new Supabase workflow
-- This is a simple test that adds a comment to an existing table

-- Test: Add a comment to the tasks table to validate workflow
COMMENT ON TABLE public.tasks IS 'Tabela de tarefas do sistema - Workflow validado em 02/10/2024';

