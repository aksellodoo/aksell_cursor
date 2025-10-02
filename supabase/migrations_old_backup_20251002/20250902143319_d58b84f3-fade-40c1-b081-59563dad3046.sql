
-- 1) Índice para performance nas consultas por lead
create index if not exists idx_unified_accounts_lead_id on public.unified_accounts(lead_id);

-- 2) Backfill: preenche sales_leads.economic_group_id com o valor mais recente de unified_accounts
with latest as (
  select distinct on (lead_id)
         lead_id,
         economic_group_id
  from public.unified_accounts
  where lead_id is not null
    and economic_group_id is not null
  order by lead_id, seq_id desc, updated_at desc, created_at desc
)
update public.sales_leads sl
set economic_group_id = l.economic_group_id
from latest l
where sl.id = l.lead_id
  and sl.economic_group_id is null;

-- 3) Função de trigger para espelhar mudanças de unified_accounts → sales_leads
create or replace function public.tg_sync_lead_group_from_unified()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Se não houver lead vinculado, não faz nada
  if coalesce(new.lead_id, old.lead_id) is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    -- Espelha o grupo econômico do unified para o lead
    update public.sales_leads sl
       set economic_group_id = new.economic_group_id
     where sl.id = new.lead_id;

  elsif tg_op = 'DELETE' then
    -- Ao deletar/vincular a null, só limpa no lead se não houver outro unified com grupo
    update public.sales_leads sl
       set economic_group_id = null
     where sl.id = old.lead_id
       and not exists (
         select 1
           from public.unified_accounts ua
          where ua.lead_id = old.lead_id
            and ua.economic_group_id is not null
       );
  end if;

  return coalesce(new, old);
end;
$$;

-- 4) Triggers de sincronização (inserção/atualização e deleção)
drop trigger if exists trg_sync_lead_group_from_unified_insupd on public.unified_accounts;
create trigger trg_sync_lead_group_from_unified_insupd
after insert or update of economic_group_id, lead_id
on public.unified_accounts
for each row execute function public.tg_sync_lead_group_from_unified();

drop trigger if exists trg_sync_lead_group_from_unified_del on public.unified_accounts;
create trigger trg_sync_lead_group_from_unified_del
after delete on public.unified_accounts
for each row execute function public.tg_sync_lead_group_from_unified();
