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

  // Validar formato básico
  const clientIdPattern = /^[\d]+-[\w]+\.apps\.googleusercontent\.com$/;
  const clientSecretPattern = /^GOCSPX-[\w-]+$/;
  
  const clientIdValid = clientId ? clientIdPattern.test(clientId) : false;
  const clientSecretValid = clientSecret ? clientSecretPattern.test(clientSecret) : false;

  // Verificar espacios al inicio o final
  const clientIdHasSpaces = clientId ? (clientId !== clientId.trim()) : false;
  const clientSecretHasSpaces = clientSecret ? (clientSecret !== clientSecret.trim()) : false;

  // NO exponer el secret completo, solo indicar si está presente
  return res.status(200).json({
    hasClientId: !!clientId,
    clientIdLength: clientId?.length || 0,
    clientIdPrefix: clientId ? clientId.substring(0, 30) + '...' : null,
    clientIdValid: clientIdValid,
    clientIdHasSpaces: clientIdHasSpaces,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length || 0,
    clientSecretPrefix: clientSecret ? clientSecret.substring(0, 15) + '...' : null,
    clientSecretValid: clientSecretValid,
    clientSecretHasSpaces: clientSecretHasSpaces,
    allValid: clientId && clientSecret && clientIdValid && clientSecretValid && !clientIdHasSpaces && !clientSecretHasSpaces,
    message: clientId && clientSecret && clientIdValid && clientSecretValid && !clientIdHasSpaces && !clientSecretHasSpaces
      ? '✅ Credenciales configuradas correctamente' 
      : '❌ Faltan credenciales o tienen problemas de formato. Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vercel.',
    issues: [
      !clientId && '❌ GOOGLE_CLIENT_ID no está configurado',
      !clientSecret && '❌ GOOGLE_CLIENT_SECRET no está configurado',
      clientId && !clientIdValid && '⚠️ GOOGLE_CLIENT_ID tiene formato inválido (debe ser: número-string.apps.googleusercontent.com)',
      clientSecret && !clientSecretValid && '⚠️ GOOGLE_CLIENT_SECRET tiene formato inválido (debe comenzar con: GOCSPX-)',
      clientIdHasSpaces && '⚠️ GOOGLE_CLIENT_ID tiene espacios al inicio o final',
      clientSecretHasSpaces && '⚠️ GOOGLE_CLIENT_SECRET tiene espacios al inicio o final'
    ].filter(Boolean)
  });
}

