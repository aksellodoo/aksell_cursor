-- garantir coluna due_date
alter table public.tasks add column if not exists due_date timestamptz;

create or replace function public.tg_mirror_expected_to_due_date()
returns trigger language plpgsql as $$
begin
  if new.expected_completion_at is distinct from old.expected_completion_at then
    new.due_date := new.expected_completion_at;
  end if;
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_tasks_mirror_due_date') then
    create trigger trg_tasks_mirror_due_date
    before update or insert on public.tasks
    for each row execute function public.tg_mirror_expected_to_due_date();
  end if;
end$$;

-- Índices parciais para "Somente pendentes"
create index if not exists idx_tasks_pending_expected
  on public.tasks (expected_completion_at)
  where list_in_pending = true;

create index if not exists idx_tasks_pending_deadline
  on public.tasks (deadline_at)
  where list_in_pending = true;

-- FK do template mais resiliente
alter table public.tasks
  drop constraint if exists tasks_template_id_fkey;

alter table public.tasks
  add constraint tasks_template_id_fkey
  foreign key (template_id) references public.task_templates(id) on delete set null;

-- Snapshot do template para auditoria
alter table public.tasks
  add column if not exists template_snapshot jsonb not null default '{}'::jsonb;

-- Guard-rail 1: Snapshot obrigatório quando usar Template
alter table public.tasks
  add constraint chk_template_snapshot_present
  check (
    template_id is null
    or (template_snapshot is not null
        and jsonb_typeof(template_snapshot)='object'
        and jsonb_object_length(template_snapshot) > 0)
  );

-- Guard-rail 2: Normalização de tags no banco
create or replace function public.tg_normalize_tags()
returns trigger language plpgsql as $$
declare v_norm text[];
begin
  if new.tags is not null then
    select coalesce(array_agg(t order by t), '{}') into v_norm
    from (
      select distinct lower(trim(x)) as t
      from unnest(new.tags) as x
      where coalesce(trim(x),'') <> ''
    ) s;
    new.tags := v_norm;
  end if;
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_tasks_normalize_tags') then
    create trigger trg_tasks_normalize_tags
    before insert or update on public.tasks
    for each row execute function public.tg_normalize_tags();
  end if;
end$$;