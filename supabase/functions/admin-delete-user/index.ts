
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getErrorMessage } from '../_shared/errorUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  targetUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Initialize Supabase clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set the auth header for the client
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile and verify they're admin/director
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['admin', 'director'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins and directors can delete users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { targetUserId }: DeleteUserRequest = await req.json();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Target user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (targetUserId === user.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if target user exists and get their department
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('profiles')
      .select('name, email, department_id')
      .eq('id', targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin's department for fallback assignment
    const { data: adminUser } = await supabaseAdmin
      .from('profiles')
      .select('department_id')
      .eq('id', user.id)
      .single();

    // Check for existing references in critical tables
    const referenceTables = [
      'chatter_messages',
      'tasks', 
      'form_responses',
      'field_audit_log'
    ];

    const hasReferences = [];

    for (const table of referenceTables) {
      let query;
      
      if (table === 'chatter_messages') {
        query = supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).eq('author_id', targetUserId);
      } else if (table === 'tasks') {
        query = supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).or(`created_by.eq.${targetUserId},assigned_to.eq.${targetUserId}`);
      } else if (table === 'form_responses') {
        query = supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).eq('submitted_by', targetUserId);
      } else if (table === 'field_audit_log') {
        query = supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).eq('changed_by', targetUserId);
      }

      if (query) {
        const { count, error } = await query;
        
        if (error) {
          console.error(`Error checking ${table}:`, error);
          continue;
        }

        if (count && count > 0) {
          hasReferences.push({
            table,
            count
          });
        }
      }
    }

    // Proceed with deletion
    try {
      console.log(`Starting cleanup process for user ${targetUserId}`);

      // Handle task reassignment to comply with valid_flexible_assignment constraint
      console.log(`Reassigning tasks for user ${targetUserId}`);
      console.log(`Target user department: ${targetUser.department_id}, Admin department: ${adminUser?.department_id}`);
      
      // Get current tasks assigned to target user to understand what we're dealing with
      const { data: currentTasks, error: currentTasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, assigned_to, assigned_department, assigned_users, title')
        .eq('assigned_to', targetUserId);
        
      if (currentTasksError) {
        console.error('Error fetching current tasks:', currentTasksError);
      } else {
        console.log(`Found ${currentTasks?.length || 0} tasks assigned to user ${targetUserId}`);
        currentTasks?.forEach(task => {
          console.log(`Task ${task.id}: dept=${task.assigned_department}, users=${task.assigned_users}, title="${task.title}"`);
        });
      }
      
      // Strategy: Handle all possible task assignment scenarios
      
      // 1. Tasks with assigned_to = targetUserId and assigned_department IS NULL and assigned_users IS NULL
      // These need alternative assignment to satisfy constraint
      console.log('Processing tasks with no department and no users...');
      let reassignmentTarget = null;
      
      if (targetUser.department_id) {
        // Use target user's department
        reassignmentTarget = { assigned_department: targetUser.department_id };
        console.log(`Will reassign to target user's department: ${targetUser.department_id}`);
      } else if (adminUser?.department_id) {
        // Use admin's department
        reassignmentTarget = { assigned_department: adminUser.department_id };
        console.log(`Will reassign to admin's department: ${adminUser.department_id}`);
      } else {
        // Fallback to admin as assigned_users
        reassignmentTarget = { assigned_users: [user.id] };
        console.log(`Will reassign to admin user: ${user.id}`);
      }
      
      const { error: taskReassignError1, count: reassignCount1 } = await supabaseAdmin
        .from('tasks')
        .update({ 
          assigned_to: null,
          ...reassignmentTarget
        })
        .eq('assigned_to', targetUserId)
        .is('assigned_department', null)
        .is('assigned_users', null);
        
      if (taskReassignError1) {
        console.error('Error reassigning orphan tasks:', taskReassignError1);
        throw new Error(`Failed to reassign orphan tasks: ${getErrorMessage(taskReassignError1)}`);
      } else {
        console.log(`Successfully reassigned ${reassignCount1 || 0} orphan tasks`);
      }
      
      // 2. Tasks with assigned_to = targetUserId and assigned_department IS NOT NULL
      // Just remove assigned_to since assigned_department exists
      console.log('Processing tasks with existing department assignment...');
      const { error: taskReassignError2, count: reassignCount2 } = await supabaseAdmin
        .from('tasks')
        .update({ assigned_to: null })
        .eq('assigned_to', targetUserId)
        .not('assigned_department', 'is', null);
        
      if (taskReassignError2) {
        console.error('Error removing assigned_to for department tasks:', taskReassignError2);
        throw new Error(`Failed to update department tasks: ${getErrorMessage(taskReassignError2)}`);
      } else {
        console.log(`Successfully updated ${reassignCount2 || 0} department tasks`);
      }
      
      // 3. Tasks with assigned_to = targetUserId and assigned_users IS NOT NULL
      // Just remove assigned_to since assigned_users exists
      console.log('Processing tasks with existing users assignment...');
      const { error: taskReassignError3, count: reassignCount3 } = await supabaseAdmin
        .from('tasks')
        .update({ assigned_to: null })
        .eq('assigned_to', targetUserId)
        .not('assigned_users', 'is', null);
        
      if (taskReassignError3) {
        console.error('Error removing assigned_to for user tasks:', taskReassignError3);
        throw new Error(`Failed to update user tasks: ${getErrorMessage(taskReassignError3)}`);
      } else {
        console.log(`Successfully updated ${reassignCount3 || 0} user tasks`);
      }

      // Final validation: check if any risky tasks still exist
      const { data: riskyTasks, error: riskyTasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, title')
        .eq('assigned_to', targetUserId);
        
      if (riskyTasksError) {
        console.error('Error checking for risky tasks:', riskyTasksError);
      } else if (riskyTasks && riskyTasks.length > 0) {
        console.error(`Still found ${riskyTasks.length} tasks assigned to user:`, riskyTasks);
        return new Response(
          JSON.stringify({ 
            error: 'Cannot delete user - some tasks could not be reassigned',
            details: `${riskyTasks.length} tasks still assigned to user`,
            tasks: riskyTasks
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Task reassignment completed successfully');

      // Clean up all other foreign key references that could block deletion
      const cleanupOperations = [
        // Clean up profiles created_by references
        supabaseAdmin.from('profiles').update({ created_by: null }).eq('created_by', targetUserId),
        
        // Clean up profiles supervisor_id references  
        supabaseAdmin.from('profiles').update({ supervisor_id: null }).eq('supervisor_id', targetUserId),
        
        // Clean up task_comments author_id references
        supabaseAdmin.from('task_comments').update({ author_id: null }).eq('author_id', targetUserId),
        
        // Clean up task_attachments uploaded_by references
        supabaseAdmin.from('task_attachments').update({ uploaded_by: null }).eq('uploaded_by', targetUserId),
        
        // Clean up chatter_messages author_id references
        supabaseAdmin.from('chatter_messages').update({ author_id: null }).eq('author_id', targetUserId),
        
        // Clean up chatter_email_messages author_id references
        supabaseAdmin.from('chatter_email_messages').update({ author_id: null }).eq('author_id', targetUserId),
        
        // Clean up form_responses submitted_by references
        supabaseAdmin.from('form_responses').update({ submitted_by: null }).eq('submitted_by', targetUserId),
        
        // Clean up contacts created_by references
        supabaseAdmin.from('contacts').update({ created_by: null }).eq('created_by', targetUserId),
        
        // Clean up employee_documents uploaded_by references
        supabaseAdmin.from('employee_documents').update({ uploaded_by: null }).eq('uploaded_by', targetUserId),
        
        // Clean up chatter_files uploaded_by references
        supabaseAdmin.from('chatter_files').update({ uploaded_by: null }).eq('uploaded_by', targetUserId),
        
        // Clean up field_audit_log changed_by references
        supabaseAdmin.from('field_audit_log').update({ changed_by: null }).eq('changed_by', targetUserId),
        
        // Clean up access_rejections rejected_by references
        supabaseAdmin.from('access_rejections').update({ rejected_by: null }).eq('rejected_by', targetUserId),
        
        // Clean up workflow_executions triggered_by references
        supabaseAdmin.from('workflow_executions').update({ triggered_by: null }).eq('triggered_by', targetUserId),
        
        // Clean up task_templates created_by references
        supabaseAdmin.from('task_templates').update({ created_by: null }).eq('created_by', targetUserId),
        
        // Clean up task_types created_by references
        supabaseAdmin.from('task_types').update({ created_by: null }).eq('created_by', targetUserId),
        
        // Clean up pending_access_requests supervisor_id references
        supabaseAdmin.from('pending_access_requests').update({ supervisor_id: null }).eq('supervisor_id', targetUserId),
        
        // Clean up forms created_by references
        supabaseAdmin.from('forms').update({ created_by: null }).eq('created_by', targetUserId),
        
        // Clean up email_signatures user_id references (CASCADE delete)
        supabaseAdmin.from('email_signatures').delete().eq('user_id', targetUserId),
        
        // Clean up email_drafts owner_id references (CASCADE delete)
        supabaseAdmin.from('email_drafts').delete().eq('owner_id', targetUserId),
        
        // Clean up email_draft_shares user_id references (CASCADE delete)
        supabaseAdmin.from('email_draft_shares').delete().eq('user_id', targetUserId),
        
        // Clean up form_response_drafts user_id references (CASCADE delete)
        supabaseAdmin.from('form_response_drafts').delete().eq('user_id', targetUserId),
        
        // Clean up protheus_config user_id references (CASCADE delete)
        supabaseAdmin.from('protheus_config').delete().eq('user_id', targetUserId),
        
        // Clean up protheus_tables created_by references (now nullable with FK)
        supabaseAdmin.from('protheus_tables').update({ created_by: null }).eq('created_by', targetUserId)
      ];

      // Execute all cleanup operations
      const cleanupResults = await Promise.allSettled(cleanupOperations);
      
      // Log any cleanup errors but don't fail the operation
      cleanupResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Cleanup operation ${index} failed:`, result.reason);
        }
      });

      console.log('Cleanup operations completed, proceeding with user deletion');

      // Delete from auth.users (this will cascade to profiles due to foreign key)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteAuthError) {
        console.error('Error deleting from auth.users:', deleteAuthError);
        throw deleteAuthError;
      }

      // Log the deletion with reference summary
      const referenceSummary = hasReferences.length > 0 
        ? `Had references: ${hasReferences.map(ref => `${ref.table}(${ref.count})`).join(', ')}`
        : 'No references found';
        
      await supabaseAdmin.from('field_audit_log').insert({
        record_id: targetUserId,
        field_name: 'user_deleted',
        old_value: `${targetUser.name} (${targetUser.email}) - ${referenceSummary}`,
        new_value: 'deleted',
        changed_by: user.id,
        record_type: 'user'
      });

      const deletionMessage = hasReferences.length > 0
        ? `Usuário ${targetUser.name} foi excluído com sucesso. Tinha dados vinculados: ${hasReferences.map(ref => `${ref.table}: ${ref.count} registros`).join(', ')}`
        : `Usuário ${targetUser.name} foi excluído com sucesso.`;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: deletionMessage,
          references: hasReferences
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (deleteError) {
      console.error('Error during user deletion:', deleteError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete user',
          details: getErrorMessage(deleteError)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: getErrorMessage(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
