import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Subject, Transaction, JournalEntry, CustomCalendarEvent, Module, NutritionEntry, NutritionGoals, NutritionCorrelation, NavigationConfig, NavigationModule, NavView } from '../types';
import { encryptionService } from './encryptionService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Singleton pattern para evitar múltiples instancias
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'studianta-web',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
};

export const supabase: SupabaseClient = getSupabaseClient();

// Helper function para reintentos con backoff exponencial
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Si es un error de red, intentar de nuevo
      const isNetworkError = 
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('ERR_HTTP2') ||
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('Network request failed') ||
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT';
      
      if (!isNetworkError || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Helper function para detectar errores de red
const isNetworkError = (error: any): boolean => {
  return (
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('ERR_HTTP2') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('Network request failed') ||
    error?.message?.includes('PING_FAILED') ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.name === 'TypeError'
  );
};

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  career?: string;
  institution?: string; // Renombrado de university a institution
  avatar_url?: string;
  tier?: 'Free' | 'Premium'; // Tier de suscripción
  onboarding_completed?: boolean; // Si el usuario completó el onboarding
  academic_stage?: string; // Etapa académica del usuario
  interests?: string[]; // Array de áreas de interés
  referral_source?: string; // Cómo nos conoció
  currency?: string; // Código de moneda ISO 4217 (EUR, USD, ARS, etc.)
  show_focus_annotations?: boolean; // Si el usuario quiere ver las anotaciones de enfoque en el calendario
  stripe_customer_id?: string; // ID del cliente en Stripe
  stripe_subscription_id?: string; // ID de la suscripción activa
  subscription_status?: string; // Estado: active, canceled, past_due, etc.
  subscription_current_period_end?: string; // Fecha de fin del período actual
  created_at: string;
  updated_at: string;
}

export interface SecurityConfig {
  user_id: string;
  security_pin?: string; // Hash del PIN
  biometrics_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  // Contraseña de encriptación almacenada en memoria (solo durante la sesión)
  private encryptionPassword: string | null = null;

  // ============ ENCRYPTION MANAGEMENT ============

  /**
   * Establece la contraseña de encriptación para la sesión actual
   * Debe llamarse después del login con la contraseña del usuario
   */
  setEncryptionPassword(password: string): void {
    this.encryptionPassword = password;
  }

  /**
   * Limpia la contraseña de encriptación (útil para logout)
   */
  clearEncryptionPassword(): void {
    this.encryptionPassword = null;
    encryptionService.clearCache();
  }

  /**
   * Verifica si hay una contraseña de encriptación disponible
   */
  hasEncryptionPassword(): boolean {
    return this.encryptionPassword !== null;
  }

  /**
   * Verifica si el usuario ya tiene una contraseña de encriptación configurada en Supabase
   */
  async hasEncryptionPasswordConfigured(userId: string): Promise<boolean> {
    try {
      // Usar select('*') para evitar error 406 si los campos no existen aún
      const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // No existe registro, no está configurada
        }
        // Error 406 puede indicar que los campos no existen aún
        if (error.code === 'PGRST301' || error.message?.includes('406') || (error as any).status === 406) {
          console.warn('Encryption password fields may not exist yet. Migration 30 may not have been executed.');
          return false;
        }
        console.error('Error checking encryption password config:', error);
        return false;
      }

      if (!data) {
        return false;
      }

      // Verificar si el campo existe en los datos retornados
      if (!('encryption_password_configured' in data)) {
        return false;
      }

