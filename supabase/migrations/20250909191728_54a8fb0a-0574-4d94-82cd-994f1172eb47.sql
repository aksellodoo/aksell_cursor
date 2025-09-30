-- Enable realtime for documents table
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;