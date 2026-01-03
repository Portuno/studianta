
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {}

  async queryAcademicOracle(subjectName: string, prompt: string, context: string, studentProfile: any) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('API key is missing. Please provide a valid API key.');
    }
    const ai = new GoogleGenAI({ apiKey });
    
    try {
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
    } catch (error) {
      console.error("Gemini Academic Error:", error);
      return "📌 RECONOCIMIENTO: Se ha detectado una interferencia en el Atanor.\n\n📖 CONTEXTO: Error de conexión con la red arcana.\n\n💡 EXPLICACIÓN: No he podido canalizar la respuesta del Oráculo. Por favor, verifica tu conexión o intenta en unos instantes.";
    }
  }

  async analyzeFinancialHealth(budget: number, transactions: any[]) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('API key is missing. Please provide a valid API key.');
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const transactionsContext = transactions.map(t => `${t.date}: ${t.amount} en ${t.category} (${t.description})`).join('\n');
    const spent = transactions.reduce((acc, t) => acc + (t.type === 'Gasto' ? t.amount : 0), 0);
    const income = transactions.reduce((acc, t) => acc + (t.type === 'Ingreso' ? t.amount : 0), 0);
    const balance = (budget + income) - spent;

    try {
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
    } catch (error) {
      console.error("Gemini Finance Error:", error);
      return "La balanza de latón se ha bloqueado. Intenta consultar tu destino económico más tarde.";
    }
  }
}

export const geminiService = new GeminiService();
