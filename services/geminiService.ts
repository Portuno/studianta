
// Servicio de Gemini que usa endpoint del servidor para proteger la API key
// La API key está en el servidor y nunca se expone al cliente
// Siempre usa el endpoint del servidor (tanto en desarrollo como en producción)
// Permite usar GEMINI_API_KEY sin prefijo VITE_ en el servidor

import { StudentProfileContext } from '../types';

const API_ENDPOINT = '/api/gemini';

export class GeminiService {
  constructor() {}

  private async callServerEndpoint(type: 'academic' | 'finance' | 'personal', params: any): Promise<string> {
    // Siempre usar el endpoint del servidor (tanto en desarrollo como en producción)
    // Esto permite usar GEMINI_API_KEY sin prefijo VITE_ en el servidor
    try {
      console.log(`[GeminiService] Llamando a ${API_ENDPOINT} con tipo: ${type}`);
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...params,
        }),
      });

      console.log(`[GeminiService] Respuesta recibida:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[GeminiService] Error en respuesta:`, errorData);
        
        // Manejo específico de errores de API key
        if (response.status === 403 || errorData.message?.includes('API key')) {
          return `🔐 ERROR DE SEGURIDAD:\n\nLa API key ha sido invalidada o comprometida.\n\nPor favor, actualiza GEMINI_API_KEY en las variables de entorno de Vercel (no VITE_GEMINI_API_KEY).\n\nPara obtener una nueva clave:\n1. Visita https://aistudio.google.com/apikey\n2. Crea una nueva API key\n3. Agrega GEMINI_API_KEY en Vercel Dashboard → Settings → Environment Variables`;
        }

        if (response.status === 500) {
          return `📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: Error de conexión con la red arcana.\n\n💡 EXPLICACIÓN: ${errorData.message || 'Error desconocido. Por favor, intenta más tarde.'}`;
        }

        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      console.log(`[GeminiService] Datos recibidos:`, { hasText: !!data.text, textLength: data.text?.length });
      return data.text || 'No se recibió respuesta del Oráculo.';
    } catch (error: any) {
      console.error(`[GeminiService] Error en ${type}:`, error);
      console.error(`[GeminiService] Detalles del error:`, {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      
      // Error de red o conexión
      if (
        error.message?.includes('fetch') || 
        error.message?.includes('Network') || 
        error.message?.includes('404') ||
        error.message?.includes('Failed to fetch') ||
        error.name === 'TypeError'
      ) {
        return "📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: Error de conexión con la red arcana.\n\n💡 EXPLICACIÓN: No he podido canalizar la respuesta del Oráculo. Por favor, verifica tu conexión o intenta en unos instantes.";
      }

      return `📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: ${error.message || 'Error desconocido'}\n\n💡 EXPLICACIÓN: Por favor, intenta nuevamente o verifica la configuración del servidor.`;
    }
  }


  async queryAcademicOracle(
    subjectName: string, 
    prompt: string, 
    context: string, 
    studentProfileContext?: StudentProfileContext
  ) {
    return this.callServerEndpoint('academic', {
      subjectName,
      prompt,
      context,
      studentProfileContext,
    });
  }

  async analyzeFinancialHealth(budget: number, transactions: any[]) {
    return this.callServerEndpoint('finance', {
      budget,
      transactions,
    });
  }

  async queryPersonalOracle(
    prompt: string,
    studentProfileContext: StudentProfileContext,
    messageHistory?: Array<{ role: 'user' | 'oracle'; content: string }>
  ) {
    return this.callServerEndpoint('personal', {
      prompt,
      studentProfileContext,
      messageHistory: messageHistory || [],
    });
  }

  async generateExam(
    subjectName: string,
    materialsText: string | string[],
    examType: 'multiple-choice' | 'true-false' | 'open-ended' | 'cloze' | 'case-study',
    questionCount: number,
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed'
  ): Promise<any> {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'exam-generation',
          subjectName,
          materialsText: Array.isArray(materialsText) ? materialsText : [materialsText],
          examType,
          questionCount,
          difficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      return data.exam || data;
    } catch (error: any) {
      console.error('Error generating exam:', error);
      throw new Error(`Error al generar el examen: ${error.message || 'Error desconocido'}`);
    }
  }
}

export const geminiService = new GeminiService();
