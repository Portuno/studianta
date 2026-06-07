import {
  GOOGLE_SCOPE,
  buildOAuthCookie,
  generateNonce,
  getCallbackRedirectUri,
  getGoogleCredentials,
  resolveUserIdFromAccessToken,
  signOAuthState,
  validateReturnTo,
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId } = getGoogleCredentials();
  if (!clientId) {
    return res.status(500).json({
      error: 'Credenciales no configuradas',
      message: 'Configura GOOGLE_CLIENT_ID en las variables de entorno.',
    });
  }

  const returnTo = validateReturnTo(req.query.return_to);
  const accessToken =
    req.query.access_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  let userId = null;
  if (accessToken) {
    try {
      userId = await resolveUserIdFromAccessToken(accessToken);
      if (!userId) {
        return res.status(401).json({
          error: 'invalid_access_token',
          message: 'No se pudo validar la sesión de Supabase.',
        });
      }
    } catch (error) {
      console.error('[Google OAuth Start] Error validating access token:', error);
      return res.status(500).json({
        error: 'supabase_not_configured',
        message: 'Supabase no está configurado para validar la sesión del usuario.',
      });
    }
  }

  let signedState;
  try {
    signedState = signOAuthState({
      n: generateNonce(),
      t: Date.now(),
      ...(returnTo ? { rt: returnTo } : {}),
      ...(userId ? { uid: userId } : {}),
    });
  } catch (error) {
    console.error('[Google OAuth Start] Error signing state:', error);
    return res.status(500).json({
      error: 'state_secret_missing',
      message: 'Configura GOOGLE_OAUTH_STATE_SECRET o GOOGLE_CLIENT_SECRET.',
    });
  }

  const redirectUri = getCallbackRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: signedState,
  });

  const cookies = [buildOAuthCookie('google_oauth_state', signedState, req)];

  if (returnTo) {
    cookies.push(buildOAuthCookie('google_oauth_return_to', returnTo, req));
  }

  if (userId) {
    cookies.push(buildOAuthCookie('google_oauth_user_id', userId, req));
  }

  res.setHeader('Set-Cookie', cookies);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(302, googleAuthUrl);
}
