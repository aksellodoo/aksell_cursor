import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from '../_shared/errorUtils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = new Date().toISOString();
    console.log(`🔔 [${startTime}] INICIANDO processamento de notificações Protheus...`);
    console.log(`🔧 Ambiente - URL: ${supabaseUrl?.substring(0, 30)}..., Service Key: ${supabaseServiceKey ? 'presente' : 'ausente'}`);

    // 1. Buscar notificações pendentes na fila
    const { data: queueItems, error: queueError } = await supabase
      .from('protheus_notification_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50); // Processar até 50 por vez

    if (queueError) {
      console.error('Erro ao buscar fila de notificações:', queueError);
      throw queueError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ Nenhuma notificação pendente na fila');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhuma notificação pendente',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`📋 Encontradas ${queueItems.length} notificações pendentes`);

    let processedCount = 0;
    let errorCount = 0;

    // 2. Para cada item da fila, processar notificações
    for (const queueItem of queueItems) {
      try {
        console.log(`🔄 Processando: ${queueItem.record_id} - ${queueItem.record_status}`);

        // 3. Buscar configurações de usuários para esta tabela
        console.log(`🔍 Buscando configs para tabela ${queueItem.protheus_table_id}, status: ${queueItem.record_status}`);
        
        const { data: userConfigs, error: configError } = await supabase
          .from('user_protheus_table_notifications')
          .select(`
            *,
            profiles!user_id (
              name,
              email,
              whatsapp_phone,
              whatsapp_verified,
              telegram_chat_id
            )
          `)
          .eq('protheus_table_id', queueItem.protheus_table_id)
          .eq('is_active', true);

        if (configError) {
          console.error('Erro ao buscar configurações:', configError);
          continue;
        }

        // Filtrar configurações que incluem o status da notificação
        const filteredConfigs = userConfigs?.filter(config => 
          config.record_statuses && config.record_statuses.includes(queueItem.record_status)
        ) || [];

        console.log(`📊 Encontradas ${userConfigs?.length || 0} configurações totais, ${filteredConfigs.length} compatíveis com status '${queueItem.record_status}'`);

        if (!filteredConfigs || filteredConfigs.length === 0) {
          console.log(`⏭️ Nenhum usuário configurado para ${queueItem.record_id} - ${queueItem.record_status}`);
          // Marcar como processado mesmo sem usuários
          await markAsProcessed(queueItem.id);
          processedCount++;
          continue;
        }

        // 4. Para cada usuário configurado, enviar notificações
        for (const config of filteredConfigs) {
          const channels = config.notification_channels || {};
          const profile = config.profiles;

          console.log(`👤 Processando usuário ${config.user_id} - Canais:`, channels);
          console.log(`📱 Profile encontrado:`, { 
            name: profile?.name, 
            email: profile?.email, 
            whatsapp_phone: profile?.whatsapp_phone,
            whatsapp_verified: profile?.whatsapp_verified 
          });

          if (!profile) {
            console.log(`❌ Profile não encontrado para usuário ${config.user_id}`);
            continue;
          }

          const notificationData = {
            title: `Protheus - SA3010 (Vendedores)`,
            message: `Registro ${queueItem.record_status} - ${queueItem.record_id}`,
            record_id: queueItem.record_id,
            record_status: queueItem.record_status,
            record_data: queueItem.record_data || {},
            previous_data: queueItem.previous_data || {}
          };

          // Enviar notificação no app
          if (channels.app) {
            await sendAppNotification(config.user_id, notificationData);
          }

          // Enviar email
          if (channels.email && profile.email) {
            await sendEmailNotification(profile.email, notificationData);
          }

          // Enviar WhatsApp
          if (channels.whatsapp && profile.whatsapp_phone && profile.whatsapp_verified) {
            console.log(`📱 [WHATSAPP] Iniciando envio para ${profile.name} (${profile.whatsapp_phone})`);
            console.log(`📋 [WHATSAPP] Canal habilitado: ${channels.whatsapp}, Telefone: ${profile.whatsapp_phone}, Verificado: ${profile.whatsapp_verified}`);
            console.log(`📦 [WHATSAPP] Dados da notificação:`, {
              title: notificationData.title,
              message: notificationData.message,
              record_id: notificationData.record_id,
              record_status: notificationData.record_status
            });
            
            try {
              const whatsappStart = Date.now();
              await sendWhatsAppNotification(config.user_id, notificationData);
              const whatsappDuration = Date.now() - whatsappStart;
              console.log(`✅ [WHATSAPP] Enviado com sucesso para ${profile.name} em ${whatsappDuration}ms`);
            } catch (error) {
              console.error(`❌ [WHATSAPP] ERRO ao enviar para ${profile.name}:`, {
                error: getErrorMessage(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: config.user_id,
                phone: profile.whatsapp_phone
              });
            }
          } else {
            console.log(`⏭️ [WHATSAPP] Não enviado para ${profile.name}:`, {
              canal_habilitado: !!channels.whatsapp,
              tem_telefone: !!profile.whatsapp_phone,
              telefone_verificado: !!profile.whatsapp_verified,
              telefone: profile.whatsapp_phone,
              motivo: !channels.whatsapp ? 'Canal desabilitado' : 
                      !profile.whatsapp_phone ? 'Sem telefone' :
                      !profile.whatsapp_verified ? 'Telefone não verificado' : 'Motivo desconhecido'
            });
          }

          // Enviar Telegram
          if (channels.telegram && profile.telegram_chat_id) {
            await sendTelegramNotification(profile.telegram_chat_id, notificationData);
          }
        }

        // 5. Marcar como processado
        await markAsProcessed(queueItem.id);
        
        // 6. Atualizar timestamps de controle para todos os usuários configurados
        console.log(`🕒 [TIMESTAMPS] Atualizando para ${filteredConfigs.length} usuários`);
        
        for (const config of filteredConfigs) {
          console.log(`🕒 [TIMESTAMPS] Processando usuário ${config.user_id}`);
          
          // Usar dados do registro atual sendo processado
          const latestUpdatedAt = queueItem.record_data?.updated_at || queueItem.created_at;
          
          console.log(`🕒 [TIMESTAMPS] Dados:`, {
            userId: config.user_id,
            tableId: queueItem.protheus_table_id,
            latestUpdatedAt,
            queueItemData: queueItem.record_data ? 'presente' : 'ausente',
            queueCreatedAt: queueItem.created_at
          });
          
          await updateNotificationTimestamps(
            config.user_id, 
            queueItem.protheus_table_id, 
            latestUpdatedAt
          );
        }
        
        processedCount++;

      } catch (error) {
        console.error(`Erro ao processar notificação ${queueItem.id}:`, error);
        errorCount++;
      }
    }

    const endTime = new Date().toISOString();
    console.log(`✅ [${endTime}] Processamento concluído: ${processedCount} processadas, ${errorCount} erros`);
    console.log(`⏰ Execução iniciada em: ${startTime}, finalizada em: ${endTime}`);

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: queueItems.length,
      startTime,
      endTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 [ERRO GERAL] Erro no processamento:', error);
    console.error('📊 Stack trace completo:', error instanceof Error ? error.stack : undefined);
    return new Response(JSON.stringify({
      success: false,
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Funções auxiliares
async function markAsProcessed(queueId: string) {
  const { error } = await supabase
    .from('protheus_notification_queue')
    .update({ 
      status: 'processed', 
      processed_at: new Date().toISOString() 
    })
    .eq('id', queueId);

  if (error) {
    console.error('Erro ao marcar como processado:', error);
  }
}

async function sendAppNotification(userId: string, data: any) {
  try {
    const { error } = await supabase
      .from('app_notifications')
      .insert({
        user_id: userId,
        title: data.title,
        message: data.message,
        type: 'protheus_update',
        data: {
          table_name: data.table_name,
          record_status: data.record_status,
          record_data: data.record_data
        }
      });

    if (error) {
      console.error('Erro ao criar notificação no app:', error);
    } else {
      console.log(`📱 Notificação no app enviada para usuário ${userId}`);
    }
  } catch (error) {
    console.error('Erro na notificação do app:', error);
  }
}

async function sendEmailNotification(email: string, data: any) {
  try {
    // Implementar envio de email via Resend ou outro provedor
    console.log(`📧 Email seria enviado para ${email}:`, data.title);
    // TODO: Integrar com serviço de email
  } catch (error) {
    console.error('Erro no envio de email:', error);
  }
}

async function sendWhatsAppNotification(userId: string, data: any) {
  try {
    console.log(`🔍 [WHATSAPP-FUNC] sendWhatsAppNotification iniciado para userId: ${userId}`);
    console.log(`📋 [WHATSAPP-FUNC] Dados recebidos:`, { 
      record_status: data.record_status, 
      record_id: data.record_id,
      record_data: data.record_data ? 'presente' : 'ausente',
      title: data.title,
      message: data.message
    });

    // Extrair dados principais do registro
    const recordData = data.record_data || {};
    const previousData = data.previous_data || {};
    
    // Identificar chaves do registro (SA3010 = vendedores)
    const filial = recordData.a3_filial || '';
    const codigo = recordData.a3_cod || '';
    const nome = recordData.a3_nome || recordData.a3_nreduz || '';
    
    console.log(`📊 Dados extraídos - Filial: ${filial}, Código: ${codigo}, Nome: ${nome}`);
    
    // Gerar mensagem detalhada baseada no tipo de mudança
    let message = '';
    
    switch (data.record_status) {
      case 'new':
        message = `🆕 *Novo Vendedor Cadastrado*\n\n` +
                 `📋 *Filial:* ${filial}\n` +
                 `🔢 *Código:* ${codigo}\n` +
                 `👤 *Nome:* ${nome}\n\n` +
                 `⏰ ${new Date().toLocaleString('pt-BR')}`;
        break;
        
      case 'updated':
        message = `✏️ *Vendedor Atualizado*\n\n` +
                 `📋 *Filial:* ${filial}\n` +
                 `🔢 *Código:* ${codigo}\n` +
                 `👤 *Nome:* ${nome}\n\n`;
        
        // Detectar mudanças específicas
        const changes = [];
        if (previousData.a3_nome !== recordData.a3_nome) {
          changes.push(`Nome: ${previousData.a3_nome} → ${recordData.a3_nome}`);
        }
        if (previousData.a3_nreduz !== recordData.a3_nreduz) {
          changes.push(`Nome Red.: ${previousData.a3_nreduz} → ${recordData.a3_nreduz}`);
        }
        if (previousData.a3_email !== recordData.a3_email) {
          changes.push(`Email: ${previousData.a3_email} → ${recordData.a3_email}`);
        }
        
        if (changes.length > 0) {
          message += `🔄 *Alterações:*\n${changes.join('\n')}\n\n`;
        }
        
        message += `⏰ ${new Date().toLocaleString('pt-BR')}`;
        break;
        
      case 'deleted':
        message = `🗑️ *Vendedor Removido*\n\n` +
                 `📋 *Filial:* ${filial}\n` +
                 `🔢 *Código:* ${codigo}\n` +
                 `👤 *Nome:* ${nome}\n\n` +
                 `⏰ ${new Date().toLocaleString('pt-BR')}`;
        break;
        
      default:
        message = `🔔 *Atualização Protheus*\n\n` +
                 `Registro ${data.record_status} na tabela SA3010\n` +
                 `Filial: ${filial} | Código: ${codigo}`;
    }

    console.log(`📝 Mensagem WhatsApp gerada (${message.length} caracteres):`, message.substring(0, 100) + '...');

    // Usar a função existente de WhatsApp
    console.log(`🚀 [WHATSAPP-FUNC] Invocando send-whatsapp-message para userId: ${userId}`);
    console.log(`📤 [WHATSAPP-FUNC] Payload:`, {
      userId: userId,
      messageLength: message.length,
      messagePreview: message.substring(0, 100)
    });
    
    const { data: whatsappResult, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        userId: userId,
        message: message
      }
    });

    console.log(`📱 [WHATSAPP-FUNC] Resultado da invocação:`, { 
      success: !!whatsappResult,
      data: whatsappResult, 
      hasError: !!error,
      errorMessage: error ? getErrorMessage(error) : undefined,
      errorDetails: error
    });

    if (error) {
      console.error('❌ [WHATSAPP-FUNC] ERRO CRÍTICO ao enviar WhatsApp:', {
        error: getErrorMessage(error),
        errorCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
        errorDetails: error,
        userId: userId,
        messagePreview: message.substring(0, 50)
      });
      throw error;
    } else {
      console.log(`✅ [WHATSAPP-FUNC] WhatsApp enviado com sucesso para usuário ${userId}:`, {
        messageId: whatsappResult?.messageId,
        success: whatsappResult?.success
      });
    }
  } catch (error) {
    console.error('❌ Erro na notificação WhatsApp:', error);
    throw error;
  }
}

async function sendTelegramNotification(chatId: string, data: any) {
  try {
    // Usar a função existente de Telegram
    const { error } = await supabase.functions.invoke('send-telegram-notification', {
      body: {
        chat_id: chatId,
        title: data.title,
        message: data.message,
        notification_type: 'protheus_update',
        data: data.record_data
      }
    });

    if (error) {
      console.error('Erro ao enviar Telegram:', error);
    } else {
      console.log(`📱 Telegram enviado para chat ${chatId}`);
    }
  } catch (error) {
    console.error('Erro na notificação Telegram:', error);
  }
}

async function updateNotificationTimestamps(userId: string, tableId: string, lastRecordUpdatedAt: string) {
  try {
    console.log(`🕒 [TIMESTAMPS] Iniciando atualização para usuário ${userId}`);
    console.log(`🕒 [TIMESTAMPS] Parâmetros:`, {
      userId,
      tableId,
      lastRecordUpdatedAt,
      hasTimestamp: !!lastRecordUpdatedAt
    });

    if (!lastRecordUpdatedAt) {
      console.log(`⚠️ [TIMESTAMPS] Timestamp de atualização não disponível para usuário ${userId} - usando timestamp atual`);
      lastRecordUpdatedAt = new Date().toISOString();
    }

    const updateData = {
      last_notification_sent_at: new Date().toISOString(),
      last_record_updated_at: lastRecordUpdatedAt
    };

    console.log(`🕒 [TIMESTAMPS] Dados para atualização:`, updateData);

    const { data, error } = await supabase
      .from('user_protheus_table_notifications')
      .update(updateData)
      .eq('user_id', userId)
      .eq('protheus_table_id', tableId)
      .select();

    console.log(`🕒 [TIMESTAMPS] Resultado da atualização:`, {
      success: !error,
      rowsAffected: data?.length || 0,
      error: error ? getErrorMessage(error) : undefined,
      data: data
    });

    if (error) {
      console.error(`❌ [TIMESTAMPS] Erro ao atualizar timestamps para usuário ${userId}:`, {
        error: getErrorMessage(error),
        code: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
        details: error && typeof error === 'object' && 'details' in error ? error.details : undefined,
        hint: error && typeof error === 'object' && 'hint' in error ? error.hint : undefined
      });
    } else {
      console.log(`✅ [TIMESTAMPS] Timestamps atualizados com sucesso para usuário ${userId} - ${data?.length || 0} linhas afetadas`);
    }
  } catch (error) {
    console.error(`❌ [TIMESTAMPS] Erro crítico na atualização de timestamps:`, {
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      tableId
    });
  }
}