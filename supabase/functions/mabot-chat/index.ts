import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  
  try {
    // Get environment variables from Supabase secrets
    const mabotBaseUrl = Deno.env.get('MABOT_BASE_URL');
    const mabotUsername = Deno.env.get('MABOT_USERNAME');
    const mabotPassword = Deno.env.get('MABOT_PASSWORD');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!mabotBaseUrl || !mabotUsername || !mabotPassword || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration missing: MABOT_BASE_URL, MABOT_USERNAME, MABOT_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }
    
    // Parse request body according to your API schema
    const { platform, messages, bot_username, chat_id, platform_chat_id } = await req.json();
    
    // Log the received data for debugging
    console.log('Received request data:', {
      platform,
      messagesCount: messages ? messages.length : 0,
      bot_username,
      chat_id,
      platform_chat_id
    });
    
    // Validate required fields
    if (!platform) {
      throw new Error('platform is required');
    }
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages array is required');
    }
    
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate chat ID if not provided
    const finalChatId = platform_chat_id || chat_id || `web_${Date.now()}`;
    
    console.log(`Sending ${messages.length} messages to Mabot for chat ${finalChatId}`);
    console.log('Mabot API URL:', `${mabotBaseUrl}/io/input`);
    console.log('Mabot credentials check:', {
      hasBaseUrl: !!mabotBaseUrl,
      hasUsername: !!mabotUsername,
      hasPassword: !!mabotPassword
    });
    
    // Call Mabot API with the correct payload structure
    const response = await fetch(`${mabotBaseUrl}/io/input`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${mabotUsername}:${mabotPassword}`)}`
      },
      body: JSON.stringify({
        platform,
        messages,
        bot_username,
        chat_id: finalChatId,
        platform_chat_id: finalChatId
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mabot API error:', response.status, errorText);
      throw new Error(`Mabot API error: ${response.status} - ${errorText}`);
    }
    
    const mabotResponse = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      data: mabotResponse,
      chatId: finalChatId
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
    
  } catch (error) {
    console.error('Error in mabot-chat function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
}); 