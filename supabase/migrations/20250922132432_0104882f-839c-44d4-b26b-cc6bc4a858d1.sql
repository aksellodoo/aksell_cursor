-- Add foreign key constraints that were missing
ALTER TABLE public.document_access_logs 
ADD CONSTRAINT fk_document_access_logs_document_id 
FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE public.document_access_logs 
ADD CONSTRAINT fk_document_access_logs_folder_id 
FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;

ALTER TABLE public.user_favorites 
ADD CONSTRAINT fk_user_favorites_document_id 
FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE public.user_favorites 
ADD CONSTRAINT fk_user_favorites_folder_id 
FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;