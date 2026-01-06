// API Route para obtener la configuración de Google OAuth
// Solo expone el Client ID (el secret nunca se expone)

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener Client ID del servidor (sin VITE_ para que no se exponga)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return res.status(500).json({ 
      error: 'Google Client ID no configurado',
      message: 'Por favor, configura GOOGLE_CLIENT_ID en las variables de entorno de Vercel.'
    });
  }

  // Solo devolver el Client ID (nunca el secret)
  return res.status(200).json({ 
    client_id: clientId 
  });
}

