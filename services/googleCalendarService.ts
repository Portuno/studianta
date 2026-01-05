import { Subject, CustomCalendarEvent } from '../types';

// Configuración de OAuth2 de Google Calendar
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = window.location.origin + window.location.pathname;
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

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
   * Inicia el flujo de OAuth2 para obtener permisos de Google Calendar
   */
  async initiateOAuth(): Promise<void> {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('VITE_GOOGLE_CLIENT_ID no está configurado en las variables de entorno');
    }

    // Construir redirect_uri dinámicamente basado en la URL actual
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    const redirectUri = currentOrigin + currentPath;

    // Log para debugging (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('[Google Calendar] Redirect URI:', redirectUri);
      console.log('[Google Calendar] Asegúrate de que esta URI esté registrada en Google Cloud Console');
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState(),
    });

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
   * NOTA: En producción, esto debe hacerse en el backend
   */
  private async exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleCalendarToken> {
    const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    
    // Verificar que el Client ID esté configurado
    if (!GOOGLE_CLIENT_ID) {
      throw new Error(
        'VITE_GOOGLE_CLIENT_ID no está configurado.\n\n' +
        'Por favor, añade VITE_GOOGLE_CLIENT_ID a tu archivo .env o .env.local'
      );
    }
    
    // Si no hay secret, intentar usar un endpoint backend
    if (!GOOGLE_CLIENT_SECRET) {
      // Usar un endpoint de Supabase Edge Function o backend propio
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/google/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(`Error al intercambiar código por token: ${error.error || error.message || 'Error desconocido'}`);
        }
        
        return await response.json();
      }
      
      throw new Error(
        'VITE_GOOGLE_CLIENT_SECRET no está configurado.\n\n' +
        'Para desarrollo local, añade VITE_GOOGLE_CLIENT_SECRET a tu archivo .env o .env.local:\n' +
        'VITE_GOOGLE_CLIENT_SECRET=tu_client_secret_aqui\n\n' +
        '⚠️ IMPORTANTE: En producción, NO expongas el CLIENT_SECRET en el frontend.\n' +
        'Usa un backend (Supabase Edge Function o servidor propio) para manejar el intercambio de tokens.\n\n' +
        'Consulta GOOGLE_CALENDAR_SETUP.md para más información.'
      );
    }

    // Intercambio directo (solo para desarrollo, no usar en producción)
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido', error_description: 'No se pudo parsear la respuesta del servidor' }));
      const errorMessage = error.error_description || error.error || 'Error desconocido';
      
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
          `Consulta GOOGLE_CALENDAR_SETUP.md para más detalles.`
        );
      }
      
      if (error.error === 'invalid_client' || response.status === 401) {
        throw new Error(
          `Error de autenticación: Client ID o Client Secret inválidos.\n\n` +
          `Posibles causas:\n` +
          `1. VITE_GOOGLE_CLIENT_SECRET no está configurado o es incorrecto\n` +
          `2. VITE_GOOGLE_CLIENT_ID no coincide con el Client Secret\n` +
          `3. El Client Secret ha sido regenerado en Google Cloud Console\n\n` +
          `Solución:\n` +
          `1. Verifica que VITE_GOOGLE_CLIENT_ID y VITE_GOOGLE_CLIENT_SECRET estén en tu archivo .env o .env.local\n` +
          `2. Asegúrate de que correspondan al mismo OAuth Client ID en Google Cloud Console\n` +
          `3. Reinicia el servidor de desarrollo después de cambiar las variables\n\n` +
          `Consulta GOOGLE_CALENDAR_SETUP.md para más información.`
        );
      }
      
      if (error.error === 'invalid_grant') {
        throw new Error(
          `Error: El código de autorización ha expirado o ya fue usado.\n\n` +
          `Por favor, intenta conectar nuevamente.`
        );
      }
      
      throw new Error(`Error al obtener token: ${errorMessage}\n\nCódigo de error: ${error.error || 'desconocido'}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
    };
  }

  /**
   * Refresca el token de acceso si está expirado
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No hay refresh token disponible. Por favor, vuelve a autorizar.');
    }

    const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    
    if (!GOOGLE_CLIENT_SECRET) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/google/oauth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
        
        if (!response.ok) {
          throw new Error('Error al refrescar token');
        }
        
        const data = await response.json();
        this.accessToken = data.access_token;
        this.expiresAt = Date.now() + (data.expires_in * 1000);
        return this.accessToken;
      }
      
      throw new Error('VITE_GOOGLE_CLIENT_SECRET o VITE_BACKEND_URL debe estar configurado');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: this.refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Error al refrescar token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
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

    if (listResponse.ok) {
      const data = await listResponse.json();
      const existingCalendar = data.items?.find(
        (cal: any) => cal.summary === calendarName
      );

      if (existingCalendar) {
        this.calendarId = existingCalendar.id;
        return existingCalendar.id;
      }
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
      const error = await createResponse.json();
      throw new Error(`Error al crear calendario: ${error.error?.message || 'Error desconocido'}`);
    }

    const calendar = await createResponse.json();
    this.calendarId = calendar.id;
    return calendar.id;
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
        const eventDate = new Date(milestone.date);
        const startDateTime = milestone.time
          ? `${milestone.date}T${milestone.time}:00`
          : milestone.date;

        milestoneEvents.push({
          summary: `[Studianta] ${milestone.type}: ${subject.name}`,
          description: `Materia: ${subject.name}\nTipo: ${milestone.type}\n${milestone.title}`,
          start: milestone.time
            ? { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
            : { date: milestone.date },
          end: milestone.time
            ? { 
                dateTime: new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              }
            : { date: milestone.date },
          colorId: milestone.type === 'Examen' ? '6' : '9', // 6 = naranja (examen), 9 = azul (entrega)
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 1440 }, // 1 día antes
              { method: 'popup', minutes: 60 },  // 1 hora antes
            ],
          },
        });
      });
    });

    // Convertir customEvents a formato Google Calendar
    const customGoogleEvents: GoogleCalendarEvent[] = customEvents.map(event => {
      const startDateTime = event.time
        ? `${event.date}T${event.time}:00`
        : event.date;

      return {
        summary: `[Studianta] ${event.title}`,
        description: event.description || '',
        start: event.time
          ? { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
          : { date: event.date },
        end: event.time
          ? {
              dateTime: new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          : { date: event.date },
        colorId: event.priority === 'high' ? '6' : '1',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 1440 },
            { method: 'popup', minutes: 60 },
          ],
        },
      };
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
          const error = await response.json();
          console.error('Error al crear evento:', error);
          errors++;
        }
      } catch (error) {
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

