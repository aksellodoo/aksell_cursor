import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'
import { getErrorMessage } from '../_shared/errorUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing recurring triggers...');

    // Buscar triggers recorrentes ativos que precisam ser executados
    const { data: triggers, error: triggersError } = await supabase
      .from('workflow_auto_triggers')
      .select(`
        *,
        workflows!inner(id, name, is_active, deleted_at)
      `)
      .eq('is_active', true)
      .in('trigger_type', ['recurring_interval', 'recurring_schedule', 'recurring_monthly'])
      .lte('next_execution_at', new Date().toISOString())
      .eq('workflows.is_active', true)
      .is('workflows.deleted_at', null);

    if (triggersError) {
      console.error('Error fetching triggers:', triggersError);
      return new Response(JSON.stringify({ error: getErrorMessage(triggersError) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processedCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const trigger of triggers || []) {
      try {
        console.log(`Processing trigger ${trigger.id} for workflow ${trigger.workflow_id}`);

        // Verificar se atingiu limite de execuções
        if (trigger.max_executions && trigger.execution_count >= trigger.max_executions) {
          console.log(`Trigger ${trigger.id} reached max executions, deactivating`);
          await supabase
            .from('workflow_auto_triggers')
            .update({ is_active: false })
            .eq('id', trigger.id);
          skippedCount++;
          continue;
        }

        // Verificar se passou da data limite
        if (trigger.end_date && new Date() > new Date(trigger.end_date)) {
          console.log(`Trigger ${trigger.id} past end date, deactivating`);
          await supabase
            .from('workflow_auto_triggers')
            .update({ is_active: false })
            .eq('id', trigger.id);
          skippedCount++;
          continue;
        }

        // Verificar exclusões (feriados, fins de semana, datas específicas)
        const now = new Date();
        const triggerConfig = trigger.trigger_config || {};
        
        if (shouldSkipExecution(now, triggerConfig)) {
          console.log(`Skipping execution for trigger ${trigger.id} due to exclusions`);
          // Calcular próxima execução e atualizar
          const nextExecution = calculateNextExecution(now, trigger.trigger_type, triggerConfig);
          await supabase
            .from('workflow_auto_triggers')
            .update({ next_execution_at: nextExecution })
            .eq('id', trigger.id);
          skippedCount++;
          continue;
        }

        // Criar execução na fila
        const { data: execution, error: executionError } = await supabase
          .from('workflow_executions')
          .insert({
            workflow_id: trigger.workflow_id,
            trigger_data: {
              trigger_type: trigger.trigger_type,
              trigger_id: trigger.id,
              scheduled_execution: true,
              execution_time: now.toISOString()
            },
            status: 'pending'
          })
          .select()
          .single();

        if (executionError) {
          console.error(`Error creating execution for trigger ${trigger.id}:`, executionError);
          results.push({ trigger_id: trigger.id, status: 'error', error: getErrorMessage(executionError) });
          continue;
        }

        // Calcular próxima execução
        const nextExecution = calculateNextExecution(now, trigger.trigger_type, triggerConfig);
        
        // Atualizar trigger com nova contagem e próxima execução
        await supabase
          .from('workflow_auto_triggers')
          .update({
            execution_count: trigger.execution_count + 1,
            next_execution_at: nextExecution,
            last_triggered_at: now.toISOString()
          })
          .eq('id', trigger.id);

        console.log(`Successfully processed trigger ${trigger.id}, next execution: ${nextExecution}`);
        processedCount++;
        results.push({ trigger_id: trigger.id, status: 'success', execution_id: execution.id });

      } catch (error) {
        console.error(`Error processing trigger ${trigger.id}:`, error);
        results.push({ trigger_id: trigger.id, status: 'error', error: getErrorMessage(error) });
      }
    }

    console.log(`Processed ${processedCount} triggers, skipped ${skippedCount}`);

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-recurring-triggers:', error);
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function shouldSkipExecution(date: Date, config: any): boolean {
  const excludeWeekends = config.exclude_weekends || false;
  const excludeHolidays = config.exclude_holidays || false;
  const excludeSpecificDates = config.exclude_specific_dates || [];

  // Verificar fins de semana (0 = domingo, 6 = sábado)
  if (excludeWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
    return true;
  }

  // Verificar datas específicas
  const dateString = date.toISOString().split('T')[0];
  if (excludeSpecificDates.includes(dateString)) {
    return true;
  }

  // Verificar feriados nacionais (lista básica)
  if (excludeHolidays && isNationalHoliday(date)) {
    return true;
  }

  return false;
}

function isNationalHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Feriados fixos mais comuns no Brasil
  const fixedHolidays = [
    { month: 1, day: 1 },   // Ano Novo
    { month: 4, day: 21 },  // Tiradentes
    { month: 5, day: 1 },   // Dia do Trabalhador
    { month: 9, day: 7 },   // Independência
    { month: 10, day: 12 }, // Nossa Senhora Aparecida
    { month: 11, day: 2 },  // Finados
    { month: 11, day: 15 }, // Proclamação da República
    { month: 12, day: 25 }  // Natal
  ];

  return fixedHolidays.some(holiday => holiday.month === month && holiday.day === day);
}

function calculateNextExecution(currentDate: Date, triggerType: string, config: any): string {
  const now = new Date(currentDate);
  
  switch (triggerType) {
    case 'recurring_interval':
      return calculateIntervalExecution(now, config);
    case 'recurring_schedule':
      return calculateScheduleExecution(now, config);
    case 'recurring_monthly':
      return calculateMonthlyExecution(now, config);
    default:
      // Fallback: próxima hora
      now.setHours(now.getHours() + 1);
      return now.toISOString();
  }
}

function calculateIntervalExecution(currentDate: Date, config: any): string {
  const interval = config.interval || 60; // minutos
  const next = new Date(currentDate);
  next.setMinutes(next.getMinutes() + interval);
  return next.toISOString();
}

function calculateScheduleExecution(currentDate: Date, config: any): string {
  const daysOfWeek = config.days_of_week || [1, 2, 3, 4, 5]; // segunda a sexta
  const time = config.time || '09:00'; // formato HH:MM
  
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(currentDate);
  
  // Adicionar um dia e procurar o próximo dia válido
  next.setDate(next.getDate() + 1);
  next.setHours(hours, minutes, 0, 0);
  
  // Procurar próximo dia da semana válido
  while (!daysOfWeek.includes(next.getDay() === 0 ? 7 : next.getDay())) {
    next.setDate(next.getDate() + 1);
  }
  
  return next.toISOString();
}

function calculateMonthlyExecution(currentDate: Date, config: any): string {
  const dayOfMonth = config.day_of_month || 1;
  const time = config.time || '09:00';
  
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(currentDate);
  
  // Próximo mês
  next.setMonth(next.getMonth() + 1);
  next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  next.setHours(hours, minutes, 0, 0);
  
  return next.toISOString();
}