-- Migration: rename_file_url_to_file_path_in_task_attachments
-- Created: 2025-10-03 12:15:12
-- Description: Rename file_url column to file_path in task_attachments table
-- The codebase uses 'file_path' but the database column is named 'file_url'
-- This migration renames the column to match the code's expectations

ALTER TABLE public.task_attachments
RENAME COLUMN file_url TO file_path;
