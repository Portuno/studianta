import {
  appendQueryParam,
  buildFinalRedirectUrl,
  clearOAuthCookie,
  exchangeCodeForToken,
  getCallbackRedirectUri,
  getWebDashboardUrl,
  parseCookies,
  saveGoogleTokensToSupabase,
  verifyOAuthState,
} from './_lib.js';

function redirectWithCleanup(res, req, url) {
  res.setHeader('Set-Cookie', [
    clearOAuthCookie('google_oauth_state', req),
    clearOAuthCookie('google_oauth_return_to', req),
    clearOAuthCookie('google_oauth_user_id', req),
  ]);
  return res.redirect(302, url);
}

function resolveOAuthContext(req, stateFromQuery) {
  const cookies = parseCookies(req);
  const statePayload = verifyOAuthState(stateFromQuery);

  if (!statePayload) {
    return { error: 'invalid_state' };
  }

  if (cookies.google_oauth_state && cookies.google_oauth_state !== stateFromQuery) {
    return { error: 'state_mismatch' };
  }

  const returnTo = statePayload.rt || cookies.google_oauth_return_to || null;
  const userId = statePayload.uid || cookies.google_oauth_user_id || null;

  return { returnTo, userId };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: googleError, error_description: googleErrorDescription } = req.query;

  const cookies = parseCookies(req);
  const fallbackReturnTo = cookies.google_oauth_return_to || null;

  if (googleError) {
    const message = googleErrorDescription || googleError;
    const redirectUrl =
      buildFinalRedirectUrl(fallbackReturnTo, 'error', message) ||
      appendQueryParam(getWebDashboardUrl(req), 'google_calendar', 'error');
    return redirectWithCleanup(res, req, redirectUrl);
  }

  if (!code || !state) {
    return res.status(400).json({
      error: 'missing_parameters',
      message: 'Faltan los parámetros "code" o "state" de Google OAuth.',
    });
  }

  const context = resolveOAuthContext(req, state);
  if (context.error) {
    const redirectUrl =
      buildFinalRedirectUrl(fallbackReturnTo, 'error', context.error) ||
      appendQueryParam(getWebDashboardUrl(req), 'google_calendar', 'error');
    return redirectWithCleanup(res, req, redirectUrl);
  }

  const { returnTo, userId } = context;

  if (!userId) {
    const redirectUrl =
      buildFinalRedirectUrl(returnTo, 'error', 'missing_user_session') ||
      appendQueryParam(getWebDashboardUrl(req), 'google_calendar', 'error');
    return redirectWithCleanup(res, req, redirectUrl);
  }

  try {
    const redirectUri = getCallbackRedirectUri(req);
    const tokens = await exchangeCodeForToken(code, redirectUri);
    await saveGoogleTokensToSupabase(userId, tokens);

    const successRedirect =
      buildFinalRedirectUrl(returnTo, 'ok') || getWebDashboardUrl(req);

    return redirectWithCleanup(res, req, successRedirect);
  } catch (error) {
    console.error('[Google OAuth Callback] Error:', error);

    const redirectUrl =
      buildFinalRedirectUrl(returnTo, 'error', error.message || 'token_save_failed') ||
      appendQueryParam(getWebDashboardUrl(req), 'google_calendar', 'error');

    return redirectWithCleanup(res, req, redirectUrl);
  }
}
