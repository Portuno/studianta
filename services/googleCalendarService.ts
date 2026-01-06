import { Subject, CustomCalendarEvent, Milestone } from '../types';
import { supabaseService } from './supabaseService';

// Configuración de OAuth2 de Google Calendar
// El Client ID se obtiene del backend para no exponer credenciales
let GOOGLE_CLIENT_ID: string | null = null;
// Usar solo el origin (sin pathname) para que coincida con Google Cloud Console
const GOOGLE_REDIRECT_URI = window.location.origin;
// Scope completo de calendar para permitir crear calendarios y gestionar eventos
// calendar.events solo permite eventos, pero necesitamos calendar completo para crear calendarios
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar';
const GOOGLE_DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

// Obtener la URL base del backend (Vercel en producción, localhost en desarrollo)
const getBackendUrl = (): string => {
  // En producción, usar la URL actual (Vercel)
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  // En desarrollo, usar localhost o la variable de entorno si existe
  return import.meta.env.VITE_BACKEND_URL || window.location.origin;
};

export interface GoogleCalendarToken {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export class GoogleCalendarService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;
  private calendarId: string | null = null;

  /**
   * Obtiene el Client ID desde el backend
   */
  private async getClientId(): Promise<string> {
    if (GOOGLE_CLIENT_ID) {
      return GOOGLE_CLIENT_ID;
    }

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/google/oauth/config`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.message || 'Error al obtener configuración de Google OAuth');
      }

      const data = await response.json();
      GOOGLE_CLIENT_ID = data.client_id;
      return GOOGLE_CLIENT_ID;
    } catch (error: any) {
      throw new Error(
        `Error al obtener configuración de Google OAuth: ${error.message || 'Error desconocido'}\n\n` +
        `Por favor, asegúrate de que GOOGLE_CLIENT_ID esté configurado en las variables de entorno de Vercel.`
      );
    }
  }

  /**
   * Inicia el flujo de OAuth2 para obtener permisos de Google Calendar
   */
  async initiateOAuth(): Promise<void> {
    const clientId = await this.getClientId();
    
    if (!clientId) {
      throw new Error('No se pudo obtener el Google Client ID desde el servidor');
    }

    // Usar solo el origin (sin pathname) para que coincida con Google Cloud Console
    // El callback se maneja en cualquier página y luego se limpia la URL
    const redirectUri = window.location.origin;

    // Log para debugging (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('[Google Calendar] Redirect URI:', redirectUri);
      console.log('[Google Calendar] Asegúrate de que esta URI esté registrada en Google Cloud Console');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState(),
    });

    // Logging para debug
    console.log('[Google Calendar] Iniciando OAuth con scope:', GOOGLE_SCOPE);
    console.log('[Google Calendar] URL completa:', `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);

    // Guardar state y redirect_uri en localStorage para validación
    localStorage.setItem('google_oauth_state', params.get('state') || '');
    localStorage.setItem('google_oauth_redirect_uri', redirectUri);

    // Redirigir a Google OAuth
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Maneja el callback de OAuth2 y obtiene el token de acceso
   */
  async handleOAuthCallback(code: string, state: string): Promise<GoogleCalendarToken> {
    const savedState = localStorage.getItem('google_oauth_state');
    if (!savedState || savedState !== state) {
      throw new Error('Estado de OAuth inválido. Por favor, intenta nuevamente.');
    }
    localStorage.removeItem('google_oauth_state');
    
    const savedRedirectUri = localStorage.getItem('google_oauth_redirect_uri');
    localStorage.removeItem('google_oauth_redirect_uri');

    // Intercambiar código por token (esto debe hacerse en el backend por seguridad)
    // Por ahora, usaremos un endpoint proxy o el backend de Supabase
    const tokenResponse = await this.exchangeCodeForToken(code, savedRedirectUri || GOOGLE_REDIRECT_URI);
    
    this.accessToken = tokenResponse.access_token;
    this.refreshToken = tokenResponse.refresh_token || null;
    this.expiresAt = tokenResponse.expires_at || (Date.now() + (tokenResponse.expires_in || 3600) * 1000);

    return tokenResponse;
  }

