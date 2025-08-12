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
    const mabotApiKey = Deno.env.get('MABOT_API_KEY'); // New: API key alternative
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!mabotBaseUrl || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration missing: MABOT_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }
    
    // We require at least one Mabot auth method
    if (!mabotApiKey && !mabotAccessToken && (!mabotUsername || !mabotPassword)) {
      throw new Error('Authentication missing: Provide MABOT_API_KEY or MABOT_ACCESS_TOKEN, or both MABOT_USERNAME and MABOT_PASSWORD');
    }

    // Helper to authenticate against Mabot and obtain a bearer token
    const fetchMabotToken = async (): Promise<string> => {
      if (!mabotUsername || !mabotPassword) {
        throw new Error('Cannot fetch Mabot token: username/password not configured');
      }

      // Try multiple common auth endpoints and encodings
      const candidates: Array<{ url: string; headers: Record<string, string>; body: string }> = [];

      const formBody = new URLSearchParams();
      formBody.set('username', mabotUsername);
      formBody.set('password', mabotPassword);
      formBody.set('grant_type', 'password');

      const jsonBody = JSON.stringify({ username: mabotUsername, password: mabotPassword, grant_type: 'password' });

      // Common endpoints
      const endpoints = ['/auth/login', '/auth/token', '/token'];

      for (const ep of endpoints) {
        // x-www-form-urlencoded
        candidates.push({
          url: `${mabotBaseUrl}${ep}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
          body: formBody.toString()
        });
        // JSON
        candidates.push({
          url: `${mabotBaseUrl}${ep}`,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: jsonBody
        });
      }

      let lastErrText = '';
      for (const attempt of candidates) {
        const authResp = await fetch(attempt.url, {
          method: 'POST',
          headers: attempt.headers,
          body: attempt.body
        });
        if (authResp.ok) {
          const authData = await authResp.json();
          const token: string | undefined = authData?.access_token || authData?.token;
          if (!token) {
            lastErrText = 'No access_token received from Mabot';
            continue;
          }
          return token;
        }
        const errText = await authResp.text();
        lastErrText = `${authResp.status} - ${errText}`;
      }

      throw new Error(`Mabot auth failed across endpoints: ${lastErrText}`);
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
    
    // Select auth mode
    type AuthMode = 'apiKey' | 'bearer';
    const authMode: AuthMode = mabotApiKey ? 'apiKey' : 'bearer';

    console.log(`Sending ${finalMessages.length} messages to Mabot for chat ${finalChatId}`);
    console.log('Mabot API URL:', `${mabotBaseUrl}/io/input`);
    console.log('Authentication method:', authMode === 'apiKey' ? 'API Key' : (mabotAccessToken ? 'Bearer Token (from env)' : 'Token via login'));

    // Resolve the auth credential
    let tokenToUse: string | null = null;
    if (authMode === 'bearer') {
      tokenToUse = mabotAccessToken || null;
      if (!tokenToUse) {
        tokenToUse = await fetchMabotToken();
      }
    }

    const buildHeaders = (mode: AuthMode, value: string | null): Record<string, string> => {
      const base: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (mode === 'apiKey' && mabotApiKey) {
        base['x-api-key'] = mabotApiKey;
      }
      if (mode === 'bearer' && value) {
        base['Authorization'] = `Bearer ${value}`;
      }
      return base;
    };

    const safeParse = (text: string) => {
      try { return JSON.parse(text); } catch { return text; }
    };

    // Encapsulate the call to Mabot input
    const callMabotInput = async (headers: Record<string, string>) => {
      return await fetch(`${mabotBaseUrl}/io/input`, {
        method: 'POST',
        headers,
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
    let response = await callMabotInput(buildHeaders(authMode, tokenToUse));

    // If unauthorized with bearer, try to re-authenticate once (useful when env token expired)
    if (authMode === 'bearer' && response.status === 401) {
      console.warn('Mabot API returned 401. Attempting to re-authenticate via username/password...');
      try {
        const refreshedToken = await fetchMabotToken();
        response = await callMabotInput(buildHeaders('bearer', refreshedToken));
      } catch (reAuthErr) {
        console.error('Re-authentication failed:', reAuthErr);
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      const status = response.status;
      console.error('Mabot API error:', status, errorText);
      // Propagate the upstream status (401/403/etc.) to the client for clearer debugging
      return new Response(JSON.stringify({
        success: false,
        error: 'Mabot API error',
        status,
        details: safeParse(errorText)
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status
      });
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
    // If we detect an upstream auth error message, prefer 401
    const message: string = error?.message || String(error);
    const shouldBe401 = /Mabot API error:\s*401/i.test(message) || /Not authenticated/i.test(message);
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: shouldBe401 ? 401 : 500
    });
  }
}); 