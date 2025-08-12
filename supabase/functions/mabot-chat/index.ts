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
    const mabotAccessToken = Deno.env.get('MABOT_ACCESS_TOKEN'); // New: Bearer token
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!mabotBaseUrl || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration missing: MABOT_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }
    
    // Check if we have either username/password OR access token
    if (!mabotAccessToken && (!mabotUsername || !mabotPassword)) {
      throw new Error('Authentication missing: Either MABOT_ACCESS_TOKEN or both MABOT_USERNAME and MABOT_PASSWORD are required');
    }

    // Helper to authenticate against Mabot and obtain a bearer token
    const fetchMabotToken = async (): Promise<string> => {
      if (!mabotUsername || !mabotPassword) {
        throw new Error('Cannot fetch Mabot token: username/password not configured');
      }
      const body = new URLSearchParams();
      body.set('username', mabotUsername);
      body.set('password', mabotPassword);
      body.set('grant_type', 'password');

      const authResp = await fetch(`${mabotBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: body.toString()
      });
      if (!authResp.ok) {
        const errText = await authResp.text();
        throw new Error(`Mabot auth failed: ${authResp.status} - ${errText}`);
      }
      const authData = await authResp.json();
      const token: string | undefined = authData?.access_token || authData?.token;
      if (!token) {
        throw new Error('No access_token received from Mabot');
      }
      return token;
    };
    
    // Parse request body and log the raw payload for debugging
    const rawBody = await req.json();
    console.log('Raw request body received:', JSON.stringify(rawBody, null, 2));
    
    // Extract fields with fallbacks
    const { 
      platform, 
      messages, 
      bot_username, 
      chat_id, 
      platform_chat_id,
      // Handle legacy fields that might be sent by frontend
      session,
      userText,
      contextText,
      contextFiles
    } = rawBody;
    
    // Log the extracted data for debugging
    console.log('Extracted fields:', {
      platform,
      messagesCount: messages ? messages.length : 0,
      bot_username,
      chat_id,
      platform_chat_id,
      hasSession: !!session,
      hasUserText: !!userText,
      hasContextText: !!contextText,
      hasContextFiles: !!contextFiles
    });
    
    // Determine platform - use provided or default to 'web'
    const finalPlatform = platform || 'web';
    
    // Handle different payload formats
    let finalMessages = messages;
    let finalChatId = platform_chat_id || chat_id;
    
    // If no messages array but we have legacy fields, construct messages
    if (!finalMessages && (userText || contextText || contextFiles)) {
      console.log('Constructing messages from legacy fields');
      finalMessages = [];
      
      // Add context text if provided
      if (contextText && contextText.trim().length > 0) {
        finalMessages.push({
          role: "user",
          contents: [{ type: "text", value: contextText }]
        });
      }
      
      // Add context files if provided
      if (contextFiles && contextFiles.length > 0) {
        contextFiles.forEach((file: any) => {
          finalMessages!.push({
            role: "user",
            contents: [
              { type: "text", value: `Context File: ${file.title || 'Untitled'}` },
              { type: "file", value: file.url, mime_type: file.mime_type }
            ]
          });
        });
      }
      
      // Add user text if provided
      if (userText && userText.trim().length > 0) {
        finalMessages.push({
          role: "user",
          contents: [{ type: "text", value: userText }]
        });
      }
    }
    
    // Validate that we have messages
    if (!finalMessages || !Array.isArray(finalMessages) || finalMessages.length === 0) {
      throw new Error('messages array is required and must contain at least one message');
    }
    
    // Generate chat ID if not provided
    if (!finalChatId) {
      finalChatId = `web_${Date.now()}`;
    }
    
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Sending ${finalMessages.length} messages to Mabot for chat ${finalChatId}`);
    console.log('Mabot API URL:', `${mabotBaseUrl}/io/input`);
    console.log('Authentication method:', mabotAccessToken ? 'Bearer Token (from env)' : 'Token via login');

    // Resolve the token we will use
    let tokenToUse: string | null = mabotAccessToken || null;
    if (!tokenToUse) {
      tokenToUse = await fetchMabotToken();
    }

    const buildHeaders = (token: string): Record<string, string> => ({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    });

    // Encapsulate the call to Mabot input
    const callMabotInput = async (token: string) => {
      return await fetch(`${mabotBaseUrl}/io/input`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({
          platform: finalPlatform,
          messages: finalMessages,
          bot_username,
          chat_id: finalChatId,
          platform_chat_id: finalChatId
        })
      });
    };

    // First attempt
    let response = await callMabotInput(tokenToUse!);

    // If unauthorized, try to re-authenticate once (useful when env token expired)
    if (response.status === 401) {
      console.warn('Mabot API returned 401. Attempting to re-authenticate...');
      try {
        const refreshedToken = await fetchMabotToken();
        response = await callMabotInput(refreshedToken);
      } catch (reAuthErr) {
        console.error('Re-authentication failed:', reAuthErr);
      }
    }
    
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
    
  } catch (error: any) {
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