  /**
   * Intercambia el código de autorización por un token de acceso
   * Usa el backend para mantener el Client Secret seguro
   */
  private async exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleCalendarToken> {
    const backendUrl = getBackendUrl();
    
    try {
      const response = await fetch(`${backendUrl}/api/google/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        const errorMessage = error.message || error.error || 'Error desconocido';
        
        // Mensajes más descriptivos para errores comunes
        if (error.error === 'redirect_uri_mismatch') {
          throw new Error(
            `Error de configuración: La URI de redirección no coincide.\n\n` +
            `URI usada: ${redirectUri}\n\n` +
            `Por favor, asegúrate de que esta URI exacta esté registrada en Google Cloud Console:\n` +
            `1. Ve a Google Cloud Console > APIs & Services > Credentials\n` +
            `2. Edita tu OAuth 2.0 Client ID\n` +
            `3. Añade esta URI en "Authorized redirect URIs":\n` +
            `   ${redirectUri}\n\n` +
            `Consulta la documentación de configuración para más detalles.`
          );
        }
        
        if (error.error === 'invalid_client' || response.status === 401) {
          throw new Error(
            `Error de autenticación: Client ID o Client Secret inválidos.\n\n` +
            `Por favor, verifica que GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET estén correctamente configurados en las variables de entorno de Vercel.`
          );
        }
        
        if (error.error === 'invalid_grant') {
          throw new Error(
            `Error: El código de autorización ha expirado o ya fue usado.\n\n` +
            `Por favor, intenta conectar nuevamente.`
          );
        }
        
        throw new Error(`Error al obtener token: ${errorMessage}`);
      }
      
      return await response.json();
    } catch (error: any) {
      // Si el error ya tiene un mensaje descriptivo, lanzarlo tal cual
      if (error.message && !error.message.includes('fetch')) {
        throw error;
      }
      
      // Si es un error de red, dar un mensaje más útil
      throw new Error(
        `Error de conexión al intercambiar código por token: ${error.message || 'Error desconocido'}\n\n` +
        `Por favor, verifica que los endpoints de API estén correctamente desplegados en Vercel.`
      );
    }
  }

  /**
   * Refresca el token de acceso si está expirado
   * Usa el backend para mantener el Client Secret seguro
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No hay refresh token disponible. Por favor, vuelve a autorizar.');
    }

    const backendUrl = getBackendUrl();
    
    try {
      const response = await fetch(`${backendUrl}/api/google/oauth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.message || 'Error al refrescar token');
      }
      
      const data = await response.json();
      this.accessToken = data.access_token;
      this.expiresAt = data.expires_at || (Date.now() + (data.expires_in * 1000));
      return this.accessToken;
    } catch (error: any) {
      throw new Error(
        `Error al refrescar token: ${error.message || 'Error desconocido'}\n\n` +
        `Por favor, verifica que los endpoints de API estén correctamente desplegados en Vercel.`
      );
    }
  }

  /**
   * Obtiene un token de acceso válido (refresca si es necesario)
   */
  private async getValidAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No hay token de acceso. Por favor, autoriza la aplicación primero.');
    }

    // Verificar si el token está expirado (con 5 minutos de margen)
    if (this.expiresAt && Date.now() >= this.expiresAt - 5 * 60 * 1000) {
      return await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Verifica si un error es por permisos insuficientes
   */
  private isInsufficientPermissionsError(response: Response, error: any): boolean {
    if (response.status === 403) {
      return true;
    }
    
    const errorMessage = error?.error?.message || error?.message || '';
    return (
      errorMessage.includes('insufficient authentication scopes') ||
      errorMessage.includes('insufficient permissions') ||
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('Access denied')
    );
  }

  /**
   * Limpia los tokens y fuerza reautorización
   */
  private clearTokensAndForceReauth(userId: string): void {
    this.disconnect(userId);
    throw new Error(
      'El token actual no tiene los permisos necesarios.\n\n' +
      'Por favor, vuelve a conectar tu cuenta de Google Calendar para obtener los permisos completos.'
    );
  }

  /**
   * Crea o obtiene el calendario "Studianta - Academia"
   */
  async getOrCreateStudiantaCalendar(): Promise<string> {
    const token = await this.getValidAccessToken();
    const calendarName = 'Studianta - Academia';

    // Buscar calendario existente
    const listResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!listResponse.ok) {
      const error = await listResponse.json().catch(() => ({}));
      
      // Si es error de permisos, limpiar tokens y forzar reautorización
      if (this.isInsufficientPermissionsError(listResponse, error)) {
        // Intentar obtener userId desde localStorage
        const userId = this.getUserIdFromStorage();
        if (userId) {
          this.clearTokensAndForceReauth(userId);
        }
        throw new Error(
          'Error de permisos: El token no tiene los permisos necesarios para acceder a Google Calendar.\n\n' +
          'Por favor, desconecta y vuelve a conectar tu cuenta de Google Calendar.'
        );
      }
      
      throw new Error(`Error al listar calendarios: ${error.error?.message || 'Error desconocido'}`);
    }

    const data = await listResponse.json();
    const existingCalendar = data.items?.find(
      (cal: any) => cal.summary === calendarName
    );

    if (existingCalendar) {
      this.calendarId = existingCalendar.id;
      return existingCalendar.id;
    }

    // Crear nuevo calendario
    const createResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: calendarName,
        description: 'Calendario académico sincronizado desde Studianta',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({}));
      const errorMessage = error.error?.message || 'Error desconocido';
      
      // Si es error de permisos, limpiar tokens y forzar reautorización
      if (this.isInsufficientPermissionsError(createResponse, error)) {
        const userId = this.getUserIdFromStorage();
        if (userId) {
          this.clearTokensAndForceReauth(userId);
        }
        throw new Error(
          'Error de permisos: El token no tiene los permisos necesarios para crear calendarios.\n\n' +
          'Por favor, desconecta y vuelve a conectar tu cuenta de Google Calendar para obtener los permisos completos.'
        );
      }
      
      throw new Error(`Error al crear calendario: ${errorMessage}`);
    }

    const calendar = await createResponse.json();
    this.calendarId = calendar.id;
    return calendar.id;
  }

  /**
   * Obtiene el userId desde localStorage (método auxiliar)
   */
  private getUserIdFromStorage(): string | null {
    // Buscar en todas las claves de localStorage que empiecen con google_calendar_
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('google_calendar_')) {
        return key.replace('google_calendar_', '');
      }
    }
    return null;
  }

  /**
   * Calcula la fecha del día siguiente en formato YYYY-MM-DD
   */
  private getNextDay(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    const nextYear = date.getFullYear();
    const nextMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const nextDay = date.getDate().toString().padStart(2, '0');
    return `${nextYear}-${nextMonth}-${nextDay}`;
  }

  /**
   * Valida y formatea una fecha para Google Calendar
   */
  private validateAndFormatDate(dateStr: string, timeStr?: string): { isValid: boolean; dateTime?: string; date?: string; error?: string } {
    if (!dateStr) {
      return { isValid: false, error: 'Fecha vacía' };
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return { isValid: false, error: `Formato de fecha inválido: ${dateStr}` };
    }

    // Si no hay hora, retornar solo la fecha
    if (!timeStr) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { isValid: false, error: `Fecha inválida: ${dateStr}` };
      }
      return { isValid: true, date: dateStr };
    }

    // Normalizar formato de hora: aceptar HH:MM o HH:MM:SS y convertir a HH:MM
    let normalizedTime = timeStr.trim();
    
    // Si tiene segundos (HH:MM:SS), eliminarlos
    if (normalizedTime.includes(':') && normalizedTime.split(':').length === 3) {
      const parts = normalizedTime.split(':');
      normalizedTime = `${parts[0]}:${parts[1]}`;
    }

    // Validar formato de hora normalizado (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(normalizedTime)) {
      return { isValid: false, error: `Formato de hora inválido: ${timeStr} (esperado HH:MM o HH:MM:SS)` };
    }

    // Validar que hora y minutos sean válidos
    const [hours, minutes] = normalizedTime.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return { isValid: false, error: `Hora inválida: ${normalizedTime} (hora debe estar entre 00-23, minutos entre 00-59)` };
    }

    // Construir fecha/hora completa en formato ISO (YYYY-MM-DDTHH:MM:00)
    // IMPORTANTE: No usar toISOString() porque convierte a UTC y puede cambiar la fecha
    // En su lugar, construir directamente la fecha/hora en formato ISO local
    const dateTimeStr = `${dateStr}T${normalizedTime}:00`;
    
    // Validar que la fecha/hora sea válida
    const testDate = new Date(dateTimeStr);
    if (isNaN(testDate.getTime())) {
      return { isValid: false, error: `Fecha/hora inválida: ${dateTimeStr}` };
    }

    // Retornar la fecha/hora en formato ISO local (sin conversión a UTC)
    // Google Calendar espera el formato: YYYY-MM-DDTHH:MM:SS
    return { isValid: true, dateTime: dateTimeStr };
  }

  /**
   * Sincroniza un evento individual a Google Calendar (con tracking para evitar duplicados)
   */
  private async syncSingleEvent(
    userId: string,
    eventType: 'milestone' | 'custom_event',
    eventId: string,
    googleEvent: GoogleCalendarEvent,
    eventTitle: string,
    eventDate: string,
    eventTime?: string
  ): Promise<{ created: boolean; updated: boolean; googleEventId: string | null }> {
    if (!this.calendarId) {
      await this.getOrCreateStudiantaCalendar();
    }

    const token = await this.getValidAccessToken();
    
    // Verificar si el evento ya está sincronizado
    const tracking = await supabaseService.getSyncTracking(userId, eventType, eventId);
    
    if (tracking && tracking.google_calendar_event_id) {
      // Evento ya existe, actualizarlo
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${tracking.google_calendar_event_id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent),
          }
        );

        if (response.ok) {
          // Actualizar tracking
          await supabaseService.saveSyncTracking(
            userId,
            eventType,
            eventId,
            tracking.google_calendar_event_id,
            eventDate,
            eventTime || null,
            eventTitle
          );
          return { created: false, updated: true, googleEventId: tracking.google_calendar_event_id };
        } else {
          const error = await response.json().catch(() => ({}));
          // Si el evento fue eliminado en Google Calendar, crear uno nuevo
          if (response.status === 404) {
            // Continuar para crear nuevo evento
          } else {
            throw new Error(`Error al actualizar evento: ${error.error?.message || 'Error desconocido'}`);
          }
        }
      } catch (error: any) {
        console.error('Error al actualizar evento existente, intentando crear nuevo:', error);
        // Continuar para crear nuevo evento
      }
    }

    // Crear nuevo evento
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (response.ok) {
        const createdEvent = await response.json();
        const googleEventId = createdEvent.id;
        
        // Guardar tracking
        await supabaseService.saveSyncTracking(
          userId,
          eventType,
          eventId,
          googleEventId,
          eventDate,
          eventTime || null,
          eventTitle
        );
        
        return { created: true, updated: false, googleEventId };
      } else {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Error al crear evento: ${error.error?.message || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  }

  /**
   * Sincroniza eventos académicos a Google Calendar (evita duplicados usando tracking)
   */
  async syncEvents(
    userId: string,
    subjects: Subject[],
    customEvents: CustomCalendarEvent[]
  ): Promise<{ created: number; updated: number; errors: number }> {
    if (!this.calendarId) {
      await this.getOrCreateStudiantaCalendar();
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Sincronizar milestones de subjects
    for (const subject of subjects) {
      for (const milestone of subject.milestones) {
        try {
          const validation = this.validateAndFormatDate(milestone.date, milestone.time);
          
          if (!validation.isValid) {
            console.error(`[Google Calendar] Error validando milestone "${milestone.title}": ${validation.error}`);
            errors++;
            continue;
          }

          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const eventTitle = `${milestone.type}: ${subject.name}`;
          let googleEvent: GoogleCalendarEvent;
          
          if (milestone.time && validation.dateTime) {
            // Evento con hora
            // Calcular fecha de fin sumando 2 horas directamente en el string (sin conversión UTC)
            const [datePart, timePart] = validation.dateTime.split('T');
            const [hours, minutes] = timePart.split(':').map(Number);
            let endHours = hours + 2;
            let endDatePart = datePart;
            
            // Manejar cambio de día si las horas exceden 24
            if (endHours >= 24) {
              endHours = endHours - 24;
              const date = new Date(datePart);
              date.setDate(date.getDate() + 1);
              endDatePart = date.toISOString().slice(0, 10);
            }
            
            const endHoursStr = endHours.toString().padStart(2, '0');
            const endMinutesStr = minutes.toString().padStart(2, '0');
            const endDateTime = `${endDatePart}T${endHoursStr}:${endMinutesStr}:00`;

            googleEvent = {
              summary: `[Studianta] ${eventTitle}`,
              description: `Materia: ${subject.name}\nTipo: ${milestone.type}\n${milestone.title}`,
              start: { dateTime: validation.dateTime, timeZone },
              end: { dateTime: endDateTime, timeZone },
              colorId: milestone.type === 'Examen' ? '6' : '9',
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 1440 },
                  { method: 'popup', minutes: 60 },
                ],
              },
            };
          } else if (validation.date) {
            // Evento de día completo
            googleEvent = {
              summary: `[Studianta] ${eventTitle}`,
              description: `Materia: ${subject.name}\nTipo: ${milestone.type}\n${milestone.title}`,
              start: { date: validation.date },
              end: { date: validation.date },
              colorId: milestone.type === 'Examen' ? '6' : '9',
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 1440 },
                  { method: 'popup', minutes: 60 },
                ],
              },
            };
          } else {
            continue;
          }

          const result = await this.syncSingleEvent(
            userId,
            'milestone',
            milestone.id,
            googleEvent,
            eventTitle,
            milestone.date,
            milestone.time
          );

          if (result.created) created++;
          if (result.updated) updated++;
        } catch (error: any) {
          console.error(`Error sincronizando milestone "${milestone.title}":`, error);
          errors++;
        }
      }
    }

    // Sincronizar custom events
    for (const event of customEvents) {
      try {
        const validation = this.validateAndFormatDate(event.date, event.time);
        
        if (!validation.isValid) {
          console.error(`[Google Calendar] Error validando evento personalizado "${event.title}": ${validation.error}`);
          errors++;
          continue;
        }

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let googleEvent: GoogleCalendarEvent;

        if (event.time && validation.dateTime) {
          // Evento con hora
          // Calcular fecha de fin sumando 2 horas directamente en el string (sin conversión UTC)
          const [datePart, timePart] = validation.dateTime.split('T');
          const [hours, minutes] = timePart.split(':').map(Number);
          let endHours = hours + 2;
          let endDatePart = datePart;
          
          // Manejar cambio de día si las horas exceden 24
          if (endHours >= 24) {
            endHours = endHours - 24;
            endDatePart = this.getNextDay(datePart);
          }
          
          const endHoursStr = endHours.toString().padStart(2, '0');
          const endMinutesStr = minutes.toString().padStart(2, '0');
          const endDateTime = `${endDatePart}T${endHoursStr}:${endMinutesStr}:00`;

          googleEvent = {
            summary: `[Studianta] ${event.title}`,
            description: event.description || '',
            start: { dateTime: validation.dateTime, timeZone },
            end: { dateTime: endDateTime, timeZone },
            colorId: event.priority === 'high' ? '6' : '1',
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 1440 },
                { method: 'popup', minutes: 60 },
              ],
            },
          };
        } else if (validation.date) {
          // Evento de día completo
          googleEvent = {
            summary: `[Studianta] ${event.title}`,
            description: event.description || '',
            start: { date: validation.date },
            end: { date: validation.date },
            colorId: event.priority === 'high' ? '6' : '1',
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 1440 },
                { method: 'popup', minutes: 60 },
              ],
            },
          };
        } else {
          continue;
        }

        const result = await this.syncSingleEvent(
          userId,
          'custom_event',
          event.id,
          googleEvent,
          event.title,
          event.date,
          event.time
        );

        if (result.created) created++;
        if (result.updated) updated++;
      } catch (error: any) {
        // Si es error de permisos, propagarlo
        if (error.message && error.message.includes('Error de permisos')) {
          throw error;
        }
        console.error(`Error sincronizando evento "${event.title}":`, error);
        errors++;
      }
    }

    return { created, updated, errors };
  }

  /**
   * Sincroniza un milestone individual automáticamente
   */
  async syncMilestone(
    userId: string,
    subject: Subject,
    milestone: Milestone
  ): Promise<void> {
    if (!this.isConnected(userId)) {
      return; // No está conectado, no hacer nada
    }

    try {
      const validation = this.validateAndFormatDate(milestone.date, milestone.time);
      
      if (!validation.isValid) {
        console.error(`[Google Calendar] Error validando milestone "${milestone.title}": ${validation.error}`);
        return;
      }

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventTitle = `${milestone.type}: ${subject.name}`;
      let googleEvent: GoogleCalendarEvent;
      
      if (milestone.time && validation.dateTime) {
        // Calcular fecha de fin sumando 2 horas directamente en el string (sin conversión UTC)
        const [datePart, timePart] = validation.dateTime.split('T');
        const [hours, minutes] = timePart.split(':').map(Number);
        let endHours = hours + 2;
        let endDatePart = datePart;
        
        // Manejar cambio de día si las horas exceden 24
        if (endHours >= 24) {
          endHours = endHours - 24;
          const date = new Date(datePart);
          date.setDate(date.getDate() + 1);
          endDatePart = date.toISOString().slice(0, 10);
        }
        
        const endHoursStr = endHours.toString().padStart(2, '0');
        const endMinutesStr = minutes.toString().padStart(2, '0');
        const endDateTime = `${endDatePart}T${endHoursStr}:${endMinutesStr}:00`;

        googleEvent = {
          summary: `[Studianta] ${eventTitle}`,
          description: `Materia: ${subject.name}\nTipo: ${milestone.type}\n${milestone.title}`,
          start: { dateTime: validation.dateTime, timeZone },
          end: { dateTime: endDateTime, timeZone },
          colorId: milestone.type === 'Examen' ? '6' : '9',
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 1440 },
              { method: 'popup', minutes: 60 },
            ],
          },
        };
      } else if (validation.date) {
        googleEvent = {
          summary: `[Studianta] ${eventTitle}`,
          description: `Materia: ${subject.name}\nTipo: ${milestone.type}\n${milestone.title}`,
          start: { date: validation.date },
          end: { date: validation.date },
          colorId: milestone.type === 'Examen' ? '6' : '9',
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 1440 },
              { method: 'popup', minutes: 60 },
            ],
          },
        };
      } else {
        return;
      }

      await this.syncSingleEvent(
        userId,
        'milestone',
        milestone.id,
        googleEvent,
        eventTitle,
        milestone.date,
        milestone.time
      );
    } catch (error: any) {
      console.error(`Error sincronizando milestone "${milestone.title}":`, error);
      // No lanzar error, solo loguear para no interrumpir el flujo
    }
  }

  /**
   * Sincroniza un custom event individual automáticamente
   */
  async syncCustomEvent(
    userId: string,
    event: CustomCalendarEvent
  ): Promise<void> {
    if (!this.isConnected(userId)) {
      return; // No está conectado, no hacer nada
    }

    try {
      const validation = this.validateAndFormatDate(event.date, event.time);
      
      if (!validation.isValid) {
        console.error(`[Google Calendar] Error validando evento "${event.title}": ${validation.error}`);
        return;
      }

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      let googleEvent: GoogleCalendarEvent;

      if (event.time && validation.dateTime) {
        // Calcular fecha de fin sumando 2 horas directamente en el string (sin conversión UTC)
        const [datePart, timePart] = validation.dateTime.split('T');
        const [hours, minutes] = timePart.split(':').map(Number);
        let endHours = hours + 2;
        let endDatePart = datePart;
        
        // Manejar cambio de día si las horas exceden 24
        if (endHours >= 24) {
          endHours = endHours - 24;
          const date = new Date(datePart);
          date.setDate(date.getDate() + 1);
          endDatePart = date.toISOString().slice(0, 10);
        }
        
        const endHoursStr = endHours.toString().padStart(2, '0');
        const endMinutesStr = minutes.toString().padStart(2, '0');
        const endDateTime = `${endDatePart}T${endHoursStr}:${endMinutesStr}:00`;

        googleEvent = {
          summary: `[Studianta] ${event.title}`,
          description: event.description || '',
          start: { dateTime: validation.dateTime, timeZone },
          end: { dateTime: endDateTime, timeZone },
          colorId: event.priority === 'high' ? '6' : '1',
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 1440 },
              { method: 'popup', minutes: 60 },
            ],
          },
        };
      } else if (validation.date) {
        googleEvent = {
          summary: `[Studianta] ${event.title}`,
          description: event.description || '',
          start: { date: validation.date },
          end: { date: validation.date },
          colorId: event.priority === 'high' ? '6' : '1',
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 1440 },
              { method: 'popup', minutes: 60 },
            ],
          },
        };
      } else {
        return;
      }

      await this.syncSingleEvent(
        userId,
        'custom_event',
        event.id,
        googleEvent,
        event.title,
        event.date,
        event.time
      );
    } catch (error: any) {
      console.error(`Error sincronizando evento "${event.title}":`, error);
      // No lanzar error, solo loguear para no interrumpir el flujo
    }
  }

  /**
   * Elimina un evento de Google Calendar cuando se elimina en Studianta
   */
  async deleteSyncedEvent(
    userId: string,
    eventType: 'milestone' | 'custom_event',
    eventId: string
  ): Promise<void> {
    if (!this.isConnected(userId)) {
      return;
    }

    try {
      const tracking = await supabaseService.getSyncTracking(userId, eventType, eventId);
      
      if (tracking && tracking.google_calendar_event_id) {
        if (!this.calendarId) {
          await this.getOrCreateStudiantaCalendar();
        }

        const token = await this.getValidAccessToken();
        
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${tracking.google_calendar_event_id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok || response.status === 404) {
          // Eliminar tracking (404 significa que ya fue eliminado)
          await supabaseService.deleteSyncTracking(userId, eventType, eventId);
        }
      }
    } catch (error: any) {
      console.error('Error eliminando evento de Google Calendar:', error);
      // No lanzar error, solo loguear
    }
  }

  /**
   * Guarda los tokens en el almacenamiento local
   */
  saveTokens(userId: string, tokens: GoogleCalendarToken): void {
    localStorage.setItem(`google_calendar_${userId}`, JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
    }));

    // También actualizar instancia
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token || null;
    this.expiresAt = tokens.expires_at || null;
  }

  /**
   * Carga los tokens desde el almacenamiento local
   */
  loadTokens(userId: string): boolean {
    const stored = localStorage.getItem(`google_calendar_${userId}`);
    if (!stored) return false;

    try {
      const tokens = JSON.parse(stored);
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token || null;
      this.expiresAt = tokens.expires_at || null;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si hay tokens guardados
   */
  isConnected(userId: string): boolean {
    return this.loadTokens(userId) && !!this.accessToken;
  }

  /**
   * Desconecta la cuenta de Google Calendar
   */
  disconnect(userId: string): void {
    localStorage.removeItem(`google_calendar_${userId}`);
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.calendarId = null;
  }

  /**
   * Genera un state aleatorio para OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const googleCalendarService = new GoogleCalendarService();

