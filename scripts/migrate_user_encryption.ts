/**
 * Script de Migración de Datos Existentes a Encriptación
 * 
 * Este script encripta los datos existentes de un usuario específico.
 * 
 * USO:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este script completo
 * 3. Ejecuta: migrateUserData('USER_ID_AQUI', 'CONTRASEÑA_DE_ENCRIPTACION')
 * 
 * IMPORTANTE:
 * - Asegúrate de tener la contraseña de encriptación correcta
 * - Este script actualizará los datos en Supabase
 * - Haz un backup antes de ejecutar si es necesario
 */

import { supabaseService } from '../services/supabaseService';
import { encryptionService } from '../services/encryptionService';

export async function migrateUserData(userId: string, encryptionPassword: string) {
  console.log('🚀 Iniciando migración de datos para usuario:', userId);
  
  try {
    // Establecer la contraseña de encriptación en el servicio
    supabaseService.setEncryptionPassword(encryptionPassword);
    
    // 1. Migrar entradas del diario
    console.log('📝 Migrando entradas del diario...');
    const journalEntries = await supabaseService.getJournalEntries(userId);
    let journalCount = 0;
    
    for (const entry of journalEntries) {
      // Verificar si ya está encriptado
      if (supabaseService.isEncrypted(entry.content)) {
        console.log(`  ⏭️  Entrada ${entry.id} ya está encriptada, saltando...`);
        continue;
      }
      
      // Encriptar y actualizar
      try {
        await supabaseService.updateJournalEntry(userId, entry.id, {
          content: entry.content,
          photos: entry.photos || [],
        });
        journalCount++;
        console.log(`  ✅ Entrada ${entry.id} migrada`);
      } catch (error) {
        console.error(`  ❌ Error migrando entrada ${entry.id}:`, error);
      }
    }
    
    // 2. Migrar eventos del calendario
    console.log('📅 Migrando eventos del calendario...');
    const calendarEvents = await supabaseService.getCalendarEvents(userId);
    let calendarCount = 0;
    
    for (const event of calendarEvents) {
      // Verificar si ya está encriptado
      if (supabaseService.isEncrypted(event.description)) {
        console.log(`  ⏭️  Evento ${event.id} ya está encriptado, saltando...`);
        continue;
      }
      
      // Encriptar y actualizar
      try {
        await supabaseService.updateCalendarEvent(userId, event.id, {
          description: event.description || '',
        });
        calendarCount++;
        console.log(`  ✅ Evento ${event.id} migrado`);
      } catch (error) {
        console.error(`  ❌ Error migrando evento ${event.id}:`, error);
      }
    }
    
    // 3. Migrar transacciones de Balanza Pro
    console.log('💰 Migrando transacciones de Balanza Pro...');
    const balanzaTransactions = await supabaseService.getBalanzaProTransactions(userId);
    let balanzaCount = 0;
    
    for (const transaction of balanzaTransactions) {
      // Verificar si ya está encriptado
      const needsEncryption = 
        (transaction.description && !supabaseService.isEncrypted(transaction.description)) ||
        (transaction.tags && transaction.tags.some((tag: string) => !supabaseService.isEncrypted(tag)));
      
      if (!needsEncryption) {
        console.log(`  ⏭️  Transacción ${transaction.id} ya está encriptada, saltando...`);
        continue;
      }
      
      // Encriptar y actualizar
      try {
        await supabaseService.updateBalanzaProTransaction(userId, transaction.id, {
          description: transaction.description || '',
          tags: transaction.tags || [],
        });
        balanzaCount++;
        console.log(`  ✅ Transacción ${transaction.id} migrada`);
      } catch (error) {
        console.error(`  ❌ Error migrando transacción ${transaction.id}:`, error);
      }
    }
    
    // 4. Migrar configuración de seguridad (PIN)
    console.log('🔒 Migrando configuración de seguridad...');
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
    
    // Resumen
    console.log('\n✨ Migración completada!');
    console.log(`📊 Resumen:`);
    console.log(`   - Entradas del diario: ${journalCount} migradas`);
    console.log(`   - Eventos del calendario: ${calendarCount} migrados`);
    console.log(`   - Transacciones Balanza Pro: ${balanzaCount} migradas`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    // Limpiar la contraseña de memoria
    supabaseService.clearEncryptionPassword();
  }
}

// Función helper para ejecutar desde la consola del navegador
// Ejemplo: window.migrateUserData('user-id-here', 'password-here')
if (typeof window !== 'undefined') {
  (window as any).migrateUserData = migrateUserData;
}
