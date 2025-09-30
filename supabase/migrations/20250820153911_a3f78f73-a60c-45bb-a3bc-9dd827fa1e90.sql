-- Update the record_status column in the protheus table to reflect correct status
-- First, let's update all records with pending_deletion = true to have record_status = 'deleted'
UPDATE protheus_sa1010_80f17f00 
SET record_status = 'deleted'::protheus_record_status
WHERE pending_deletion = true;