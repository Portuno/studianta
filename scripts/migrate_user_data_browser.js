/**
 * Script de Migración de Datos - Para ejecutar en la consola del navegador
 * 
 * INSTRUCCIONES:
 * 1. Abre la aplicación en el navegador
 * 2. Inicia sesión como el usuario que quieres migrar
 * 3. Abre la consola del navegador (F12)
 * 4. Copia y pega este script completo
 * 5. Ejecuta: migrateUserData('TU_CONTRASEÑA_DE_ENCRIPTACION')
 * 
 * IMPORTANTE:
 * - Asegúrate de tener la contraseña de encriptación correcta
 * - Este script actualizará los datos en Supabase
 * - Solo migra datos que NO estén ya encriptados
 * - El script muestra el progreso en la consola
 */

// Función para migrar datos del usuario actual
async function migrateUserData(encryptionPassword) {
  if (!encryptionPassword) {
    console.error('❌ Error: Debes proporcionar la contraseña de encriptación');
    console.log('Uso: migrateUserData("tu-contraseña-de-encriptacion")');
    return;
  }
  
  try {
    // Importar el servicio (ajusta según tu estructura de imports)
    // Si usas módulos ES6, esto debería funcionar:
    const { supabaseService } = await import('/src/services/supabaseService.js');
    
    // Obtener el usuario actual
    const session = await supabaseService.getSession();
    if (!session?.user) {
      throw new Error('No hay usuario logueado. Por favor, inicia sesión primero.');
    }
    
    const userId = session.user.id;
    console.log('👤 Usuario:', userId);
    console.log('🔐 Iniciando migración...\n');
    
    // Ejecutar la migración
    const results = await supabaseService.migrateUserData(userId, encryptionPassword);
    
    console.log('\n✅ ¡Migración completada exitosamente!');
    console.log('📊 Resultados:', results);
    
    return results;
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  window.migrateUserData = migrateUserData;
  console.log('✅ Script de migración cargado.');
  console.log('📝 Usa: migrateUserData("tu-contraseña-de-encriptacion")');
  console.log('⚠️  Asegúrate de estar logueado como el usuario que quieres migrar');
}
