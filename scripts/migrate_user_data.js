/**
 * Script de Migración de Datos Existentes a Encriptación
 * 
 * Este script encripta los datos existentes de un usuario específico en Supabase.
 * 
 * USO DESDE LA CONSOLA DEL NAVEGADOR:
 * 1. Abre la consola del navegador (F12)
 * 2. Asegúrate de estar logueado como el usuario que quieres migrar
 * 3. Copia y pega este script completo
 * 4. Ejecuta: migrateUserData('CONTRASEÑA_DE_ENCRIPTACION')
 * 
 * IMPORTANTE:
 * - Asegúrate de tener la contraseña de encriptación correcta
 * - Este script actualizará los datos en Supabase
 * - Solo migra datos que NO estén ya encriptados
 * - Haz un backup antes de ejecutar si es necesario
 */

async function migrateUserData(encryptionPassword) {
  // Importar servicios (ajusta las rutas según tu estructura)
  const { supabaseService } = await import('../services/supabaseService.js');
  const { encryptionService } = await import('../services/encryptionService.js');
  
  // Obtener el usuario actual
  const session = await supabaseService.getSession();
  if (!session?.user) {
    throw new Error('No hay usuario logueado. Por favor, inicia sesión primero.');
  }
  
  const userId = session.user.id;
  console.log('🚀 Iniciando migración de datos para usuario:', userId);
  
  try {
    // Establecer la contraseña de encriptación
    supabaseService.setEncryptionPassword(encryptionPassword);
    
    // 1. Migrar entradas del diario
    console.log('\n📝 Migrando entradas del diario...');
    const journalEntries = await supabaseService.getJournalEntries(userId);
    let journalCount = 0;
    let journalSkipped = 0;
    
    for (const entry of journalEntries) {
      // Verificar si ya está encriptado
      const isContentEncrypted = supabaseService.isEncrypted(entry.content);
      const arePhotosEncrypted = entry.photos?.every(photo => 
        !photo || supabaseService.isEncrypted(photo)
      ) ?? true;
      
      if (isContentEncrypted && arePhotosEncrypted) {
        journalSkipped++;
        continue;
      }
      
      // Encriptar y actualizar
      try {
        await supabaseService.updateJournalEntry(userId, entry.id, {
          content: entry.content,
          photos: entry.photos || [],
        });
        journalCount++;
        console.log(`  ✅ Entrada ${entry.id.substring(0, 8)}... migrada`);
      } catch (error) {
        console.error(`  ❌ Error migrando entrada ${entry.id}:`, error);
      }
    }
    console.log(`  📊 Total: ${journalCount} migradas, ${journalSkipped} ya encriptadas`);
    
    // 2. Migrar eventos del calendario
    console.log('\n📅 Migrando eventos del calendario...');
    const calendarEvents = await supabaseService.getCalendarEvents(userId);
    let calendarCount = 0;
    let calendarSkipped = 0;
    
    for (const event of calendarEvents) {
      // Verificar si ya está encriptado
      if (supabaseService.isEncrypted(event.description)) {
        calendarSkipped++;
        continue;
      }
      
      // Encriptar y actualizar
      try {
        await supabaseService.updateCalendarEvent(userId, event.id, {
          description: event.description || '',
        });
        calendarCount++;
        console.log(`  ✅ Evento ${event.id.substring(0, 8)}... migrado`);
      } catch (error) {
        console.error(`  ❌ Error migrando evento ${event.id}:`, error);
      }
    }
    console.log(`  📊 Total: ${calendarCount} migrados, ${calendarSkipped} ya encriptados`);
    
    // 3. Migrar transacciones de Balanza Pro
    console.log('\n💰 Migrando transacciones de Balanza Pro...');
    const balanzaTransactions = await supabaseService.getBalanzaProTransactions(userId);
    let balanzaCount = 0;
    let balanzaSkipped = 0;
    
    for (const transaction of balanzaTransactions) {
      // Verificar si ya está encriptado
      const isDescriptionEncrypted = !transaction.description || 
        supabaseService.isEncrypted(transaction.description);
      const areTagsEncrypted = !transaction.tags || 
        transaction.tags.every(tag => !tag || supabaseService.isEncrypted(tag));
      
      if (isDescriptionEncrypted && areTagsEncrypted) {
        balanzaSkipped++;
        continue;
      }
      
      // Encriptar y actualizar
      try {
        await supabaseService.updateBalanzaProTransaction(userId, transaction.id, {
          description: transaction.description || '',
          tags: transaction.tags || [],
        });
        balanzaCount++;
        console.log(`  ✅ Transacción ${transaction.id.substring(0, 8)}... migrada`);
      } catch (error) {
        console.error(`  ❌ Error migrando transacción ${transaction.id}:`, error);
      }
    }
    console.log(`  📊 Total: ${balanzaCount} migradas, ${balanzaSkipped} ya encriptadas`);
    
    // 4. Migrar configuración de seguridad (PIN)
    console.log('\n🔒 Migrando configuración de seguridad (PIN)...');
    try {
      const securityConfig = await supabaseService.getSecurityConfig(userId);
      if (securityConfig && securityConfig.security_pin) {
        // Verificar si ya está encriptado
        if (supabaseService.isEncrypted(securityConfig.security_pin)) {
          console.log('  ⏭️  PIN ya está encriptado, saltando...');
        } else {
          // Encriptar y actualizar
          await supabaseService.updateSecurityConfig(userId, {
            security_pin: securityConfig.security_pin,
          });
          console.log('  ✅ PIN migrado');
        }
      } else {
        console.log('  ⏭️  No hay PIN configurado');
      }
    } catch (error) {
      console.error('  ❌ Error migrando configuración de seguridad:', error);
    }
    
    // Resumen final
    console.log('\n✨ Migración completada!');
    console.log('📊 Resumen:');
    console.log(`   - Entradas del diario: ${journalCount} migradas`);
    console.log(`   - Eventos del calendario: ${calendarCount} migrados`);
    console.log(`   - Transacciones Balanza Pro: ${balanzaCount} migradas`);
    console.log('\n✅ Todos los datos han sido encriptados correctamente.');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    // Limpiar la contraseña de memoria
    supabaseService.clearEncryptionPassword();
  }
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  window.migrateUserData = migrateUserData;
  console.log('✅ Script de migración cargado. Usa: migrateUserData("tu-contraseña")');
}
