import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar';
export const STATE_MAX_AGE_MS = 10 * 60 * 1000;
export const OAUTH_COOKIE_MAX_AGE = 600;

export function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

export function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function getOAuthStateSecret() {
  return process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
}

export function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (clientSecret && !clientSecret.match(/^[A-Z0-9]/)) {
    clientSecret = clientSecret.replace(/^[^A-Z0-9]+/, '');
  }

  return { clientId, clientSecret };
}

export function getRequestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export function getCallbackRedirectUri(req) {
  return `${getRequestOrigin(req)}/api/google/oauth/callback`;
}

export function validateReturnTo(returnTo) {
  if (!returnTo || typeof returnTo !== 'string') {
    return null;
  }

  const trimmed = returnTo.trim();
  if (!trimmed) {
    return null;
  }

  const blockedSchemes = ['javascript', 'data', 'vbscript', 'file'];
  const match = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (!match) {
    return null;
  }

  const scheme = match[1].toLowerCase();
  if (blockedSchemes.includes(scheme)) {
    return null;
  }

  return trimmed;
}

export function appendQueryParam(url, key, value) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

export function signOAuthState(payload) {
  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error('OAuth state secret not configured');
  }

  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyOAuthState(state) {
  if (!state || typeof state !== 'string') {
    return null;
  }

  const [data, signature] = state.split('.');
  if (!data || !signature) {
    return null;
  }

  const secret = getOAuthStateSecret();
  if (!secret) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload?.n || !payload?.t) {
      return null;
    }

    if (Date.now() - payload.t > STATE_MAX_AGE_MS) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) {
    return {};
  }

  return header.split(';').reduce((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) {
      return cookies;
    }
    cookies[rawKey] = decodeURIComponent(rawValue.join('='));
    return cookies;
  }, {});
}

export function buildOAuthCookie(name, value, req) {
  const secure = (req.headers['x-forwarded-proto'] || 'https') === 'https';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/api/google/oauth',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${OAUTH_COOKIE_MAX_AGE}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function clearOAuthCookie(name, req) {
  const secure = (req.headers['x-forwarded-proto'] || 'https') === 'https';
  const parts = [
    `${name}=`,
    'Path=/api/google/oauth',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export async function resolveUserIdFromAccessToken(accessToken) {
  if (!accessToken) {
    return null;
  }

  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service role not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function exchangeCodeForToken(code, redirectUri) {
  const { clientId, clientSecret } = getGoogleCredentials();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown_error' }));
    const message = error.error_description || error.error || 'Token exchange failed';
    const err = new Error(message);
    err.code = error.error || 'token_exchange_failed';
    throw err;
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };
}

export async function saveGoogleTokensToSupabase(userId, tokens) {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase service role not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase.from('google_calendar_tokens').upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw error;
  }
}

export function getWebDashboardUrl(req) {
  const configuredOrigin = process.env.WEB_APP_URL?.replace(/\/$/, '');
  const origin = configuredOrigin || getRequestOrigin(req);
  return `${origin}/?google_calendar=connected`;
}

export function buildFinalRedirectUrl(returnTo, status, message) {
  if (returnTo) {
    let url = appendQueryParam(returnTo, 'status', status);
    if (message) {
      url = appendQueryParam(url, 'message', message);
    }
    return url;
  }

  return null;
}
