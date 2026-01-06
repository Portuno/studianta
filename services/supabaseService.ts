import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Subject, Transaction, JournalEntry, CustomCalendarEvent, Module } from '../types';

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
  arcane_level?: string; // Nivel arcano (ej: "Buscadora de Luz", "Alquimista Clínica")
  essence: number;
  total_essence_earned?: number; // Esencia histórica total ganada
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
        essence: 500,
        total_essence_earned: 0,
        arcane_level: 'Buscadora de Luz',
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
        arcane_level: data.arcane_level || 'Buscadora de Luz',
        essence: data.essence || 500,
        total_essence_earned: data.total_essence_earned || 0,
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
    if (updates.arcane_level !== undefined) dbUpdates.arcane_level = updates.arcane_level;
    if (updates.essence !== undefined) dbUpdates.essence = updates.essence;
    if (updates.total_essence_earned !== undefined) dbUpdates.total_essence_earned = updates.total_essence_earned;

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
        arcane_level: data.arcane_level || 'Buscadora de Luz',
        essence: data.essence || 500,
        total_essence_earned: data.total_essence_earned || 0,
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

  async updateEssence(userId: string, essence: number) {
    return this.updateProfile(userId, { essence });
  }

  async addEssence(userId: string, amount: number) {
    // Obtener perfil actual
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error('Profile not found');

    const newEssence = (profile.essence || 0) + amount;
    const newTotalEssence = (profile.total_essence_earned || 0) + amount;

    // Actualizar esencia y total ganado (el trigger actualizará el arcane_level automáticamente)
    return this.updateProfile(userId, {
      essence: newEssence,
      total_essence_earned: newTotalEssence,
    });
  }

  async calculateArcaneLevel(totalEssence: number): Promise<string> {
    if (totalEssence < 100) return 'Buscadora de Luz';
    if (totalEssence < 300) return 'Aprendiz de la Logia';
    if (totalEssence < 600) return 'Alquimista Clínica';
    if (totalEssence < 1000) return 'Maestra de la Transmutación';
    if (totalEssence < 2000) return 'Archimaga del Conocimiento';
    if (totalEssence < 5000) return 'Gran Alquimista';
    return 'Arquitecta del Saber Eterno';
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

  async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        
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

  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        
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
      
      return data.map((row: any) => ({
        id: row.id,
        date: row.date,
        mood: row.mood,
        content: row.content,
        photo: row.photo,
        isLocked: row.is_locked,
        sentiment: row.sentiment ? parseFloat(row.sentiment) : undefined,
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
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        date: entry.date,
        mood: entry.mood,
        content: entry.content,
        photo: entry.photo,
        is_locked: entry.isLocked,
        sentiment: entry.sentiment,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      date: data.date,
      mood: data.mood,
      content: data.content,
      photo: data.photo,
      isLocked: data.is_locked,
      sentiment: data.sentiment ? parseFloat(data.sentiment) : undefined,
    };
  }

  async updateJournalEntry(userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
    if (updates.sentiment !== undefined) dbUpdates.sentiment = updates.sentiment;

    const { data, error } = await supabase
      .from('journal_entries')
      .update(dbUpdates)
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      date: data.date,
      mood: data.mood,
      content: data.content,
      photo: data.photo,
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

  async getCalendarEvents(userId: string): Promise<CustomCalendarEvent[]> {
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true });
        
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
      
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        time: row.time,
        endTime: row.end_time,
        color: row.color,
        priority: row.priority,
      }));
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
      const { data, error } = await retryWithBackoff(async () => {
        const result = await supabase
          .from('calendar_events')
          .insert({
            title: event.title,
            description: event.description,
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
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
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
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title: event.title,
        description: event.description,
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
    return {
      id: data.id,
      title: data.title,
      description: data.description,
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
      return data;
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
      const { data, error } = await supabase
        .from('security_config')
        .insert({
          user_id: userId,
          security_pin: config.security_pin,
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
      return data;
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
      if (updates.security_pin !== undefined) dbUpdates.security_pin = updates.security_pin;
      if (updates.biometrics_enabled !== undefined) dbUpdates.biometrics_enabled = updates.biometrics_enabled;

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
        return data;
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
}

export const supabaseService = new SupabaseService();

