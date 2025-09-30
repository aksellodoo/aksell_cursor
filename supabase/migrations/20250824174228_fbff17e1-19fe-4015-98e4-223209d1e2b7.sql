-- Step 1: Make nullable columns that need to be nullable
ALTER TABLE public.chatter_files ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.workflows ALTER COLUMN created_by DROP NOT NULL;