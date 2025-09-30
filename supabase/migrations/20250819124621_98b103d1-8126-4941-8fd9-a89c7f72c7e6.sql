-- Add name column to protheus_table_relationships table
ALTER TABLE public.protheus_table_relationships 
ADD COLUMN name TEXT;

-- Create function to generate relationship name from table names
CREATE OR REPLACE FUNCTION generate_relationship_name(source_table_name TEXT, target_table_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN UPPER(source_table_name || '_' || target_table_name);
END;
$$;

-- Update existing relationships with generated names
UPDATE public.protheus_table_relationships 
SET name = (
  SELECT generate_relationship_name(pt1.table_name, pt2.table_name)
  FROM protheus_tables pt1, protheus_tables pt2
  WHERE pt1.id = source_table_id AND pt2.id = target_table_id
)
WHERE name IS NULL;