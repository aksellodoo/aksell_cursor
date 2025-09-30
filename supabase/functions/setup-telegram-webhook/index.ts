import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getErrorMessage } from '../_shared/errorUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Bot token not configured' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the webhook URL - this should point to our telegram-webhook function
    const webhookUrl = `${Deno.env.get('SUPABASE_URL') || 'https://nahyrexnxhzutfeqxjte.supabase.co'}/functions/v1/telegram-webhook`;
    
    console.log('Setting up Telegram webhook:', {
      botToken: botToken.substring(0, 10) + '...',
      webhookUrl
    });

    // Set webhook
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: true
      }),
    });

    const telegramData = await telegramResponse.json();
    
    console.log('Telegram setWebhook response:', telegramData);

    if (!telegramData.ok) {
      throw new Error(`Failed to set webhook: ${telegramData.description}`);
    }

    // Also get webhook info to verify
    const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const infoData = await infoResponse.json();
    
    console.log('Webhook info after setup:', infoData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook configured successfully',
        webhookInfo: infoData.result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error setting up Telegram webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: getErrorMessage(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});