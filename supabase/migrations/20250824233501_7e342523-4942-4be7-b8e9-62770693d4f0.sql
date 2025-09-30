
-- 1) Extensão pgvector
create extension if not exists vector;

-- 2) Enum de status de documentos
do $$
begin
  create type document_status as enum ('processing','active','error');
exception when duplicate_object then null;
end$$;

-- 3) Colunas necessárias em public.documents
alter table public.documents
  add column if not exists storage_key text,
  add column if not exists mime_type text,
  add column if not exists status document_status not null default 'active',
  add column if not exists acl_hash text;

-- 4) ACL simples por departamento (v1)
create or replace function public.compute_acl_hash(p_department_id uuid, p_folder_id uuid default null)
returns text
language sql
stable
as $$
  select md5(coalesce(p_department_id::text,''))
$$;

create or replace function public.set_documents_acl_hash()
returns trigger
language plpgsql
as $$
begin
  new.acl_hash := public.compute_acl_hash(new.department_id, new.folder_id);
  return new;
end;
$$;

drop trigger if exists trg_documents_set_acl on public.documents;
create trigger trg_documents_set_acl
before insert or update of department_id, folder_id
on public.documents
for each row execute function public.set_documents_acl_hash();

-- 5) Tabela de chunks com embeddings
create table if not exists public.doc_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  lang text,
  tokens int,
  section text,
  embedding vector(3072) not null,
  acl_hash text not null,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_doc_chunks_document on public.doc_chunks(document_id);
create index if not exists idx_doc_chunks_acl_hash on public.doc_chunks(acl_hash);
create index if not exists idx_doc_chunks_embedding on public.doc_chunks using ivfflat (embedding vector_l2_ops) with (lists = 100);

-- 6) RLS em doc_chunks apenas para service_role
alter table public.doc_chunks enable row level security;

drop policy if exists "doc_chunks service read" on public.doc_chunks;
drop policy if exists "doc_chunks service insert" on public.doc_chunks;
drop policy if exists "doc_chunks service update" on public.doc_chunks;
drop policy if exists "doc_chunks service delete" on public.doc_chunks;

create policy "doc_chunks service read"
on public.doc_chunks
for select
to service_role
using (true);

create policy "doc_chunks service insert"
on public.doc_chunks
for insert
to service_role
with check (true);

create policy "doc_chunks service update"
on public.doc_chunks
for update
to service_role
using (true)
with check (true);

create policy "doc_chunks service delete"
on public.doc_chunks
for delete
to service_role
using (true);

-- 7) Permitir upload de documentos por membros do departamento (pasta ativa)
create policy if not exists "Dept members can insert documents"
on public.documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin','director','hr') or p.department_id = documents.department_id)
  )
  and exists (
    select 1
    from public.folders f
    where f.id = documents.folder_id
      and f.status = 'active'
  )
);

-- Permitir que service_role atualize documentos (status, storage_key, mime_type, acl_hash)
create policy if not exists "Service can update documents"
on public.documents
for update
to service_role
using (true)
with check (true);

-- 8) Bucket privado para arquivos de documentos
insert into storage.buckets (id, name, public)
values ('docs-prod','docs-prod', false)
on conflict (id) do nothing;

-- Políticas de Storage: upload autenticado e gerenciamento pelo service_role
create policy if not exists "Authenticated can upload to docs-prod"
on storage.objects for insert to authenticated
with check (bucket_id = 'docs-prod');

create policy if not exists "Service can manage docs-prod"
on storage.objects for all to service_role
using (bucket_id = 'docs-prod')
with check (bucket_id = 'docs-prod');
