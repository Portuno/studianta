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

    // Simple UUID v4 validator
    const isValidUUID = (value: unknown): value is string => {
      if (typeof value !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    };

    // Helpers to convert files to base64 and infer names/types expected by Mabot
    const inferFilenameFromUrl = (url: string, fallback: string): string => {
      try {
        const u = new URL(url);
        const last = u.pathname.split('/').pop() || fallback;
        return decodeURIComponent(last) || fallback;
      } catch {
        return fallback;
      }
    };

    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const fetchAsBase64 = async (url: string): Promise<{ base64: string; mimetype: string; filename: string }> => {
      const resp = await fetch(url);
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        throw new Error(`Failed to fetch file: ${resp.status} ${errText}`);
      }
      const contentType = resp.headers.get('content-type') || 'application/octet-stream';
      const arrayBuf = await resp.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuf);
      const filename = inferFilenameFromUrl(url, 'file');
      return { base64, mimetype: contentType, filename };
    };

    const mapMimeToMabotType = (mimetype: string): 'audio' | 'image' | 'video' | 'document' => {
      const top = (mimetype || '').split('/')[0];
      if (top === 'audio') return 'audio';
      if (top === 'image') return 'image';
      if (top === 'video') return 'video';
      if (top === 'text' || top === 'application') return 'document';
      return 'document';
    };
    
    // Handle different payload formats
    let finalMessages = messages;

    // If no messages array but we have legacy fields, construct messages
    if (!finalMessages && (userText || contextText || contextFiles)) {
      console.log('Constructing messages from legacy fields');
      finalMessages = [];
      
      // Add context text if provided
      if (contextText && contextText.trim().length > 0) {
        finalMessages.push({
          role: "user",
          contents: [{ type: "text", value: contextText, parse_mode: "Markdown" }]
        });
      }
      
      // Add context files if provided (download -> base64 -> typed content)
      if (contextFiles && contextFiles.length > 0) {
        for (const file of contextFiles) {
          try {
            const sourceUrl: string = file.url;
            const declaredMime: string | undefined = file.mime_type;
            const title: string | undefined = file.title;
            const fetched = await fetchAsBase64(sourceUrl);
            const effectiveMime = declaredMime || fetched.mimetype;
            const mabotType = mapMimeToMabotType(effectiveMime);

            const baseFileContent: any = {
              type: mabotType,
              filename: title || fetched.filename,
              mimetype: effectiveMime,
              value: fetched.base64
            };

            const contents: any[] = [baseFileContent];
            // Optional caption as a single text content (keeps at most one text per message)
            if (title && typeof title === 'string' && title.trim().length > 0) {
              contents.push({ type: 'text', value: `Context File: ${title}`, parse_mode: 'Markdown' });
            }

            finalMessages!.push({
              role: 'user',
              contents
            });
          } catch (err) {
            console.error('Failed to attach context file', file?.title || file?.url, err);
            finalMessages!.push({
              role: 'user',
              contents: [{ type: 'text', value: `⚠️ Note: Could not attach file "${file?.title || file?.url}".`, parse_mode: 'Markdown' }]
            });
          }
        }
      }
      
      // Add user text if provided
      if (userText && userText.trim().length > 0) {
        finalMessages.push({
          role: "user",
          contents: [{ type: "text", value: userText, parse_mode: "Markdown" }]
        });
      }
    }

    // Normalize any provided messages to Mabot schema
    const isHttpUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v);

    const normalizeContents = async (contents: any[]): Promise<any[]> => {
      if (!Array.isArray(contents)) return [];
      const normalized: any[] = [];
      for (const c of contents) {
        if (!c || typeof c !== 'object') continue;
        // Normalize text
        if (c.type === 'text') {
          normalized.push({ type: 'text', value: String(c.value ?? ''), parse_mode: c.parse_mode || 'Markdown' });
          continue;
        }
        // Legacy 'file'
        if (c.type === 'file') {
          const m = c.mimetype || c.mime_type || 'application/octet-stream';
          const t = mapMimeToMabotType(m);
          let base64 = '';
          let fileName = c.filename;
          if (isHttpUrl(c.value)) {
            const fetched = await fetchAsBase64(c.value);
            base64 = fetched.base64;
            fileName = fileName || fetched.filename;
          } else if (typeof c.value === 'string') {
            base64 = c.value; // assume already base64
          }
          if (!fileName) {
            // Try to infer from value if it looks like a path, else fallback
            fileName = inferFilenameFromUrl(String(c.value || ''), 'file');
          }
          normalized.push({
            type: t,
            filename: fileName,
            mimetype: m,
            value: base64
          });
          continue;
        }
        // Known types: image/audio/video/document
        if (c.type === 'image' || c.type === 'audio' || c.type === 'video' || c.type === 'document') {
          const m = c.mimetype || c.mime_type || 'application/octet-stream';
          let base64 = '';
          let fileName = c.filename;
          if (isHttpUrl(c.value)) {
            const fetched = await fetchAsBase64(c.value);
            base64 = fetched.base64;
            fileName = fileName || fetched.filename;
          } else if (typeof c.value === 'string') {
            base64 = c.value;
          }
          if (!fileName) {
            fileName = inferFilenameFromUrl(String(c.value || ''), 'file');
          }
          normalized.push({
            type: c.type,
            filename: fileName,
            mimetype: m,
            value: base64
          });
          continue;
        }
        // Fallback: coerce to document
        const m = c.mimetype || c.mime_type || 'application/octet-stream';
        let base64 = '';
        let fileName = c.filename;
        if (isHttpUrl(c.value)) {
          const fetched = await fetchAsBase64(c.value);
          base64 = fetched.base64;
          fileName = fileName || fetched.filename;
        } else if (typeof c.value === 'string') {
          base64 = c.value;
        }
        if (!fileName) {
          fileName = inferFilenameFromUrl(String(c.value || ''), 'file');
        }
        normalized.push({
          type: 'document',
          filename: fileName,
          mimetype: m,
          value: base64
        });
      }
      // Enforce single text per message by merging extras into the first
      const textIndices = normalized.map((x, i) => (x.type === 'text' ? i : -1)).filter(i => i >= 0);
      if (textIndices.length > 1) {
        const primaryIndex = textIndices[0];
        let merged = normalized[primaryIndex].value || '';
        for (let j = 1; j < textIndices.length; j++) {
          const idx = textIndices[j];
          const val = normalized[idx]?.value || '';
          if (val) merged = merged ? `${merged}\n\n${val}` : val;
        }
        normalized[primaryIndex].value = merged;
        // Remove the extra text contents (from the end to keep indices)
        for (let j = textIndices.length - 1; j >= 1; j--) {
          normalized.splice(textIndices[j], 1);
        }
      }
      return normalized;
    };

    const normalizedMessages = [] as any[];
    for (const msg of finalMessages || []) {
      const role = msg?.role || 'user';
      const contents = await normalizeContents(msg?.contents || []);
      if (contents.length === 0) continue;
      normalizedMessages.push({ role, contents });
    }

    // Collapse all user messages into a single message with one text + all files
    const nonUserMessages = normalizedMessages.filter((m) => m.role !== 'user');
    const userMessages = normalizedMessages.filter((m) => m.role === 'user');

    let collapsedMessages: any[] = normalizedMessages;
    if (userMessages.length > 1) {
      const allFileContents: any[] = [];
      const textPieces: string[] = [];
      let textParseMode: string | undefined = 'Markdown';

      for (const um of userMessages) {
        for (const c of um.contents) {
          if (c?.type === 'text') {
            if (typeof c?.value === 'string' && c.value.trim().length > 0) {
              textPieces.push(c.value);
            }
            if (c?.parse_mode) textParseMode = c.parse_mode;
          } else {
            allFileContents.push(c);
          }
        }
      }

      const mergedContents: any[] = [];
      if (textPieces.length > 0) {
        mergedContents.push({ type: 'text', value: textPieces.join('\n\n'), parse_mode: textParseMode || 'Markdown' });
      }
      mergedContents.push(...allFileContents);

      const combinedUserMessage = { role: 'user', contents: mergedContents };
      collapsedMessages = [...nonUserMessages, combinedUserMessage];
    }

    // Validate that we have messages
    if (!collapsedMessages || !Array.isArray(collapsedMessages) || collapsedMessages.length === 0) {
      throw new Error('messages array is required and must contain at least one message');
    }

    // Derive proper IDs for Mabot API
    const sessionChatId: string | undefined = session?.mabotChatId;
    const mabotUUID: string | undefined = [chat_id, sessionChatId].find((id) => isValidUUID(id));

    let finalPlatformChatId: string | undefined = platform_chat_id;
    if (!finalPlatformChatId) {
      // Prefer a stable identifier if one exists; fallback to a generated web ID
      finalPlatformChatId = mabotUUID || `web_${Date.now()}`;
    }
    
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Sending ${collapsedMessages.length} messages to Mabot for chat`, {
      chat_id: mabotUUID || null,
      platform_chat_id: finalPlatformChatId
    });
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
      const requestBody: any = {
        platform: finalPlatform,
        messages: collapsedMessages,
        bot_username,
        platform_chat_id: finalPlatformChatId,
      };
      if (mabotUUID) {
        requestBody.chat_id = mabotUUID;
      }
      return await fetch(`${mabotBaseUrl}/io/input`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(requestBody)
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
      chatId: mabotUUID || finalPlatformChatId
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