      return data.encryption_password_configured === true;
    } catch (error) {
      console.error('Error checking encryption password config:', error);
      return false;
    }
  }

  /**
   * Guarda la contraseña de encriptación en Supabase (encriptada)
   */
  async saveEncryptionPasswordToSupabase(userId: string, password: string): Promise<void> {
    try {
      // Encriptar la contraseña usando clave derivada del userId
      const encryptedPassword = await encryptionService.encryptWithUserId(password, userId);

      // Asegurarse de que el salt existe primero (esto puede crear el registro si no existe)
      const salt = await encryptionService.getOrCreateSalt(userId);

      // Usar upsert para insertar o actualizar el registro
      // Esto evita errores de clave duplicada si el registro ya existe
      const { error: upsertError } = await supabase
        .from('user_encryption_keys')
        .upsert({
          user_id: userId,
          salt: salt,
          encrypted_password: encryptedPassword,
          encryption_password_configured: true,
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        // Si upsert falla, intentar update como fallback
        const { error: updateError } = await supabase
          .from('user_encryption_keys')
          .update({
            encrypted_password: encryptedPassword,
            encryption_password_configured: true,
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      }

      // Establecer en memoria para uso inmediato
      this.setEncryptionPassword(password);
    } catch (error: any) {
      console.error('Error saving encryption password to Supabase:', error);
      throw new Error('No se pudo guardar la contraseña de encriptación');
    }
  }

  /**
   * Carga la contraseña de encriptación desde Supabase y la establece en memoria
   */
  async loadEncryptionPasswordFromSupabase(userId: string): Promise<boolean> {
    try {
      // Primero intentar obtener todos los campos disponibles para verificar si existen los nuevos campos
      const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe registro, no hay contraseña configurada
          return false;
        }
        // Error 406 puede indicar que los campos no existen aún (migración no ejecutada)
        // o problema con RLS - retornar false silenciosamente
        if (error.code === 'PGRST301' || error.message?.includes('406') || (error as any).status === 406) {
          console.warn('Encryption password fields may not exist yet or RLS issue:', error);
          return false;
        }
        console.error('Error loading encryption password:', error);
        return false;
      }

      // Verificar si los campos existen en los datos retornados
      if (!data) {
        return false;
      }

      // Si los campos no existen en el objeto, la migración no se ha ejecutado
      if (!('encryption_password_configured' in data) || !('encrypted_password' in data)) {
        console.warn('Encryption password fields do not exist yet. Migration 30 may not have been executed.');
        return false;
      }

      if (!data.encryption_password_configured || !data.encrypted_password) {
        // No está configurada
        return false;
      }

      // Desencriptar la contraseña
      const decryptedPassword = await encryptionService.decryptWithUserId(
        data.encrypted_password,
        userId
      );

      // Establecer en memoria
      this.setEncryptionPassword(decryptedPassword);
      return true;
    } catch (error: any) {
      console.error('Error loading encryption password from Supabase:', error);
      // Si hay error al desencriptar, la contraseña puede estar corrupta
      // Retornar false para que se pida nuevamente
      return false;
    }
  }

  /**
   * Establece la contraseña de encriptación desde el usuario (y la guarda en Supabase)
   */
  async setEncryptionPasswordFromUser(userId: string, password: string): Promise<void> {
    // Guardar en Supabase (esto también la establece en memoria)
    await this.saveEncryptionPasswordToSupabase(userId, password);
  }

  /**
   * Detecta si un string está encriptado (formato base64 con IV)
   */
  isEncrypted(text: string | null | undefined): boolean {
    if (!text) return false;
    // Los datos encriptados son base64 y tienen un tamaño mínimo (IV + algunos datos)
    // Un string encriptado mínimo sería ~20 caracteres en base64
    try {
      // Intentar decodificar base64
      atob(text);
      // Si es base64 válido y tiene un tamaño razonable, asumimos que está encriptado
      // Esto no es perfecto, pero funciona para la mayoría de casos
      return text.length > 20 && /^[A-Za-z0-9+/=]+$/.test(text);
    } catch {
      return false;
    }
  }

  /**
   * Encripta un campo si hay contraseña disponible
   */
  private async encryptField(field: string | null | undefined, userId: string): Promise<string | null | undefined> {
    if (!field || !this.encryptionPassword) return field;
    try {
      return await encryptionService.encrypt(field, this.encryptionPassword, userId);
    } catch (error) {
      console.error('Error encrypting field:', error);
      return field; // Retornar sin encriptar si hay error
    }
  }

  /**
   * Desencripta un campo si está encriptado
   */
  private async decryptField(field: string | null | undefined, userId: string): Promise<string | null | undefined> {
    if (!field || !this.encryptionPassword) return field;
    if (!this.isEncrypted(field)) return field; // No está encriptado
    try {
      return await encryptionService.decrypt(field, this.encryptionPassword, userId);
    } catch (error) {
      console.error('Error decrypting field:', error);
      return field; // Retornar tal cual si hay error
    }
  }

  /**
   * Encripta un array de strings
   */
  private async encryptArray(items: string[] | null | undefined, userId: string): Promise<string[] | null | undefined> {
    if (!items || items.length === 0 || !this.encryptionPassword) return items;
    try {
      return await encryptionService.encryptArray(items, this.encryptionPassword, userId);
    } catch (error) {
      console.error('Error encrypting array:', error);
      return items;
    }
  }

  /**
   * Desencripta un array de strings
   */
  private async decryptArray(items: string[] | null | undefined, userId: string): Promise<string[] | null | undefined> {
    if (!items || items.length === 0 || !this.encryptionPassword) return items;
    try {
      return await encryptionService.decryptArray(items, this.encryptionPassword, userId);
    } catch (error) {
      console.error('Error decrypting array:', error);
      return items;
    }
  }

  // ============ AUTHENTICATION ============
  
  async signUp(email: string, password: string, fullName?: string) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase no está configurado. Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        }
      }
    });

    if (error) {
      throw error;
    }
    
    if (data.user) {
      // Crear perfil automáticamente en background (no bloquear)
      this.createProfile(data.user.id, email, fullName)
        .catch(err => {
          console.error('Error creating profile (non-blocking):', err);
          // No lanzar error, el usuario ya está registrado
        });
    }
    return data;
  }

  async signIn(email: string, password: string) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase no está configurado. Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    // Cargar contraseña de encriptación desde Supabase si está configurada
    if (data.user) {
      await this.loadEncryptionPasswordFromSupabase(data.user.id);
    }
    
    return data;
  }

  async signInWithGoogle() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase no está configurado. Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Limpiar contraseña de encriptación al cerrar sesión
    this.clearEncryptionPassword();
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        // Si no hay credenciales configuradas, retornar null
        if (!supabaseUrl || !supabaseAnonKey) {
          return null;
        }
        throw error;
      }
      return session;
    } catch (error: any) {
      // Si hay un error de conexión o credenciales faltantes, retornar null
      if (!supabaseUrl || !supabaseAnonKey) {
        return null;
      }
      throw error;
    }
  }

  // ============ PROFILE ============

  async createProfile(userId: string, email: string, fullName?: string) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName || '',
        essence: 0,
        total_essence_earned: 0,
        onboarding_completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST116') return null; // No profile found
        if (isNetworkError(error)) {
          console.warn('Network error loading profile, returning null');
          return null;
        }
        throw error;
      }
      
      if (!data) return null;
    
    // Mapear campos de la base de datos a TypeScript
      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        career: data.career,
        institution: data.institution, // Mapear institution (antes university)
        avatar_url: data.avatar_url,
        tier: data.tier || 'Free',
        onboarding_completed: data.onboarding_completed ?? false,
        academic_stage: data.academic_stage,
        interests: data.interests || [],
        referral_source: data.referral_source,
        currency: data.currency,
        stripe_customer_id: data.stripe_customer_id,
        stripe_subscription_id: data.stripe_subscription_id,
        subscription_status: data.subscription_status,
        subscription_current_period_end: data.subscription_current_period_end,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error: any) {
      if (isNetworkError(error)) {
        console.warn('Network error loading profile, returning null');
        return null;
      }
      throw error;
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const dbUpdates: any = {};
    if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
    if (updates.career !== undefined) dbUpdates.career = updates.career;
    if (updates.institution !== undefined) dbUpdates.institution = updates.institution;
    if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
    if (updates.onboarding_completed !== undefined) dbUpdates.onboarding_completed = updates.onboarding_completed;
    if (updates.academic_stage !== undefined) dbUpdates.academic_stage = updates.academic_stage;
    if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
    if (updates.referral_source !== undefined) dbUpdates.referral_source = updates.referral_source;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
    if (updates.show_focus_annotations !== undefined) dbUpdates.show_focus_annotations = updates.show_focus_annotations;

    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId)
          .select()
          .single();
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (isNetworkError(error)) {
          console.error('Network error updating profile:', error);
          throw new Error('Error de conexión. Por favor, intenta nuevamente.');
        }
        throw error;
      }
    
      // Mapear de vuelta a TypeScript
      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        career: data.career,
        institution: data.institution,
        avatar_url: data.avatar_url,
        onboarding_completed: data.onboarding_completed ?? false,
        academic_stage: data.academic_stage,
        interests: data.interests || [],
        referral_source: data.referral_source,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error: any) {
      if (isNetworkError(error)) {
        console.error('Network error updating profile:', error);
        throw new Error('Error de conexión al actualizar perfil. Por favor, intenta nuevamente.');
      }
      throw error;
    }
  }


  // ============ SUBJECTS ============

  async getSubjects(userId: string): Promise<Subject[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('subjects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table subjects not found');
          return [];
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading subjects, returning empty array');
          return [];
        }
        throw error;
      }
      if (!data) return [];
      
      // Map database fields to TypeScript types
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        career: row.career,
        professor: row.professor,
        email: row.email,
        phone: row.phone,
        room: row.room,
        aula: row.aula,
        status: row.status,
        absences: row.absences,
        maxAbsences: row.max_absences,
        grade: row.grade,
        termStart: row.term_start,
        termEnd: row.term_end,
        milestones: row.milestones || [],
        schedules: row.schedules || [],
        notes: row.notes || [],
        materials: row.materials || [],
      }));
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      throw error;
    }
  }

  async createSubject(userId: string, subject: Omit<Subject, 'id'>): Promise<Subject> {
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name: subject.name,
        career: subject.career,
        professor: subject.professor,
        email: subject.email,
        phone: subject.phone,
        room: subject.room,
        aula: subject.aula,
        status: subject.status,
        absences: subject.absences,
        max_absences: subject.maxAbsences,
        grade: subject.grade,
        term_start: subject.termStart,
        term_end: subject.termEnd,
        milestones: subject.milestones || [],
        schedules: subject.schedules || [],
        notes: subject.notes || [],
        materials: subject.materials || [],
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Map back to TypeScript type
    return {
      id: data.id,
      name: data.name,
      career: data.career,
      professor: data.professor,
      email: data.email,
      phone: data.phone,
      room: data.room,
      status: data.status,
      absences: data.absences,
      maxAbsences: data.max_absences,
      grade: data.grade,
      termStart: data.term_start,
      termEnd: data.term_end,
      milestones: data.milestones || [],
      schedules: data.schedules || [],
      notes: data.notes || [],
      materials: data.materials || [],
    };
  }

  async updateSubject(userId: string, subjectId: string, updates: Partial<Subject>): Promise<Subject> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.career !== undefined) dbUpdates.career = updates.career;
    if (updates.professor !== undefined) dbUpdates.professor = updates.professor;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.room !== undefined) dbUpdates.room = updates.room;
    if (updates.aula !== undefined) dbUpdates.aula = updates.aula;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.absences !== undefined) dbUpdates.absences = updates.absences;
    if (updates.maxAbsences !== undefined) dbUpdates.max_absences = updates.maxAbsences;
    if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
    if (updates.termStart !== undefined) dbUpdates.term_start = updates.termStart;
    if (updates.termEnd !== undefined) dbUpdates.term_end = updates.termEnd;
    if (updates.milestones !== undefined) dbUpdates.milestones = updates.milestones;
    if (updates.schedules !== undefined) dbUpdates.schedules = updates.schedules;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.materials !== undefined) dbUpdates.materials = updates.materials;

    const { data, error } = await supabase
      .from('subjects')
      .update(dbUpdates)
      .eq('id', subjectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Map back to TypeScript type
    return {
      id: data.id,
      name: data.name,
      career: data.career,
      professor: data.professor,
      email: data.email,
      phone: data.phone,
      room: data.room,
      aula: data.aula,
      status: data.status,
      absences: data.absences,
      maxAbsences: data.max_absences,
      grade: data.grade,
      termStart: data.term_start,
      termEnd: data.term_end,
      milestones: data.milestones || [],
      schedules: data.schedules || [],
      notes: data.notes || [],
      materials: data.materials || [],
    };
  }

  async deleteSubject(userId: string, subjectId: string) {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ============ TRANSACTIONS ============

  async getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        let query = supabase
          .from('transactions')
          .select('id, type, category, amount, date, description')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        
        // Agregar límite si se especifica (por defecto 100 para carga inicial)
        if (limit) {
          query = query.limit(limit);
        }
        
        const result = await query;
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table transactions not found');
          return [];
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading transactions, returning empty array');
          return [];
        }
        throw error;
      }
      if (!data) return [];
      
      return data.map((row: any) => ({
        id: row.id,
        type: row.type,
        category: row.category,
        amount: parseFloat(row.amount),
        date: row.date,
        description: row.description,
      }));
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      throw error;
    }
  }

  async createTransaction(userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      type: data.type,
      category: data.category,
      amount: parseFloat(data.amount),
      date: data.date,
      description: data.description,
    };
  }

  async updateTransaction(userId: string, transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    const dbUpdates: any = {};
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { data, error } = await supabase
      .from('transactions')
      .update(dbUpdates)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      type: data.type,
      category: data.category,
      amount: parseFloat(data.amount),
      date: data.date,
      description: data.description,
    };
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ============ JOURNAL ENTRIES ============

  async getJournalEntries(userId: string, limit?: number, includePhotos: boolean = false): Promise<JournalEntry[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        // Seleccionar campos específicos, incluyendo photos solo si se necesitan
        const selectFields = includePhotos 
          ? 'id, date, mood, content, photo, photos, is_locked, sentiment'
          : 'id, date, mood, content, is_locked, sentiment';
        
        let query = supabase
          .from('journal_entries')
          .select(selectFields)
          .eq('user_id', userId)
          .order('date', { ascending: false });
        
        // Agregar límite si se especifica (por defecto 50 para carga inicial)
        if (limit) {
          query = query.limit(limit);
        }
        
        const result = await query;
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table journal_entries not found');
          return [];
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading journal entries, returning empty array');
          return [];
        }
        throw error;
      }
      if (!data) return [];
      
      // Procesar y desencriptar cada entrada del diario
      return await Promise.all(data.map(async (row: any) => {
        // Manejar photos: si es un array con elementos, usarlo; si es null/undefined pero hay photo, convertir a array
        let photos: string[] | undefined = undefined;
        if (row.photos && Array.isArray(row.photos) && row.photos.length > 0) {
          // Filtrar valores null/undefined del array
          photos = row.photos.filter((p: any) => p && p.trim && p.trim() !== '');
        } else if (row.photo) {
          photos = [row.photo];
        }
        
        // Debug: log para ver qué datos se están recibiendo
        if (photos && photos.length > 0) {
          console.log('Entry photos loaded:', row.id, photos);
        }
        
        // Desencriptar content si está encriptado
        const decryptedContent = await this.decryptField(row.content, userId);
        
        // Desencriptar photos si están encriptados (solo las referencias, no las URLs reales)
        const decryptedPhotos = photos ? await this.decryptArray(photos, userId) : photos;
        const decryptedPhoto = row.photo ? await this.decryptField(row.photo, userId) : row.photo;

        return {
          id: row.id,
          date: row.date,
          mood: row.mood,
          content: decryptedContent || '',
          photo: decryptedPhoto, // Mantener para compatibilidad
          photos: decryptedPhotos, // Array de URLs desencriptadas
          isLocked: row.is_locked,
          sentiment: row.sentiment ? parseFloat(row.sentiment) : undefined,
        };
      }));
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      if (isNetworkError(error)) {
        console.warn('Network error loading journal entries, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async createJournalEntry(userId: string, entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    // Encriptar campos sensibles antes de insertar
    const encryptedContent = await this.encryptField(entry.content, userId);
    const encryptedPhotos = entry.photos ? await this.encryptArray(entry.photos, userId) : undefined;
    const encryptedPhoto = entry.photo ? await this.encryptField(entry.photo, userId) : undefined;

    const insertData: any = {
      date: entry.date,
      mood: entry.mood,
      content: encryptedContent,
      is_locked: entry.isLocked,
      user_id: userId,
    };
    
    // Solo incluir campos opcionales si tienen valor
    if (encryptedPhoto !== undefined) insertData.photo = encryptedPhoto;
    if (encryptedPhotos !== undefined && encryptedPhotos.length > 0) insertData.photos = encryptedPhotos;
    if (entry.sentiment !== undefined) insertData.sentiment = entry.sentiment;

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    
    // Desencriptar datos al retornar
    const decryptedContent = await this.decryptField(data.content, userId);
    const decryptedPhotos = data.photos ? await this.decryptArray(data.photos, userId) : (data.photo ? [await this.decryptField(data.photo, userId)] : undefined);
    const decryptedPhoto = data.photo ? await this.decryptField(data.photo, userId) : data.photo;

    return {
      id: data.id,
      date: data.date,
      mood: data.mood,
      content: decryptedContent || '',
      photo: decryptedPhoto,
      photos: decryptedPhotos,
      isLocked: data.is_locked,
      sentiment: data.sentiment ? parseFloat(data.sentiment) : undefined,
    };
  }

  async updateJournalEntry(userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
    if (updates.sentiment !== undefined) dbUpdates.sentiment = updates.sentiment;
    
    // Encriptar campos sensibles antes de actualizar
    if (updates.content !== undefined) {
      dbUpdates.content = await this.encryptField(updates.content, userId);
    }
    
    // Manejar photo y photos - si photos está definido, usar photos; si photo está definido, usar photo
    if (updates.photos !== undefined) {
      // Si photos es un array vacío o undefined, establecerlo como null
      const encryptedPhotos = updates.photos && updates.photos.length > 0 
        ? await this.encryptArray(updates.photos, userId) 
        : null;
      dbUpdates.photos = encryptedPhotos;
    }
    if (updates.photo !== undefined) {
      dbUpdates.photo = await this.encryptField(updates.photo, userId);
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .update(dbUpdates)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    
    // Desencriptar datos al retornar
    const decryptedContent = await this.decryptField(data.content, userId);
    const decryptedPhotos = data.photos ? await this.decryptArray(data.photos, userId) : (data.photo ? [await this.decryptField(data.photo, userId)] : undefined);
    const decryptedPhoto = data.photo ? await this.decryptField(data.photo, userId) : data.photo;

    return {
      id: data.id,
      date: data.date,
      mood: data.mood,
      content: decryptedContent || '',
      photo: decryptedPhoto,
      photos: decryptedPhotos,
      isLocked: data.is_locked,
      sentiment: data.sentiment ? parseFloat(data.sentiment) : undefined,
    };
  }

  async deleteJournalEntry(userId: string, entryId: string) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ============ CALENDAR EVENTS ============

  async getCalendarEvents(userId: string, limit?: number): Promise<CustomCalendarEvent[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        let query = supabase
          .from('calendar_events')
          .select('id, title, description, date, time, end_time, color, priority')
          .eq('user_id', userId)
          .order('date', { ascending: true });
        
        // Agregar límite si se especifica (por defecto 100 para carga inicial)
        if (limit) {
          query = query.limit(limit);
        }
        
        const result = await query;
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table calendar_events not found');
          return [];
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading calendar events, returning empty array');
          return [];
        }
        throw error;
      }
      if (!data) return [];
      
      // Desencriptar descriptions
      const decryptedEvents = await Promise.all(
        data.map(async (row: any) => {
          const decryptedDescription = await this.decryptField(row.description, userId);
          return {
            id: row.id,
            title: row.title,
            description: decryptedDescription,
            date: row.date,
            time: row.time,
            endTime: row.end_time,
            color: row.color,
            priority: row.priority,
          };
        })
      );
      
      return decryptedEvents;
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      if (isNetworkError(error)) {
        console.warn('Network error loading calendar events, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async createCalendarEvent(userId: string, event: Omit<CustomCalendarEvent, 'id'>): Promise<CustomCalendarEvent> {
    try {
      // Encriptar description antes de insertar
      const encryptedDescription = await this.encryptField(event.description, userId);
      
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('calendar_events')
          .insert({
            title: event.title,
            description: encryptedDescription,
            date: event.date,
            time: event.time,
            end_time: event.endTime,
            color: event.color,
            priority: event.priority,
            user_id: userId,
          })
          .select()
          .single();
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (isNetworkError(error)) {
          console.error('Network error creating calendar event:', error);
          throw new Error('Error de conexión al crear evento. Por favor, intenta nuevamente.');
        }
        throw error;
      }
      
      // Desencriptar description al retornar
      const decryptedDescription = await this.decryptField(data.description, userId);
      
      return {
        id: data.id,
        title: data.title,
        description: decryptedDescription,
        date: data.date,
        time: data.time,
        endTime: data.end_time,
        color: data.color,
        priority: data.priority,
      };
    } catch (error: any) {
      if (isNetworkError(error)) {
        console.error('Network error creating calendar event:', error);
        throw new Error('Error de conexión al crear evento. Por favor, intenta nuevamente.');
      }
      throw error;
    }
  }

  async updateCalendarEvent(userId: string, event: CustomCalendarEvent): Promise<CustomCalendarEvent> {
    // Encriptar description antes de actualizar
    const encryptedDescription = await this.encryptField(event.description, userId);
    
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title: event.title,
        description: encryptedDescription,
        date: event.date,
        time: event.time,
        end_time: event.endTime,
        color: event.color,
        priority: event.priority
      })
      .eq('user_id', userId)
      .eq('id', event.id)
      .select()
      .single();

    if (error) throw error;
    
    // Desencriptar description al retornar
    const decryptedDescription = await this.decryptField(data.description, userId);
    
    return {
      id: data.id,
      title: data.title,
      description: decryptedDescription,
      date: data.date,
      time: data.time,
      endTime: data.end_time,
      color: data.color,
      priority: data.priority,
    };
  }

  async deleteCalendarEvent(userId: string, eventId: string) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ============ MODULES ============

  async getModules(userId: string): Promise<Module[]> {
    // Obtener la definición de módulos desde INITIAL_MODULES
    const { INITIAL_MODULES } = await import('../constants');
    
    try {
      // Obtener los módulos del usuario desde la BD
      const { data: userModules, error } = await supabase
        .from('user_modules')
        .select('*')
        .eq('user_id', userId);

      // Si la tabla no existe, retornar módulos iniciales
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table user_modules not found, using initial modules');
          return INITIAL_MODULES;
        }
        throw error;
      }
      
      // Combinar: usar datos de BD si existen, sino usar INITIAL_MODULES
      return INITIAL_MODULES.map(module => {
        const userModule = userModules?.find((um: any) => um.id === module.id);
        return {
          ...module,
          active: userModule?.is_active ?? module.active,
          gridPosition: userModule?.grid_position ? {
            row: userModule.grid_position.row,
            col: userModule.grid_position.col
          } : undefined,
        };
      });
    } catch (error: any) {
      // Si hay cualquier error, retornar módulos iniciales
      console.warn('Error loading modules, using initial modules:', error);
      return INITIAL_MODULES;
    }
  }

  async updateModule(userId: string, moduleId: string, updates: Partial<Module>): Promise<Module> {
    const { INITIAL_MODULES } = await import('../constants');
    const moduleDef = INITIAL_MODULES.find(m => m.id === moduleId);
    
    if (!moduleDef) {
      throw new Error(`Module ${moduleId} not found`);
    }

    try {
      const dbUpdates: any = {};
      if (updates.active !== undefined) {
        dbUpdates.is_active = updates.active;
        if (updates.active && !dbUpdates.unlocked_at) {
          dbUpdates.unlocked_at = new Date().toISOString();
        }
      }
      if (updates.gridPosition !== undefined) {
        dbUpdates.grid_position = updates.gridPosition;
      }

      // Verificar si el módulo existe
      const { data: existing } = await supabase
        .from('user_modules')
        .select('*')
        .eq('user_id', userId)
        .eq('id', moduleId)
        .single();

      if (existing) {
        // Actualizar existente
        const { data, error } = await supabase
          .from('user_modules')
          .update(dbUpdates)
          .eq('id', moduleId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          // Si la tabla no existe, solo retornar el módulo actualizado localmente
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            console.warn('Table user_modules not found, skipping update');
            return { ...moduleDef, active: updates.active ?? moduleDef.active };
          }
          throw error;
        }
        
        return {
          ...moduleDef,
          active: data.is_active,
          gridPosition: data.grid_position ? {
            row: data.grid_position.row,
            col: data.grid_position.col
          } : undefined,
        };
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from('user_modules')
          .insert({
            id: moduleId,
            user_id: userId,
            is_active: updates.active || false,
            unlocked_at: updates.active ? new Date().toISOString() : null,
            grid_position: updates.gridPosition || null,
          })
          .select()
          .single();

        if (error) {
          // Si la tabla no existe, solo retornar el módulo actualizado localmente
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            console.warn('Table user_modules not found, skipping insert');
            return { ...moduleDef, active: updates.active ?? moduleDef.active };
          }
          throw error;
        }
        
        return {
          ...moduleDef,
          active: data.is_active,
          gridPosition: data.grid_position ? {
            row: data.grid_position.row,
            col: data.grid_position.col
          } : undefined,
        };
      }
    } catch (error: any) {
      // Si hay cualquier error relacionado con la tabla, retornar módulo local
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('Table user_modules not found, using local update');
        return { ...moduleDef, active: updates.active ?? moduleDef.active };
      }
      throw error;
    }
  }

  async initializeModules(userId: string, modules: Module[]) {
    try {
      const { data, error } = await supabase
        .from('user_modules')
        .insert(
          modules.map(m => ({
            id: m.id,
            user_id: userId,
            is_active: m.active,
            unlocked_at: m.active ? new Date().toISOString() : null,
            grid_position: m.gridPosition || null,
          }))
        )
        .select();

      if (error) {
        // Si la tabla no existe, solo loguear el warning
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table user_modules not found, cannot initialize modules. Please run the SQL script.');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error: any) {
      // Si hay cualquier error relacionado con la tabla, retornar array vacío
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('Table user_modules not found, cannot initialize modules');
        return [];
      }
      throw error;
    }
  }

  // ============ BALANZA PRO ============

  async getBalanzaProTransactions(
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      type?: 'Ingreso' | 'Egreso';
      paymentMethod?: string;
      status?: 'Pendiente' | 'Completado';
      isExtra?: boolean;
      isRecurring?: boolean;
    },
    limit?: number
  ) {
    try {
      let query = supabase
        .from('balanza_pro_transactions')
        .select('id, user_id, type, amount, payment_method, is_extra, is_recurring, tags, status, recurring_config, due_date, description, date, created_at, updated_at')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (filters) {
        if (filters.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('date', filters.endDate);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.paymentMethod) {
          query = query.eq('payment_method', filters.paymentMethod);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.isExtra !== undefined) {
          query = query.eq('is_extra', filters.isExtra);
        }
        if (filters.isRecurring !== undefined) {
          query = query.eq('is_recurring', filters.isRecurring);
        }
      }

      // Agregar límite si se especifica
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table balanza_pro_transactions not found');
          return [];
        }
        throw error;
      }

      // Desencriptar description y tags
      const decryptedTransactions = await Promise.all(
        (data || []).map(async (t: any) => {
          const decryptedDescription = await this.decryptField(t.description, userId);
          const decryptedTags = t.tags ? await this.decryptArray(t.tags, userId) : [];
          
          return {
            id: t.id,
            type: t.type,
            amount: parseFloat(t.amount),
            payment_method: t.payment_method,
            is_extra: t.is_extra,
            is_recurring: t.is_recurring,
            tags: decryptedTags || [],
            status: t.status,
            recurring_config: t.recurring_config,
            due_date: t.due_date,
            description: decryptedDescription,
            date: t.date,
          };
        })
      );
      
      return decryptedTransactions;
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('Table balanza_pro_transactions not found');
        return [];
      }
      throw error;
    }
  }

  async addBalanzaProTransaction(userId: string, transaction: {
    type: 'Ingreso' | 'Egreso';
    amount: number;
    payment_method: string;
    is_extra: boolean;
    is_recurring: boolean;
    tags: string[];
    status: 'Pendiente' | 'Completado';
    recurring_config?: any;
    due_date?: string;
    description?: string;
    date: string;
  }) {
    try {
      // Encriptar description y tags antes de insertar
      const encryptedDescription = await this.encryptField(transaction.description, userId);
      const encryptedTags = transaction.tags ? await this.encryptArray(transaction.tags, userId) : [];
      
      const { data, error } = await supabase
        .from('balanza_pro_transactions')
        .insert({
          user_id: userId,
          type: transaction.type,
          amount: transaction.amount,
          payment_method: transaction.payment_method,
          is_extra: transaction.is_extra,
          is_recurring: transaction.is_recurring,
          tags: encryptedTags,
          status: transaction.status,
          recurring_config: transaction.recurring_config || null,
          due_date: transaction.due_date || null,
          description: encryptedDescription || null,
          date: transaction.date,
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          throw new Error('La tabla balanza_pro_transactions no existe. Por favor, ejecuta el script SQL 23_balanza_pro_transactions.sql en Supabase.');
        }
        throw error;
      }

      // Desencriptar description y tags al retornar
      const decryptedDescription = await this.decryptField(data.description, userId);
      const decryptedTags = data.tags ? await this.decryptArray(data.tags, userId) : [];

      return {
        id: data.id,
        type: data.type,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        is_extra: data.is_extra,
        is_recurring: data.is_recurring,
        tags: decryptedTags || [],
        status: data.status,
        recurring_config: data.recurring_config,
        due_date: data.due_date,
        description: decryptedDescription,
        date: data.date,
      };
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        throw new Error('La tabla balanza_pro_transactions no existe. Por favor, ejecuta el script SQL 23_balanza_pro_transactions.sql en Supabase.');
      }
      throw error;
    }
  }

  async updateBalanzaProTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<{
      type: 'Ingreso' | 'Egreso';
      amount: number;
      payment_method: string;
      is_extra: boolean;
      is_recurring: boolean;
      tags: string[];
      status: 'Pendiente' | 'Completado';
      recurring_config: any;
      due_date: string;
      description: string;
      date: string;
    }>
  ) {
    try {
      const dbUpdates: any = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.payment_method !== undefined) dbUpdates.payment_method = updates.payment_method;
      if (updates.is_extra !== undefined) dbUpdates.is_extra = updates.is_extra;
      if (updates.is_recurring !== undefined) dbUpdates.is_recurring = updates.is_recurring;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.recurring_config !== undefined) dbUpdates.recurring_config = updates.recurring_config;
      if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      
      // Encriptar campos sensibles antes de actualizar
      if (updates.tags !== undefined) {
        dbUpdates.tags = updates.tags ? await this.encryptArray(updates.tags, userId) : [];
      }
      if (updates.description !== undefined) {
        dbUpdates.description = await this.encryptField(updates.description, userId);
      }

      const { data, error } = await supabase
        .from('balanza_pro_transactions')
        .update(dbUpdates)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          throw new Error('La tabla balanza_pro_transactions no existe. Por favor, ejecuta el script SQL 23_balanza_pro_transactions.sql en Supabase.');
        }
        throw error;
      }

      // Desencriptar description y tags al retornar
      const decryptedDescription = await this.decryptField(data.description, userId);
      const decryptedTags = data.tags ? await this.decryptArray(data.tags, userId) : [];

      return {
        id: data.id,
        type: data.type,
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        is_extra: data.is_extra,
        is_recurring: data.is_recurring,
        tags: decryptedTags || [],
        status: data.status,
        recurring_config: data.recurring_config,
        due_date: data.due_date,
        description: decryptedDescription,
        date: data.date,
      };
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        throw new Error('La tabla balanza_pro_transactions no existe. Por favor, ejecuta el script SQL 23_balanza_pro_transactions.sql en Supabase.');
      }
      throw error;
    }
  }

  async deleteBalanzaProTransaction(userId: string, transactionId: string) {
    try {
      const { error } = await supabase
        .from('balanza_pro_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          throw new Error('La tabla balanza_pro_transactions no existe. Por favor, ejecuta el script SQL 23_balanza_pro_transactions.sql en Supabase.');
        }
        throw error;
      }
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        throw new Error('La tabla balanza_pro_transactions no existe. Por favor, ejecuta el script SQL 23_balanza_pro_transactions.sql en Supabase.');
      }
      throw error;
    }
  }

  async getBalanzaProPaymentMethods(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('balanza_pro_transactions')
        .select('payment_method')
        .eq('user_id', userId);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return [];
        }
        throw error;
      }

      const uniqueMethods = Array.from(new Set((data || []).map((t: any) => t.payment_method).filter(Boolean)));
      return uniqueMethods.sort();
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      throw error;
    }
  }

  async getBalanzaProTags(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('balanza_pro_transactions')
        .select('tags')
        .eq('user_id', userId);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return [];
        }
        throw error;
      }

      const allTags = new Set<string>();
      (data || []).forEach((t: any) => {
        if (t.tags && Array.isArray(t.tags)) {
          t.tags.forEach((tag: string) => allTags.add(tag));
        }
      });

      return Array.from(allTags).sort();
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      throw error;
    }
  }

  // ============ STORAGE ============

  async uploadFile(userId: string, bucket: string, file: File, path: string, upsert: boolean = true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${userId}/${path}`, file, {
        cacheControl: '3600',
        upsert: upsert
      });

    if (error) throw error;
    return data;
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    // Subir avatar al bucket 'avatars'
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`${userId}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${userId}/${fileName}`);
    
    return urlData.publicUrl;
  }

  async uploadJournalPhoto(userId: string, entryId: string, file: File, photoIndex: number): Promise<string> {
    // Subir foto del diario al bucket 'journal-photos'
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${entryId}_${photoIndex}.${fileExt}`;
    const path = `${userId}/${entryId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('journal-photos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('journal-photos')
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  }

  async getFileUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }

  // ============ SECURITY CONFIG ============

  async getSecurityConfig(userId: string): Promise<SecurityConfig | null> {
    try {
      const { data, error } = await supabase
        .from('security_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // PGRST116 = No rows returned (404)
        // 42P01 = Table doesn't exist
        // PGRST301 = Table not found in schema cache
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST301' || error.message?.includes('schema cache')) {
          return null; // No config found or table doesn't exist
        }
        // Solo mostrar warning si no es un error esperado
        if (!error.message?.includes('schema cache') && !error.message?.includes('Could not find the table')) {
          console.warn('Error fetching security config:', error.message);
        }
        return null;
      }
      
      // Desencriptar security_pin si está encriptado
      const decryptedPin = data.security_pin ? await this.decryptField(data.security_pin, userId) : data.security_pin;
      
      return {
        ...data,
        security_pin: decryptedPin,
      };
    } catch (error: any) {
      // Manejar errores de red o otros errores inesperados
      if (error?.code === 'PGRST116' || error?.code === '42P01' || error?.code === 'PGRST301' || error?.status === 404 || error?.message?.includes('schema cache') || error?.message?.includes('Could not find the table')) {
        return null;
      }
      // Solo mostrar warning si no es un error esperado
      if (!error?.message?.includes('schema cache') && !error?.message?.includes('Could not find the table')) {
        console.warn('Unexpected error fetching security config:', error);
      }
      return null;
    }
  }

  async createSecurityConfig(userId: string, config: Partial<SecurityConfig>): Promise<SecurityConfig> {
    try {
      // Encriptar security_pin antes de insertar
      const encryptedPin = config.security_pin ? await this.encryptField(config.security_pin, userId) : config.security_pin;
      
      const { data, error } = await supabase
        .from('security_config')
        .insert({
          user_id: userId,
          security_pin: encryptedPin,
          biometrics_enabled: config.biometrics_enabled || false,
        })
        .select()
        .single();

      if (error) {
        // Si la tabla no existe, lanzar un error más descriptivo
        if (error.code === '42P01') {
          throw new Error('La tabla security_config no existe. Por favor, ejecuta el script SQL 09_security_config.sql en Supabase.');
        }
        throw error;
      }
      
      // Desencriptar security_pin al retornar
      const decryptedPin = data.security_pin ? await this.decryptField(data.security_pin, userId) : data.security_pin;
      
      return {
        ...data,
        security_pin: decryptedPin,
      };
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('security_config')) {
        throw new Error('La tabla security_config no existe. Por favor, ejecuta el script SQL 09_security_config.sql en Supabase.');
      }
      throw error;
    }
  }

  async updateSecurityConfig(userId: string, updates: Partial<SecurityConfig>): Promise<SecurityConfig> {
    try {
      const dbUpdates: any = {};
      if (updates.biometrics_enabled !== undefined) dbUpdates.biometrics_enabled = updates.biometrics_enabled;
      
      // Encriptar security_pin antes de actualizar
      if (updates.security_pin !== undefined) {
        dbUpdates.security_pin = await this.encryptField(updates.security_pin, userId);
      }

      // Verificar si existe
      const existing = await this.getSecurityConfig(userId);
      
      if (existing) {
        const { data, error } = await supabase
          .from('security_config')
          .update(dbUpdates)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          if (error.code === '42P01') {
            throw new Error('La tabla security_config no existe. Por favor, ejecuta el script SQL 09_security_config.sql en Supabase.');
          }
          throw error;
        }
        
        // Desencriptar security_pin al retornar
        const decryptedPin = data.security_pin ? await this.decryptField(data.security_pin, userId) : data.security_pin;
        
        return {
          ...data,
          security_pin: decryptedPin,
        };
      } else {
        return this.createSecurityConfig(userId, updates);
      }
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('security_config')) {
        throw new Error('La tabla security_config no existe. Por favor, ejecuta el script SQL 09_security_config.sql en Supabase.');
      }
      throw error;
    }
  }

  async verifySecurityPin(userId: string, pin: string): Promise<boolean> {
    const config = await this.getSecurityConfig(userId);
    if (!config || !config.security_pin) return false;
    
    // Aquí deberías usar bcrypt o similar para comparar hashes
    // Por ahora, comparación simple (NO SEGURO para producción)
    return config.security_pin === pin;
  }

  // ============ GOOGLE CALENDAR SYNC TRACKING ============

  async getSyncTracking(userId: string, eventType: 'milestone' | 'custom_event', eventId: string) {
    try {
      const { data, error } = await supabase
        .from('google_calendar_sync_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('studianta_event_type', eventType)
        .eq('studianta_event_id', eventId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No tracking found
        throw error;
      }
      return data;
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null;
      throw error;
    }
  }

  async saveSyncTracking(
    userId: string,
    eventType: 'milestone' | 'custom_event',
    eventId: string,
    googleEventId: string,
    eventDate: string,
    eventTime: string | null,
    eventTitle: string
  ) {
    try {
      // Intentar actualizar si existe
      const existing = await this.getSyncTracking(userId, eventType, eventId);
      
      if (existing) {
        const { data, error } = await supabase
          .from('google_calendar_sync_tracking')
          .update({
            google_calendar_event_id: googleEventId,
            event_date: eventDate,
            event_time: eventTime,
            event_title: eventTitle,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crear nuevo tracking
        const { data, error } = await supabase
          .from('google_calendar_sync_tracking')
          .insert({
            user_id: userId,
            studianta_event_type: eventType,
            studianta_event_id: eventId,
            google_calendar_event_id: googleEventId,
            event_date: eventDate,
            event_time: eventTime,
            event_title: eventTitle,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error: any) {
      if (error.code === '42P01') {
        console.warn('Table google_calendar_sync_tracking does not exist. Run script 14_google_calendar_sync_tracking.sql');
        return null;
      }
      throw error;
    }
  }

  async deleteSyncTracking(userId: string, eventType: 'milestone' | 'custom_event', eventId: string) {
    try {
      const { error } = await supabase
        .from('google_calendar_sync_tracking')
        .delete()
        .eq('user_id', userId)
        .eq('studianta_event_type', eventType)
        .eq('studianta_event_id', eventId);

      if (error && error.code !== '42P01') throw error;
    } catch (error: any) {
      if (error.code === '42P01') {
        console.warn('Table google_calendar_sync_tracking does not exist');
        return;
      }
      throw error;
    }
  }

  // ============ STRIPE SUBSCRIPTIONS ============

  async createCheckoutSession(userId: string): Promise<{ url: string }> {
    // Get current session explicitly to ensure we have a valid access token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session) {
      throw new Error('No active session. Please log in again.');
    }

    const accessToken = sessionData.session.access_token;
    if (!accessToken) {
      throw new Error('No access token available. Please log in again.');
    }

    // Log token info for debugging (first 20 chars only for security)
    console.log('Access token present:', !!accessToken);
    console.log('Access token length:', accessToken?.length);
    console.log('Access token preview:', accessToken?.substring(0, 20) + '...');

    // Verify userId matches the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Session expired. Please log in again.');
    }

    if (user.id !== userId) {
      throw new Error('User ID mismatch');
    }

    // Use supabase.functions.invoke - the SDK automatically attaches the Authorization header
    // from the active session, so we don't need to pass it explicitly
    // Passing custom headers might interfere with the SDK's automatic auth handling
    console.log('Calling create-checkout-session with userId:', userId);
    console.log('Session active:', !!sessionData.session);
    console.log('Access token available:', !!accessToken);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/be5fe312-731a-4030-9815-a589dbcd35eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseService.ts:1711',message:'Before invoke call',data:{userId,hasSession:!!sessionData.session,hasAccessToken:!!accessToken,accessTokenLength:accessToken?.length||0,accessTokenPreview:accessToken?.substring(0,30)||'missing',supabaseUrl:supabaseUrl?.substring(0,40)||'missing',hasAnonKey:!!supabaseAnonKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Use supabase.functions.invoke with explicit Authorization header
    // This ensures the gateway receives the token even if SDK doesn't attach it automatically
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { userId },
      // Attach headers explicitly to ensure gateway receives the token
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // #region agent log - Also try direct fetch for debugging
    if (error) {
      try {
        const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;
        const directResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({ userId }),
        });
        const responseText = await directResponse.text();
        let responseBody = null;
        try {
          responseBody = JSON.parse(responseText);
        } catch (e) {
          responseBody = responseText;
        }
        fetch('http://127.0.0.1:7242/ingest/be5fe312-731a-4030-9815-a589dbcd35eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseService.ts:1725',message:'Direct fetch response (debug only)',data:{status:directResponse.status,statusText:directResponse.statusText,responseBody},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      } catch (directError: any) {
        fetch('http://127.0.0.1:7242/ingest/be5fe312-731a-4030-9815-a589dbcd35eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseService.ts:1735',message:'Direct fetch failed',data:{error:directError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
    }
    // #endregion
    
    // #region agent log
    const errorDetails = error ? {
      message: error.message,
      name: error.name,
      status: (error as any).status || (error as any).context?.status || 'none',
      hasContext: !!(error as any).context,
      contextType: (error as any).context ? typeof (error as any).context : 'none',
    } : null;
    fetch('http://127.0.0.1:7242/ingest/be5fe312-731a-4030-9815-a589dbcd35eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseService.ts:1720',message:'After invoke call',data:{hasError:!!error,errorDetails,hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('createCheckoutSession error:', error);
      console.error('Error details:', {
        message: error.message,
        context: error.context,
        status: (error as any).status || (error as any).context?.status,
        name: error.name,
      });
      
      // Try to extract error message from response body
      let errorMessage = error.message || 'Unknown error';
      try {
        // The error.context might be a Response object
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          if (errorBody?.error) {
            errorMessage = errorBody.error;
            console.error('Error from function body:', errorBody);
          }
        } else if (error.context && typeof error.context.text === 'function') {
          const errorText = await error.context.text();
          console.error('Error text from function:', errorText);
          try {
            const errorBody = JSON.parse(errorText);
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch {
            errorMessage = errorText || errorMessage;
          }
        }
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      throw new Error(`Error creating checkout session: ${errorMessage}`);
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned from server');
    }

    return { url: data.url };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    // Get current session explicitly to ensure we have a valid access token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session) {
      throw new Error('No active session. Please log in again.');
    }

    const accessToken = sessionData.session.access_token;
    if (!accessToken) {
      throw new Error('No access token available. Please log in again.');
    }

    // Verify userId matches the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Session expired. Please log in again.');
    }

    if (user.id !== userId) {
      throw new Error('User ID mismatch');
    }

    // Use supabase.functions.invoke with explicit Authorization header
    // This ensures the gateway receives the token even if SDK doesn't attach it automatically
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { userId },
      // Attach headers explicitly to ensure gateway receives the token
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      console.error('createPortalSession error:', error);
      throw new Error(`Error creating portal session: ${error.message || 'Unknown error'}`);
    }

    if (!data?.url) {
      throw new Error('No portal URL returned from server');
    }

    return { url: data.url };
  }

  async getSubscriptionStatus(userId: string): Promise<{
    tier: 'Free' | 'Premium';
    status?: string;
    currentPeriodEnd?: string;
  }> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return { tier: 'Free' };
    }

    return {
      tier: profile.tier || 'Free',
      status: profile.subscription_status,
      currentPeriodEnd: profile.subscription_current_period_end,
    };
  }

  async verifyCheckoutSession(sessionId: string): Promise<{
    completed: boolean;
    tier?: 'Premium';
    subscription_status?: string;
  }> {
    // Get current session explicitly to ensure we have a valid access token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session) {
      throw new Error('No active session. Please log in again.');
    }

    const accessToken = sessionData.session.access_token;
    if (!accessToken) {
      throw new Error('No access token available. Please log in again.');
    }

    const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
      body: { sessionId },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      console.error('verifyCheckoutSession error:', error);
      throw new Error(`Error verifying checkout session: ${error.message || 'Unknown error'}`);
    }

    return data;
  }

  // ============ NUTRITION ============

  async getNutritionEntries(userId: string, date?: string, limit?: number): Promise<NutritionEntry[]> {
    try {
      let query = supabase
        .from('nutrition_entries')
        .select('id, user_id, date, time, input_type, input_text, photo_url, foods, total_calories, total_protein, total_carbs, total_fats, estimated_glucose_impact, energy_score, brain_food_tags, created_at, updated_at')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (date) {
        query = query.eq('date', date);
      } else if (limit) {
        // Solo agregar límite si no hay filtro de fecha
        query = query.limit(limit);
      }

      const { data, error } = await retryWithBackoff(async () => {
        const result = await query;
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table nutrition_entries not found');
          return [];
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading nutrition entries, returning empty array');
          return [];
        }
        throw error;
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        date: row.date,
        time: row.time,
        input_type: row.input_type,
        input_text: row.input_text,
        photo_url: row.photo_url,
        foods: row.foods || [],
        total_calories: parseFloat(row.total_calories) || 0,
        total_protein: parseFloat(row.total_protein) || 0,
        total_carbs: parseFloat(row.total_carbs) || 0,
        total_fats: parseFloat(row.total_fats) || 0,
        estimated_glucose_impact: row.estimated_glucose_impact,
        energy_score: row.energy_score,
        brain_food_tags: row.brain_food_tags || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      throw error;
    }
  }

  async createNutritionEntry(userId: string, entry: Omit<NutritionEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<NutritionEntry> {
    const { data, error } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('nutrition_entries')
        .insert({
          user_id: userId,
          date: entry.date,
          time: entry.time,
          input_type: entry.input_type,
          input_text: entry.input_text,
          photo_url: entry.photo_url,
          foods: entry.foods,
          total_calories: entry.total_calories,
          total_protein: entry.total_protein,
          total_carbs: entry.total_carbs,
          total_fats: entry.total_fats,
          estimated_glucose_impact: entry.estimated_glucose_impact,
          energy_score: entry.energy_score,
          brain_food_tags: entry.brain_food_tags,
        })
        .select()
        .single();

      if (result.error && isNetworkError(result.error)) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      if (isNetworkError(error)) {
        throw new Error('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
      }
      throw error;
    }

    if (!data) throw new Error('No se creó la entrada de nutrición');

    return {
      id: data.id,
      user_id: data.user_id,
      date: data.date,
      time: data.time,
      input_type: data.input_type,
      input_text: data.input_text,
      photo_url: data.photo_url,
      foods: data.foods || [],
      total_calories: parseFloat(data.total_calories) || 0,
      total_protein: parseFloat(data.total_protein) || 0,
      total_carbs: parseFloat(data.total_carbs) || 0,
      total_fats: parseFloat(data.total_fats) || 0,
      estimated_glucose_impact: data.estimated_glucose_impact,
      energy_score: data.energy_score,
      brain_food_tags: data.brain_food_tags || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async updateNutritionEntry(entryId: string, updates: Partial<NutritionEntry>): Promise<NutritionEntry> {
    const { data, error } = await retryWithBackoff(async () => {
      const updateData: any = {};
      if (updates.foods !== undefined) updateData.foods = updates.foods;
      if (updates.total_calories !== undefined) updateData.total_calories = updates.total_calories;
      if (updates.total_protein !== undefined) updateData.total_protein = updates.total_protein;
      if (updates.total_carbs !== undefined) updateData.total_carbs = updates.total_carbs;
      if (updates.total_fats !== undefined) updateData.total_fats = updates.total_fats;
      if (updates.estimated_glucose_impact !== undefined) updateData.estimated_glucose_impact = updates.estimated_glucose_impact;
      if (updates.energy_score !== undefined) updateData.energy_score = updates.energy_score;
      if (updates.brain_food_tags !== undefined) updateData.brain_food_tags = updates.brain_food_tags;

      const result = await supabase
        .from('nutrition_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (result.error && isNetworkError(result.error)) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      if (isNetworkError(error)) {
        throw new Error('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
      }
      throw error;
    }

    if (!data) throw new Error('No se actualizó la entrada de nutrición');

    return {
      id: data.id,
      user_id: data.user_id,
      date: data.date,
      time: data.time,
      input_type: data.input_type,
      input_text: data.input_text,
      photo_url: data.photo_url,
      foods: data.foods || [],
      total_calories: parseFloat(data.total_calories) || 0,
      total_protein: parseFloat(data.total_protein) || 0,
      total_carbs: parseFloat(data.total_carbs) || 0,
      total_fats: parseFloat(data.total_fats) || 0,
      estimated_glucose_impact: data.estimated_glucose_impact,
      energy_score: data.energy_score,
      brain_food_tags: data.brain_food_tags || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async deleteNutritionEntry(entryId: string): Promise<void> {
    const { error } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('nutrition_entries')
        .delete()
        .eq('id', entryId);

      if (result.error && isNetworkError(result.error)) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      if (isNetworkError(error)) {
        throw new Error('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
      }
      throw error;
    }
  }

  async getNutritionGoals(userId: string): Promise<NutritionGoals | null> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('nutrition_goals')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        // Error 406 puede ocurrir si la tabla no existe o RLS no está configurado
        if (error.code === 'PGRST116' || error.code === 'PGRST205' || (error as any).status === 406 || error.message?.includes('Could not find the table')) {
          console.warn('Table nutrition_goals not found or not accessible');
          return null;
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading nutrition goals, returning null');
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        daily_calories: data.daily_calories,
        protein_grams: data.protein_grams,
        carbs_grams: data.carbs_grams,
        fats_grams: data.fats_grams,
        activity_level: data.activity_level,
        updated_at: data.updated_at,
      };
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return null;
      }
      throw error;
    }
  }

  async updateNutritionGoals(userId: string, goals: Partial<Omit<NutritionGoals, 'id' | 'user_id' | 'updated_at'>>): Promise<NutritionGoals> {
    // Check if goals exist
    const existing = await this.getNutritionGoals(userId);

    let data, error;
    if (existing) {
      // Update existing
      const result = await retryWithBackoff(async () => {
        const updateResult = await supabase
          .from('nutrition_goals')
          .update({
            daily_calories: goals.daily_calories,
            protein_grams: goals.protein_grams,
            carbs_grams: goals.carbs_grams,
            fats_grams: goals.fats_grams,
            activity_level: goals.activity_level,
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateResult.error && isNetworkError(updateResult.error)) {
          throw updateResult.error;
        }
        return updateResult;
      });
      data = result.data;
      error = result.error;
    } else {
      // Insert new
      const result = await retryWithBackoff(async () => {
        const insertResult = await supabase
          .from('nutrition_goals')
          .insert({
            user_id: userId,
            daily_calories: goals.daily_calories || 2000,
            protein_grams: goals.protein_grams || 150,
            carbs_grams: goals.carbs_grams || 250,
            fats_grams: goals.fats_grams || 65,
            activity_level: goals.activity_level || 'moderate',
          })
          .select()
          .single();

        if (insertResult.error && isNetworkError(insertResult.error)) {
          throw insertResult.error;
        }
        return insertResult;
      });
      data = result.data;
      error = result.error;
    }

    if (error) {
      if (isNetworkError(error)) {
        throw new Error('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
      }
      throw error;
    }

    if (!data) throw new Error('No se guardaron los objetivos nutricionales');

    return {
      id: data.id,
      user_id: data.user_id,
      daily_calories: data.daily_calories,
      protein_grams: data.protein_grams,
      carbs_grams: data.carbs_grams,
      fats_grams: data.fats_grams,
      activity_level: data.activity_level,
      updated_at: data.updated_at,
    };
  }

  async createNutritionCorrelation(userId: string, correlation: Omit<NutritionCorrelation, 'id' | 'user_id' | 'created_at'>): Promise<NutritionCorrelation> {
    const { data, error } = await retryWithBackoff(async () => {
      const result = await supabase
        .from('nutrition_correlations')
        .insert({
          user_id: userId,
          nutrition_entry_id: correlation.nutrition_entry_id,
          focus_session_id: correlation.focus_session_id,
          focus_session_date: correlation.focus_session_date,
          time_between: correlation.time_between,
          session_quality_score: correlation.session_quality_score,
          correlation_type: correlation.correlation_type,
          insights: correlation.insights,
        })
        .select()
        .single();

      if (result.error && isNetworkError(result.error)) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      if (isNetworkError(error)) {
        throw new Error('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
      }
      throw error;
    }

    if (!data) throw new Error('No se creó la correlación');

    return {
      id: data.id,
      user_id: data.user_id,
      nutrition_entry_id: data.nutrition_entry_id,
      focus_session_id: data.focus_session_id,
      focus_session_date: data.focus_session_date,
      time_between: data.time_between,
      session_quality_score: data.session_quality_score,
      correlation_type: data.correlation_type,
      insights: data.insights,
      created_at: data.created_at,
    };
  }

  async getNutritionCorrelations(userId: string, limit: number = 10): Promise<NutritionCorrelation[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('nutrition_correlations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Table nutrition_correlations not found');
          return [];
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading nutrition correlations, returning empty array');
          return [];
        }
        throw error;
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        nutrition_entry_id: row.nutrition_entry_id,
        focus_session_id: row.focus_session_id,
        focus_session_date: row.focus_session_date,
        time_between: row.time_between,
        session_quality_score: row.session_quality_score,
        correlation_type: row.correlation_type,
        insights: row.insights,
        created_at: row.created_at,
      }));
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return [];
      }
      throw error;
    }
  }

  async uploadNutritionPhoto(userId: string, entryId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${entryId}.${fileExt}`;
    const path = `${userId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('nutrition-photos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('nutrition-photos')
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  }

  // ============ NAVIGATION CONFIG ============

  getDefaultNavigationConfig(): { desktop_modules: NavigationModule[]; mobile_modules: NavigationModule[] } {
    return {
      desktop_modules: [
        { moduleId: 'subjects', order: 0, navView: NavView.SUBJECTS },
        { moduleId: 'calendar', order: 1, navView: NavView.CALENDAR },
        { moduleId: 'focus', order: 2, navView: NavView.FOCUS },
        { moduleId: 'diary', order: 3, navView: NavView.DIARY },
        { moduleId: 'balanza', order: 4, navView: NavView.BALANZA },
      ],
      mobile_modules: [
        { moduleId: 'subjects', order: 0, navView: NavView.SUBJECTS },
        { moduleId: 'diary', order: 1, navView: NavView.DIARY },
        { moduleId: 'calendar', order: 2, navView: NavView.CALENDAR },
        { moduleId: 'focus', order: 3, navView: NavView.FOCUS },
        { moduleId: 'balanza', order: 4, navView: NavView.BALANZA },
      ],
    };
  }

  async getNavigationConfig(userId: string): Promise<NavigationConfig | null> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('user_navigation_config')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (result.error && isNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      });

      if (error) {
        if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          // Si no existe configuración o la tabla no existe, retornar null para usar defaults
          return null;
        }
        if (isNetworkError(error)) {
          console.warn('Network error loading navigation config, returning null');
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        desktop_modules: data.desktop_modules || [],
        mobile_modules: data.mobile_modules || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return null;
      }
      if (isNetworkError(error)) {
        console.warn('Network error loading navigation config, returning null');
        return null;
      }
      throw error;
    }
  }

  async updateNavigationConfig(userId: string, config: { desktop_modules: NavigationModule[]; mobile_modules: NavigationModule[] }): Promise<NavigationConfig> {
    try {
      // Verificar si existe configuración
      const existing = await this.getNavigationConfig(userId);

      if (existing) {
        // Actualizar existente
        const { data, error } = await retryWithBackoff(async () => {
          const result = await supabase
            .from('user_navigation_config')
            .update({
              desktop_modules: config.desktop_modules,
              mobile_modules: config.mobile_modules,
            })
            .eq('user_id', userId)
            .select()
            .single();
          
          if (result.error && isNetworkError(result.error)) {
            throw result.error;
          }
          return result;
        });

        if (error) {
          if (isNetworkError(error)) {
            throw new Error('Error de conexión. Por favor, intenta nuevamente.');
          }
          throw error;
        }

        if (!data) throw new Error('No se actualizó la configuración de navegación');

        return {
          id: data.id,
          user_id: data.user_id,
          desktop_modules: data.desktop_modules || [],
          mobile_modules: data.mobile_modules || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      } else {
        // Crear nueva configuración
        const { data, error } = await retryWithBackoff(async () => {
          const result = await supabase
            .from('user_navigation_config')
            .insert({
              user_id: userId,
              desktop_modules: config.desktop_modules,
              mobile_modules: config.mobile_modules,
            })
            .select()
            .single();
          
          if (result.error && isNetworkError(result.error)) {
            throw result.error;
          }
          return result;
        });

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            console.warn('Table user_navigation_config not found. Please run script 03_navigation_config.sql');
            // Retornar configuración local como fallback
            return {
              id: '',
              user_id: userId,
              desktop_modules: config.desktop_modules,
              mobile_modules: config.mobile_modules,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
          if (isNetworkError(error)) {
            throw new Error('Error de conexión. Por favor, intenta nuevamente.');
          }
          throw error;
        }

        if (!data) throw new Error('No se creó la configuración de navegación');

        return {
          id: data.id,
          user_id: data.user_id,
          desktop_modules: data.desktop_modules || [],
          mobile_modules: data.mobile_modules || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('Table user_navigation_config not found. Please run script 03_navigation_config.sql');
        // Retornar configuración local como fallback
        return {
          id: '',
          user_id: userId,
          desktop_modules: config.desktop_modules,
          mobile_modules: config.mobile_modules,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      if (isNetworkError(error)) {
        throw new Error('Error de conexión al actualizar configuración de navegación. Por favor, intenta nuevamente.');
      }
      throw error;
    }
  }

  /**
   * Migra los datos existentes de un usuario a formato encriptado
   * Solo encripta datos que aún no están encriptados
   */
  async migrateUserData(userId: string, encryptionPassword: string): Promise<{
    journalEntries: number;
    calendarEvents: number;
    balanzaTransactions: number;
    securityConfig: boolean;
  }> {
    console.log('🚀 Iniciando migración de datos para usuario:', userId);
    
    // Establecer la contraseña de encriptación
    this.setEncryptionPassword(encryptionPassword);
    
    const results = {
      journalEntries: 0,
      calendarEvents: 0,
      balanzaTransactions: 0,
      securityConfig: false,
    };
    
    try {
      // 1. Migrar entradas del diario
      console.log('\n📝 Migrando entradas del diario...');
      const journalEntries = await this.getJournalEntries(userId);
      
      for (const entry of journalEntries) {
        // Verificar si ya está encriptado
        const isContentEncrypted = this.isEncrypted(entry.content);
        const arePhotosEncrypted = entry.photos?.every(photo => 
          !photo || this.isEncrypted(photo)
        ) ?? true;
        
        if (isContentEncrypted && arePhotosEncrypted) {
          continue;
        }
        
        // Encriptar y actualizar
        try {
          await this.updateJournalEntry(userId, entry.id, {
            content: entry.content,
            photos: entry.photos || [],
          });
          results.journalEntries++;
          console.log(`  ✅ Entrada ${entry.id.substring(0, 8)}... migrada`);
        } catch (error) {
          console.error(`  ❌ Error migrando entrada ${entry.id}:`, error);
        }
      }
      console.log(`  📊 Total: ${results.journalEntries} entradas migradas`);
      
      // 2. Migrar eventos del calendario
      console.log('\n📅 Migrando eventos del calendario...');
      const calendarEvents = await this.getCalendarEvents(userId);
      
      for (const event of calendarEvents) {
        // Verificar si ya está encriptado
        if (this.isEncrypted(event.description)) {
          continue;
        }
        
        // Encriptar y actualizar
        try {
          await this.updateCalendarEvent(userId, event.id, {
            description: event.description || '',
          });
          results.calendarEvents++;
          console.log(`  ✅ Evento ${event.id.substring(0, 8)}... migrado`);
        } catch (error) {
          console.error(`  ❌ Error migrando evento ${event.id}:`, error);
        }
      }
      console.log(`  📊 Total: ${results.calendarEvents} eventos migrados`);
      
      // 3. Migrar transacciones de Balanza Pro
      console.log('\n💰 Migrando transacciones de Balanza Pro...');
      const balanzaTransactions = await this.getBalanzaProTransactions(userId);
      
      for (const transaction of balanzaTransactions) {
        // Verificar si ya está encriptado
        const isDescriptionEncrypted = !transaction.description || 
          this.isEncrypted(transaction.description);
        const areTagsEncrypted = !transaction.tags || 
          transaction.tags.every(tag => !tag || this.isEncrypted(tag));
        
        if (isDescriptionEncrypted && areTagsEncrypted) {
          continue;
        }
        
        // Encriptar y actualizar
        try {
          await this.updateBalanzaProTransaction(userId, transaction.id, {
            description: transaction.description || '',
            tags: transaction.tags || [],
          });
          results.balanzaTransactions++;
          console.log(`  ✅ Transacción ${transaction.id.substring(0, 8)}... migrada`);
        } catch (error) {
          console.error(`  ❌ Error migrando transacción ${transaction.id}:`, error);
        }
      }
      console.log(`  📊 Total: ${results.balanzaTransactions} transacciones migradas`);
      
      // 4. Migrar configuración de seguridad (PIN)
      console.log('\n🔒 Migrando configuración de seguridad (PIN)...');
      try {
        const securityConfig = await this.getSecurityConfig(userId);
        if (securityConfig && securityConfig.security_pin) {
          // Verificar si ya está encriptado
          if (this.isEncrypted(securityConfig.security_pin)) {
            console.log('  ⏭️  PIN ya está encriptado, saltando...');
          } else {
            // Encriptar y actualizar
            await this.updateSecurityConfig(userId, {
              security_pin: securityConfig.security_pin,
            });
            results.securityConfig = true;
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
      console.log(`   - Entradas del diario: ${results.journalEntries} migradas`);
      console.log(`   - Eventos del calendario: ${results.calendarEvents} migrados`);
      console.log(`   - Transacciones Balanza Pro: ${results.balanzaTransactions} migradas`);
      console.log(`   - Configuración de seguridad: ${results.securityConfig ? 'migrada' : 'no aplicable'}`);
      
      return results;
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
      throw error;
    }
    // NO limpiar la contraseña aquí, el usuario puede querer seguir usándola
  }
}

export const supabaseService = new SupabaseService();

