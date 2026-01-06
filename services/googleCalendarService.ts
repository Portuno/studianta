import { Subject, CustomCalendarEvent } from '../types';

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

    // Validar formato de hora (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(timeStr)) {
      return { isValid: false, error: `Formato de hora inválido: ${timeStr}` };
    }

    // Construir fecha/hora completa
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const dateTime = new Date(dateTimeStr);
    
    if (isNaN(dateTime.getTime())) {
      return { isValid: false, error: `Fecha/hora inválida: ${dateTimeStr}` };
    }

    return { isValid: true, dateTime: dateTime.toISOString() };
  }

  /**
   * Sincroniza eventos académicos a Google Calendar
   */
  async syncEvents(
    subjects: Subject[],
    customEvents: CustomCalendarEvent[]
  ): Promise<{ created: number; errors: number }> {
    if (!this.calendarId) {
      await this.getOrCreateStudiantaCalendar();
    }

    const token = await this.getValidAccessToken();
    let created = 0;
    let errors = 0;

    // Extraer eventos de milestones de subjects
    const milestoneEvents: GoogleCalendarEvent[] = [];
    subjects.forEach(subject => {
      subject.milestones.forEach(milestone => {
        const validation = this.validateAndFormatDate(milestone.date, milestone.time);
        
        if (!validation.isValid) {
          console.error(`[Google Calendar] Error validando milestone "${milestone.title}": ${validation.error}`);
          errors++;
          return;
        }

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        if (milestone.time && validation.dateTime) {
          // Evento con hora
          const startDate = new Date(validation.dateTime);
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 horas
          
          if (isNaN(endDate.getTime())) {
            console.error(`[Google Calendar] Error calculando fecha de fin para milestone "${milestone.title}"`);
            errors++;
            return;
          }

          milestoneEvents.push({
            summary: `[Studianta] ${milestone.type}: ${subject.name}`,
            description: `Materia: ${subject.name}\nTipo: ${milestone.type}\n${milestone.title}`,
            start: { dateTime: validation.dateTime, timeZone },
            end: { dateTime: endDate.toISOString(), timeZone },
            colorId: milestone.type === 'Examen' ? '6' : '9', // 6 = naranja (examen), 9 = azul (entrega)
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 1440 }, // 1 día antes
                { method: 'popup', minutes: 60 },  // 1 hora antes
              ],
            },
          });
        } else if (validation.date) {
          // Evento de día completo
          milestoneEvents.push({
            summary: `[Studianta] ${milestone.type}: ${subject.name}`,
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
          });
        }
      });
    });

    // Convertir customEvents a formato Google Calendar
    const customGoogleEvents: GoogleCalendarEvent[] = [];
    customEvents.forEach(event => {
      const validation = this.validateAndFormatDate(event.date, event.time);
      
      if (!validation.isValid) {
        console.error(`[Google Calendar] Error validando evento personalizado "${event.title}": ${validation.error}`);
        errors++;
        return;
      }

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (event.time && validation.dateTime) {
        // Evento con hora
        const startDate = new Date(validation.dateTime);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 horas
        
        if (isNaN(endDate.getTime())) {
          console.error(`[Google Calendar] Error calculando fecha de fin para evento "${event.title}"`);
          errors++;
          return;
        }

        customGoogleEvents.push({
          summary: `[Studianta] ${event.title}`,
          description: event.description || '',
          start: { dateTime: validation.dateTime, timeZone },
          end: { dateTime: endDate.toISOString(), timeZone },
          colorId: event.priority === 'high' ? '6' : '1',
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 1440 },
              { method: 'popup', minutes: 60 },
            ],
          },
        });
      } else if (validation.date) {
        // Evento de día completo
        customGoogleEvents.push({
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
        });
      }
    });

    // Combinar todos los eventos
    const allEvents = [...milestoneEvents, ...customGoogleEvents];

    // Crear eventos en Google Calendar
    for (const event of allEvents) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );

        if (response.ok) {
          created++;
        } else {
          const error = await response.json().catch(() => ({}));
          
          // Si es error de permisos, lanzar error para que se maneje arriba
          if (this.isInsufficientPermissionsError(response, error)) {
            const userId = this.getUserIdFromStorage();
            if (userId) {
              this.clearTokensAndForceReauth(userId);
            }
            throw new Error(
              'Error de permisos: El token no tiene los permisos necesarios para crear eventos.\n\n' +
              'Por favor, desconecta y vuelve a conectar tu cuenta de Google Calendar.'
            );
          }
          
          console.error('Error al crear evento:', error);
          errors++;
        }
      } catch (error: any) {
        // Si es error de permisos, propagarlo
        if (error.message && error.message.includes('Error de permisos')) {
          throw error;
        }
        console.error('Error al crear evento:', error);
        errors++;
      }
    }

    return { created, errors };
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

