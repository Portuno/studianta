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
  console.log('[Google OAuth] Client ID prefix:', clientId ? clientId.substring(0, 20) + '...' : 'N/A');
  console.log('[Google OAuth] Client Secret presente:', !!clientSecret);
  console.log('[Google OAuth] Client Secret length:', clientSecret?.length || 0);
  console.log('[Google OAuth] Client Secret prefix:', clientSecret ? clientSecret.substring(0, 15) + '...' : 'N/A');
  console.log('[Google OAuth] Client Secret primer carácter:', clientSecret ? `"${clientSecret[0]}" (código: ${clientSecret.charCodeAt(0)})` : 'N/A');

  // Validar que las credenciales existan
  if (!clientId || !clientSecret) {
    console.error('[Google OAuth] Credenciales faltantes:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0
    });
    return res.status(500).json({ 
      error: 'Credenciales no configuradas',
      message: 'Por favor, configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las variables de entorno de Vercel.',
      debug: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId?.length || 0,
        clientSecretLength: clientSecret?.length || 0
      },
      instructions: [
        '1. Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables',
        '2. Añade GOOGLE_CLIENT_ID (sin prefijo VITE_)',
        '3. Añade GOOGLE_CLIENT_SECRET (sin prefijo VITE_)',
        '4. Asegúrate de que estén disponibles para Production',
        '5. Haz redeploy del proyecto'
      ]
    });
  }

  // Limpiar credenciales: eliminar espacios y caracteres extra comunes
  let finalClientId = clientId.trim();
  let finalClientSecret = clientSecret.trim();
  
  // Detectar y limpiar caracteres extra al inicio del Client Secret
  // Los Client Secrets de Google suelen comenzar con "GOCSPX-" o similar
  // Si hay un guion o espacio extra al inicio, eliminarlo
  if (finalClientSecret && !finalClientSecret.match(/^[A-Z0-9]/)) {
    const originalSecret = finalClientSecret;
    // Eliminar caracteres no alfanuméricos al inicio (guiones, espacios, etc.)
    finalClientSecret = finalClientSecret.replace(/^[^A-Z0-9]+/, '');
    
    if (originalSecret !== finalClientSecret) {
      console.warn('[Google OAuth] ⚠️ Caracteres extra detectados al inicio del Client Secret');
      console.warn('[Google OAuth] Original:', originalSecret.substring(0, 20) + '...');
      console.warn('[Google OAuth] Limpiado:', finalClientSecret.substring(0, 20) + '...');
      console.warn('[Google OAuth] ⚠️ IMPORTANTE: Verifica que el Client Secret en Vercel no tenga caracteres extra al inicio o final');
    }
  }
  
  // Detectar espacios o caracteres extra
  if (clientId !== finalClientId || clientSecret !== finalClientSecret) {
    console.warn('[Google OAuth] Credenciales limpiadas (se eliminaron espacios o caracteres extra)');
  }
  
  // Logging final de las credenciales que se usarán
  console.log('[Google OAuth] Credenciales finales a usar:');
  console.log('[Google OAuth] Client ID:', finalClientId.substring(0, 30) + '...');
  console.log('[Google OAuth] Client Secret:', finalClientSecret.substring(0, 15) + '...');

  try {
    // Intercambiar código por token (usando credenciales ya limpiadas)
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: finalClientId,
        client_secret: finalClientSecret,
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
        console.error('[Google OAuth] Error invalid_client:', {
          status: response.status,
          error: error.error,
          error_description: error.error_description,
          clientIdPrefix: finalClientId?.substring(0, 20) + '...',
          clientSecretPrefix: finalClientSecret?.substring(0, 15) + '...',
          redirect_uri: redirect_uri,
          originalClientSecretPrefix: clientSecret?.substring(0, 15) + '...'
        });
        
        // Detectar si había caracteres extra
        const hadExtraChars = clientSecret && clientSecret.trim() !== finalClientSecret;
        
        return res.status(401).json({
          error: 'invalid_client',
          message: 'Client ID o Client Secret inválidos. Verifica las credenciales en Vercel.',
          details: 'Asegúrate de que:\n1. GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET estén configuradas en Vercel\n2. Las credenciales correspondan al mismo OAuth Client ID en Google Cloud Console\n3. No haya espacios o caracteres extra (como guiones) al inicio o final de las credenciales\n4. El Client Secret no haya sido regenerado sin actualizar Vercel',
          warning: hadExtraChars ? '⚠️ Se detectaron caracteres extra en el Client Secret. Verifica que en Vercel no haya guiones, espacios u otros caracteres al inicio o final.' : null,
          troubleshooting: [
            '1. Ve a Vercel Dashboard → Settings → Environment Variables',
            '2. Edita GOOGLE_CLIENT_SECRET y verifica que NO tenga caracteres extra al inicio o final',
            '3. El Client Secret debe comenzar directamente con "GOCSPX-" (sin espacios ni guiones antes)',
            '4. Compara el Client ID en Vercel con el de Google Cloud Console (deben ser idénticos)',
            '5. Si regeneraste el Client Secret en Google Cloud Console, actualízalo en Vercel',
            '6. Haz redeploy después de actualizar las variables',
            '7. Usa el endpoint /api/google/oauth/debug para verificar que las variables estén disponibles'
          ]
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

