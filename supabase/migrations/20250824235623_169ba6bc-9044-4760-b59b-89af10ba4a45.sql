-- Add missing columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('processing', 'active', 'error', 'archived', 'hidden')),
ADD COLUMN IF NOT EXISTS mime_type text,
ADD COLUMN IF NOT EXISTS storage_key text,
ADD COLUMN IF NOT EXISTS acl_hash text;

-- Add order_index to folders for drag and drop
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Create folder_descendant_counts view
CREATE OR REPLACE VIEW public.folder_descendant_counts AS
WITH RECURSIVE folder_tree AS (
  -- Base case: all folders
  SELECT id, parent_folder_id, department_id, 0 as level
  FROM folders
  WHERE status IN ('active', 'archived')
  
  UNION ALL
  
  -- Recursive case: get descendants
  SELECT f.id, f.parent_folder_id, f.department_id, ft.level + 1
  FROM folders f
  JOIN folder_tree ft ON f.parent_folder_id = ft.id
  WHERE f.status IN ('active', 'archived')
),
doc_counts AS (
  SELECT 
    f.id as folder_id,
    COUNT(d.id) as doc_count
  FROM folders f
  LEFT JOIN documents d ON d.folder_id = f.id
  WHERE f.status IN ('active', 'archived')
  GROUP BY f.id
)
SELECT 
  folder_id,
  COALESCE(doc_count, 0) as doc_count
FROM doc_counts;

-- Update existing documents to have default status
UPDATE public.documents SET status = 'active' WHERE status IS NULL;