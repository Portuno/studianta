// Endpoint de debug para verificar que las variables de entorno estén disponibles
// SOLO PARA DESARROLLO - Eliminar o proteger en producción

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que las variables estén disponibles
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // NO exponer el secret completo, solo indicar si está presente
  return res.status(200).json({
    hasClientId: !!clientId,
    clientIdLength: clientId?.length || 0,
    clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : null,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length || 0,
    clientSecretPrefix: clientSecret ? clientSecret.substring(0, 10) + '...' : null,
    message: clientId && clientSecret 
      ? 'Credenciales configuradas correctamente' 
      : 'Faltan credenciales. Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vercel.'
  });
}

