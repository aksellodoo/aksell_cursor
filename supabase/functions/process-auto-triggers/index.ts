import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { triggerType, triggerData = {} } = await req.json();

    console.log(`Processing auto trigger: ${triggerType}`, triggerData);

    // Processar diferentes tipos de triggers automáticos
    switch (triggerType) {
      case 'department_inactive':
        await processDepartmentInactivity(supabase);
        break;
      
      case 'no_response':
        await processNoResponse(supabase);
        break;
      
      case 'field_change':
        await processFieldChange(supabase, triggerData);
        break;
      
      case 'tasks_accumulation':
        await processTasksAccumulation(supabase);
        break;
      
      case 'deadline_missed':
        await processDeadlineMissed(supabase);
        break;
      
      case 'user_inactive':
        await processUserInactivity(supabase);
        break;
      
      case 'system_event':
        await processSystemEvent(supabase, triggerData);
        break;
      
      default:
        console.log(`Unknown trigger type: ${triggerType}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing auto triggers:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processDepartmentInactivity(supabase: any) {
  console.log('Processing department inactivity triggers...');
  
  // Buscar departamentos com triggers de inatividade
  const { data: triggers } = await supabase
    .from('workflow_auto_triggers')
    .select(`
      *,
      workflows!inner(id, name, is_active)
    `)
    .eq('trigger_type', 'department_inactive')
    .eq('is_active', true)
    .eq('workflows.is_active', true);

  for (const trigger of triggers || []) {
    const config = trigger.trigger_config;
    const inactivityDays = config.deptInactivityAmount || 7;
    const departmentId = config.deptInactivityDepartment;
    
    // Verificar se o departamento está inativo
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);
    
    const { data: recentActivity } = await supabase
      .from('profiles')
      .select('last_login')
      .eq('department_id', departmentId)
      .gte('last_login', cutoffDate.toISOString())
      .limit(1);

    // Se não há atividade recente, disparar o workflow
    if (!recentActivity || recentActivity.length === 0) {
      await supabase.rpc('process_workflow_triggers', {
        p_trigger_type: 'department_inactive',
        p_trigger_data: {
          department_id: departmentId,
          inactivity_days: inactivityDays,
          checked_at: new Date().toISOString()
        }
      });
    }
  }
}

async function processNoResponse(supabase: any) {
  console.log('Processing no response triggers...');
  
  // Buscar workflows com triggers de falta de resposta
  const { data: triggers } = await supabase
    .from('workflow_auto_triggers')
    .select(`
      *,
      workflows!inner(id, name, is_active)
    `)
    .eq('trigger_type', 'no_response')
    .eq('is_active', true)
    .eq('workflows.is_active', true);

  for (const trigger of triggers || []) {
    const config = trigger.trigger_config;
    const timeoutHours = config.responseTimeout || 24;
    
    // Verificar notificações não respondidas
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - timeoutHours);
    
    const { data: unresponded } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('is_read', false)
      .lte('created_at', cutoffDate.toISOString());

    for (const notification of unresponded || []) {
      await supabase.rpc('process_workflow_triggers', {
        p_trigger_type: 'no_response',
        p_trigger_data: {
          notification_id: notification.id,
          user_id: notification.user_id,
          timeout_hours: timeoutHours,
          created_at: notification.created_at
        }
      });
    }
  }
}

async function processFieldChange(supabase: any, triggerData: any) {
  console.log('Processing field change triggers...', triggerData);
  
  // Este será chamado pelos triggers de database quando campos específicos mudarem
  await supabase.rpc('process_workflow_triggers', {
    p_trigger_type: 'field_change',
    p_trigger_data: triggerData
  });
}

async function processTasksAccumulation(supabase: any) {
  console.log('Processing tasks accumulation triggers...');
  
  // Buscar workflows com triggers de acúmulo de tarefas
  const { data: triggers } = await supabase
    .from('workflow_auto_triggers')
    .select(`
      *,
      workflows!inner(id, name, is_active)
    `)
    .eq('trigger_type', 'tasks_accumulation')
    .eq('is_active', true)
    .eq('workflows.is_active', true);

  for (const trigger of triggers || []) {
    const config = trigger.trigger_config;
    const taskLimit = config.taskLimit || 10;
    const target = config.accumulationTarget; // 'user' ou 'department'
    
    if (target === 'user') {
      const userId = config.accumulationUser;
      
      // Contar tarefas pendentes do usuário
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('assigned_to', userId)
        .neq('status', 'done');

      if (count >= taskLimit) {
        await supabase.rpc('process_workflow_triggers', {
          p_trigger_type: 'tasks_accumulation',
          p_trigger_data: {
            user_id: userId,
            task_count: count,
            limit: taskLimit,
            target: 'user'
          }
        });
      }
      
    } else if (target === 'department') {
      const departmentId = config.accumulationDepartment;
      
      // Contar tarefas pendentes do departamento
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('assigned_department', departmentId)
        .neq('status', 'done');

      if (count >= taskLimit) {
        await supabase.rpc('process_workflow_triggers', {
          p_trigger_type: 'tasks_accumulation',
          p_trigger_data: {
            department_id: departmentId,
            task_count: count,
            limit: taskLimit,
            target: 'department'
          }
        });
      }
    }
  }
}

async function processDeadlineMissed(supabase: any) {
  console.log('Processing deadline missed triggers...');
  
  // Buscar tarefas com prazo vencido
  const now = new Date().toISOString();
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*')
    .lt('due_date', now)
    .neq('status', 'done');

  for (const task of overdueTasks || []) {
    await supabase.rpc('process_workflow_triggers', {
      p_trigger_type: 'deadline_missed',
      p_trigger_data: {
        task_id: task.id,
        due_date: task.due_date,
        assigned_to: task.assigned_to,
        assigned_department: task.assigned_department
      }
    });
  }
}

async function processUserInactivity(supabase: any) {
  console.log('Processing user inactivity triggers...');
  
  // Buscar workflows com triggers de inatividade de usuário
  const { data: triggers } = await supabase
    .from('workflow_auto_triggers')
    .select(`
      *,
      workflows!inner(id, name, is_active)
    `)
    .eq('trigger_type', 'user_inactive')
    .eq('is_active', true)
    .eq('workflows.is_active', true);

  for (const trigger of triggers || []) {
    const config = trigger.trigger_config;
    const inactivityDays = config.inactivityAmount || 30;
    
    // Calcular data limite de inatividade
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);
    
    // Buscar usuários inativos
    const { data: inactiveUsers } = await supabase
      .from('profiles')
      .select('*')
      .or(`last_login.is.null,last_login.lt.${cutoffDate.toISOString()}`)
      .eq('status', 'active');

    for (const user of inactiveUsers || []) {
      await supabase.rpc('process_workflow_triggers', {
        p_trigger_type: 'user_inactive',
        p_trigger_data: {
          user_id: user.id,
          last_login: user.last_login,
          inactivity_days: inactivityDays
        }
      });
    }
  }
}

async function processSystemEvent(supabase: any, triggerData: any) {
  console.log('Processing system event triggers...', triggerData);
  
  // Processar eventos específicos do sistema
  const eventType = triggerData.event_type;
  
  await supabase.rpc('process_workflow_triggers', {
    p_trigger_type: 'system_event',
    p_trigger_data: {
      ...triggerData,
      event_type: eventType,
      processed_at: new Date().toISOString()
    }
  });
}