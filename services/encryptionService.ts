/**
 * Servicio de Encriptación Client-Side
 * 
 * Usa Web Crypto API para encriptar/desencriptar datos sensibles antes de guardarlos en Supabase.
 * La clave se deriva de la contraseña del usuario usando PBKDF2, permitiendo acceso multidispositivo.
 */

import { supabase } from './supabaseService';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits para AES-GCM
const SALT_LENGTH = 32; // 256 bits
const PBKDF2_ITERATIONS = 100000; // Número de iteraciones para PBKDF2

// Salt fijo para derivar clave desde userId (para almacenar contraseña en Supabase)
// Este salt es público y está en el código, pero combinado con userId único proporciona seguridad
const USER_ID_ENCRYPTION_SALT = 'studianta-encryption-password-storage-salt-v1';

interface EncryptionResult {
  encrypted: string;
  iv: string;
}

interface DecryptionResult {
  decrypted: string;
}

export class EncryptionService {
  private keyCache: Map<string, CryptoKey> = new Map();
  private saltCache: Map<string, string> = new Map();

  /**
   * Obtiene o crea el salt del usuario desde Supabase
   */
  async getOrCreateSalt(userId: string): Promise<string> {
    // Verificar cache primero
    if (this.saltCache.has(userId)) {
      return this.saltCache.get(userId)!;
    }

    try {
      // Intentar obtener salt existente
      const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('salt')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Error diferente a "no encontrado"
        throw error;
      }

      if (data?.salt) {
        this.saltCache.set(userId, data.salt);
        return data.salt;
      }

      // Crear nuevo salt
      const saltArray = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      const salt = this.arrayBufferToBase64(saltArray);

      // Guardar en Supabase
      const { error: insertError } = await supabase
        .from('user_encryption_keys')
        .insert({
          user_id: userId,
          salt: salt,
        });

      if (insertError) {
        throw insertError;
      }

      this.saltCache.set(userId, salt);
      return salt;
    } catch (error: any) {
      console.error('Error getting/creating salt:', error);
      throw new Error('No se pudo obtener o crear el salt de encriptación');
    }
  }

  /**
   * Deriva una clave de encriptación desde la contraseña del usuario
   */
  async deriveKey(password: string, userId: string): Promise<CryptoKey> {
    const cacheKey = `${userId}:${password}`;
    
    // Verificar cache
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    try {
      // Obtener salt
      const saltBase64 = await this.getOrCreateSalt(userId);
      const salt = this.base64ToArrayBuffer(saltBase64);

      // Convertir contraseña a ArrayBuffer
      const passwordBuffer = new TextEncoder().encode(password);

      // Importar la contraseña como clave para PBKDF2
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derivar clave usando PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        passwordKey,
        {
          name: ALGORITHM,
          length: KEY_LENGTH,
        },
        false, // no exportable
        ['encrypt', 'decrypt']
      );

      // Guardar en cache
      this.keyCache.set(cacheKey, derivedKey);
      return derivedKey;
    } catch (error: any) {
      console.error('Error deriving key:', error);
      throw new Error('No se pudo derivar la clave de encriptación');
    }
  }

  /**
   * Encripta un texto usando AES-GCM
   */
  async encrypt(text: string, password: string, userId: string): Promise<string> {
    if (!text) return text; // No encriptar strings vacíos

    try {
      const key = await this.deriveKey(password, userId);
      
      // Generar IV aleatorio
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      
      // Convertir texto a ArrayBuffer
      const textBuffer = new TextEncoder().encode(text);

      // Encriptar
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv: iv,
        },
        key,
        textBuffer
      );

      // Combinar IV + datos encriptados y convertir a base64
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return this.arrayBufferToBase64(combined);
    } catch (error: any) {
      console.error('Error encrypting:', error);
      throw new Error('No se pudo encriptar el texto');
    }
  }

  /**
   * Desencripta un texto encriptado
   */
  async decrypt(encryptedText: string, password: string, userId: string): Promise<string> {
    if (!encryptedText) return encryptedText; // No desencriptar strings vacíos

    try {
      const key = await this.deriveKey(password, userId);
      
      // Convertir de base64 a ArrayBuffer
      const combined = this.base64ToArrayBuffer(encryptedText);
      
      // Extraer IV y datos encriptados
      const iv = combined.slice(0, IV_LENGTH);
      const encryptedData = combined.slice(IV_LENGTH);

      // Desencriptar
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv,
        },
        key,
        encryptedData
      );

      // Convertir a texto
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error: any) {
      console.error('Error decrypting:', error);
      throw new Error('No se pudo desencriptar el texto');
    }
  }

  /**
   * Encripta un array de strings
   */
  async encryptArray(items: string[] | null | undefined, password: string, userId: string): Promise<string[] | null> {
    if (!items || items.length === 0) return items || null;

    const encryptedItems = await Promise.all(
      items.map(item => this.encrypt(item, password, userId))
    );

    return encryptedItems;
  }

  /**
   * Desencripta un array de strings encriptados
   */
  async decryptArray(encryptedItems: string[] | null | undefined, password: string, userId: string): Promise<string[] | null> {
    if (!encryptedItems || encryptedItems.length === 0) return encryptedItems || null;

    const decryptedItems = await Promise.all(
      encryptedItems.map(item => this.decrypt(item, password, userId))
    );

    return decryptedItems;
  }

  /**
   * Limpia el cache de claves (útil para logout)
   */
  clearCache(): void {
    this.keyCache.clear();
    this.saltCache.clear();
  }

  /**
   * Limpia el cache de un usuario específico
   */
  clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.keyCache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.keyCache.delete(key));
    this.saltCache.delete(userId);
  }

  /**
   * Deriva una clave desde el userId para encriptar/desencriptar la contraseña de encriptación
   * Esta clave se usa para almacenar la contraseña de forma segura en Supabase
   */
  async deriveKeyFromUserId(userId: string): Promise<CryptoKey> {
    const cacheKey = `userId-key:${userId}`;
    
    // Verificar cache
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    try {
      // Convertir userId a ArrayBuffer
      const userIdBuffer = new TextEncoder().encode(userId);
      const saltBuffer = new TextEncoder().encode(USER_ID_ENCRYPTION_SALT);

      // Importar el userId como clave para PBKDF2
      const userIdKey = await crypto.subtle.importKey(
        'raw',
        userIdBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derivar clave usando PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        userIdKey,
        {
          name: ALGORITHM,
          length: KEY_LENGTH,
        },
        false, // no exportable
        ['encrypt', 'decrypt']
      );

      // Guardar en cache
      this.keyCache.set(cacheKey, derivedKey);
      return derivedKey;
    } catch (error: any) {
      console.error('Error deriving key from userId:', error);
      throw new Error('No se pudo derivar la clave desde userId');
    }
  }

  /**
   * Encripta un texto usando una clave derivada del userId
   * Se usa para almacenar la contraseña de encriptación en Supabase
   */
  async encryptWithUserId(text: string, userId: string): Promise<string> {
    if (!text) return text;

    try {
      const key = await this.deriveKeyFromUserId(userId);
      
      // Generar IV aleatorio
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      
      // Convertir texto a ArrayBuffer
      const textBuffer = new TextEncoder().encode(text);

      // Encriptar
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv: iv,
        },
        key,
        textBuffer
      );

      // Combinar IV + datos encriptados y convertir a base64
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return this.arrayBufferToBase64(combined);
    } catch (error: any) {
      console.error('Error encrypting with userId:', error);
      throw new Error('No se pudo encriptar el texto');
    }
  }

  /**
   * Desencripta un texto encriptado usando una clave derivada del userId
   * Se usa para recuperar la contraseña de encriptación desde Supabase
   */
  async decryptWithUserId(encryptedText: string, userId: string): Promise<string> {
    if (!encryptedText) return encryptedText;

    try {
      const key = await this.deriveKeyFromUserId(userId);
      
      // Convertir de base64 a ArrayBuffer
      const combined = this.base64ToArrayBuffer(encryptedText);
      
      // Extraer IV y datos encriptados
      const iv = combined.slice(0, IV_LENGTH);
      const encryptedData = combined.slice(IV_LENGTH);

      // Desencriptar
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv,
        },
        key,
        encryptedData
      );

      // Convertir a texto
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error: any) {
      console.error('Error decrypting with userId:', error);
      throw new Error('No se pudo desencriptar el texto');
    }
  }

  // Utilidades para conversión de formatos

  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export const encryptionService = new EncryptionService();
