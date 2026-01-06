// API Route para refrescar tokens de Google OAuth
// Este endpoint se ejecuta en el servidor, por lo que el Client Secret nunca se expone al cliente

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ 
      error: 'Refresh token faltante',
      message: 'Se requiere "refresh_token"'
    });
  }

  // Obtener credenciales del servidor (sin VITE_ para que no se expongan)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ 
      error: 'Credenciales no configuradas',
      message: 'Por favor, configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las variables de entorno de Vercel.'
    });
  }

  try {
    // Refrescar token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      const errorMessage = error.error_description || error.error || 'Error desconocido';
      
      return res.status(400).json({
        error: error.error || 'unknown_error',
        message: errorMessage
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
    });
  } catch (error) {
    console.error('Google OAuth Refresh Error:', error);
    return res.status(500).json({ 
      error: 'Error al refrescar token',
      message: error.message || 'Error desconocido'
    });
  }
}

