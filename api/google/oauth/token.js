// API Route para intercambiar código OAuth por token
// Este endpoint se ejecuta en el servidor, por lo que el Client Secret nunca se expone al cliente

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirect_uri } = req.body;

  if (!code || !redirect_uri) {
    return res.status(400).json({ 
      error: 'Parámetros faltantes',
      message: 'Se requieren "code" y "redirect_uri"'
    });
  }

  // Obtener credenciales del servidor (sin VITE_ para que no se expongan)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Logging para debug (solo en servidor, no se expone al cliente)
  console.log('[Google OAuth] Verificando credenciales...');
  console.log('[Google OAuth] Client ID presente:', !!clientId);
  console.log('[Google OAuth] Client ID length:', clientId?.length || 0);
  console.log('[Google OAuth] Client Secret presente:', !!clientSecret);
  console.log('[Google OAuth] Client Secret length:', clientSecret?.length || 0);

  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] Credenciales faltantes:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });
    return res.status(500).json({ 
      error: 'Credenciales no configuradas',
      message: 'Por favor, configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las variables de entorno de Vercel.',
      debug: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      }
    });
  }

  try {
    // Intercambiar código por token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      const errorMessage = error.error_description || error.error || 'Error desconocido';
      
      // Logging detallado del error
      console.error('[Google OAuth] Error de Google:', {
        status: response.status,
        error: error.error,
        error_description: error.error_description,
        redirect_uri: redirect_uri,
        clientIdPrefix: clientId?.substring(0, 20) + '...'
      });
      
      // Mensajes más descriptivos para errores comunes
      if (error.error === 'redirect_uri_mismatch') {
        return res.status(400).json({
          error: 'redirect_uri_mismatch',
          message: `La URI de redirección no coincide.\n\nURI usada: ${redirect_uri}\n\nPor favor, asegúrate de que esta URI exacta esté registrada en Google Cloud Console.`
        });
      }
      
      if (error.error === 'invalid_client' || response.status === 401) {
        return res.status(401).json({
          error: 'invalid_client',
          message: 'Client ID o Client Secret inválidos. Verifica las credenciales en Vercel.',
          details: 'Asegúrate de que:\n1. GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET estén configuradas en Vercel\n2. Las credenciales correspondan al mismo OAuth Client ID en Google Cloud Console\n3. No haya espacios extra al copiar/pegar las credenciales\n4. El Client Secret no haya sido regenerado sin actualizar Vercel'
        });
      }
      
      if (error.error === 'invalid_grant') {
        return res.status(400).json({
          error: 'invalid_grant',
          message: 'El código de autorización ha expirado o ya fue usado. Por favor, intenta conectar nuevamente.'
        });
      }
      
      return res.status(400).json({
        error: error.error || 'unknown_error',
        message: errorMessage
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
    });
  } catch (error) {
    console.error('Google OAuth Token Error:', error);
    return res.status(500).json({ 
      error: 'Error al intercambiar código por token',
      message: error.message || 'Error desconocido'
    });
  }
}

