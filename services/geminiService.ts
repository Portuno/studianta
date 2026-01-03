
// Servicio de Gemini que usa endpoint del servidor para proteger la API key
// La API key ahora está en el servidor (Vercel) y nunca se expone al cliente
// En desarrollo local, usa la API directamente (solo para desarrollo)

import { GoogleGenAI } from "@google/genai";

const API_ENDPOINT = '/api/gemini';
const IS_DEVELOPMENT = import.meta.env.DEV || import.meta.env.MODE === 'development';

export class GeminiService {
  constructor() {}

  private async callServerEndpoint(type: 'academic' | 'finance', params: any): Promise<string> {
    // En desarrollo local, usar la API directamente (solo para desarrollo)
    if (IS_DEVELOPMENT) {
      return this.callDirectAPI(type, params);
    }

    // En producción, usar el endpoint del servidor
    try {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
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
      return data.text || 'No se recibió respuesta del Oráculo.';
    } catch (error: any) {
      console.error(`Gemini ${type} Error:`, error);
      
      // Error de red o conexión
      if (error.message?.includes('fetch') || error.message?.includes('Network') || error.message?.includes('404')) {
        return "📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: Error de conexión con la red arcana.\n\n💡 EXPLICACIÓN: No he podido canalizar la respuesta del Oráculo. Por favor, verifica tu conexión o intenta en unos instantes.";
      }

      return `📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: ${error.message || 'Error desconocido'}\n\n💡 EXPLICACIÓN: Por favor, intenta nuevamente o verifica la configuración del servidor.`;
    }
  }

  // Método para desarrollo local (usa la API directamente)
  private async callDirectAPI(type: 'academic' | 'finance', params: any): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
    
    if (!apiKey) {
      return "⚠️ MODO DESARROLLO: Por favor, configura VITE_GEMINI_API_KEY en tu archivo .env.local para desarrollo local.\n\nEn producción, la API key estará protegida en el servidor.";
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      if (type === 'academic') {
        const { subjectName, prompt, context } = params;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{
            parts: [{
              text: `${context ? `--- CONTEXTO ACADÉMICO Y MATERIALES ---\n${context}\n--- FIN CONTEXTO ---\n\n` : ''}Pregunta del estudiante: ${prompt}`
            }]
          }],
          config: {
            systemInstruction: `Eres el Oráculo Académico de Studianta, un tutor de élite para la asignatura "${subjectName}". 
            Tu tono es místico, erudito y profundamente empoderador.
            
            REGLAS DE ORO:
            - Estructura con encabezados: 📌 RECONOCIMIENTO, 📖 CONTEXTO, 💡 EXPLICACIÓN, 📚 EJEMPLO, ❓ PREGUNTA DE SEGUIMIENTO.
            - Si el estudiante proporcionó materiales (Syllabus/Apuntes), úsalos como base principal.
            - Mantén un lenguaje sofisticado pero de fácil asimilación.`,
            temperature: 0.7,
          }
        });
        return response.text;
      }

      if (type === 'finance') {
        const { budget, transactions } = params;
        
        const transactionsContext = transactions.map((t: any) => 
          `${t.date}: ${t.amount} en ${t.category} (${t.description})`
        ).join('\n');
        
        const spent = transactions.reduce((acc: number, t: any) => 
          acc + (t.type === 'Gasto' ? t.amount : 0), 0
        );
        const income = transactions.reduce((acc: number, t: any) => 
          acc + (t.type === 'Ingreso' ? t.amount : 0), 0
        );
        const balance = (budget + income) - spent;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{
            parts: [{
              text: `ESTADO FINANCIERO:\nPresupuesto: $${budget}\nBalance: $${balance}\nÚltimos Movimientos:\n${transactionsContext}`
            }]
          }],
          config: {
            systemInstruction: `Eres el Oráculo de la Balanza de Latón. Proporciona un diagnóstico financiero sofisticado y aristocrático.`,
            temperature: 0.5,
          }
        });
        return response.text;
      }

      return 'Tipo de consulta no válido';
    } catch (error: any) {
      console.error(`Gemini ${type} Error (Direct API):`, error);
      
      // Manejo específico de errores de API key
      if (error?.status === 403 || error?.message?.includes('API key') || error?.message?.includes('leaked') || error?.message?.includes('PERMISSION_DENIED')) {
        return "🔐 ERROR DE SEGURIDAD:\n\nLa API key ha sido invalidada o comprometida.\n\nPor favor, genera una nueva API key en Google AI Studio y actualiza VITE_GEMINI_API_KEY en tu archivo .env.local\n\nPara obtener una nueva clave:\n1. Visita https://aistudio.google.com/apikey\n2. Crea una nueva API key\n3. Actualiza VITE_GEMINI_API_KEY en tu .env.local";
      }
      
      return "📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: Error de conexión con la red arcana.\n\n💡 EXPLICACIÓN: No he podido canalizar la respuesta del Oráculo. Por favor, verifica tu conexión o intenta en unos instantes.";
    }
  }

  async queryAcademicOracle(subjectName: string, prompt: string, context: string, studentProfile: any) {
    return this.callServerEndpoint('academic', {
      subjectName,
      prompt,
      context,
      studentProfile,
    });
  }

  async analyzeFinancialHealth(budget: number, transactions: any[]) {
    return this.callServerEndpoint('finance', {
      budget,
      transactions,
    });
  }
}

export const geminiService = new GeminiService();
