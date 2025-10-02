-- Update folder_descendant_counts view to count ALL documents regardless of status
DROP VIEW IF EXISTS folder_descendant_counts;

CREATE VIEW folder_descendant_counts AS
SELECT 
  f.id,
  COUNT(d.id) as doc_count
FROM folders f
LEFT JOIN documents d ON d.folder_id = f.id
-- Remove status filter to count ALL documents
GROUP BY f.id;