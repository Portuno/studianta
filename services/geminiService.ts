
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {}

  async queryAcademicOracle(subjectName: string, prompt: string, context: string, studentProfile: any) {
    // Ensure API key is available or fallback to empty string to prevent crash
    const apiKey = (window as any).process?.env?.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [{
            text: `${context ? `--- FUENTES DE ESTUDIO ---\n${context}\n--- FIN FUENTES ---\n\n` : ''}Pregunta del estudiante: ${prompt}`
          }]
        }],
        config: {
          systemInstruction: `Eres el Oráculo Académico de Studianta, un tutor de élite para la asignatura "${subjectName}". 
          Tu tono es místico, erudito y profundamente empoderador.
          
          ESTRUCTURA OBLIGATORIA:
          - Usa encabezados con iconos: 📌 RECONOCIMIENTO, 📖 CONTEXTO, 💡 EXPLICACIÓN, 📚 EJEMPLO, ❓ PREGUNTA DE SEGUIMIENTO.
          - Utiliza un lenguaje elegante y profesional.
          - Si hay fuentes de estudio, básate exclusivamente en ellas.`,
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Academic Error:", error);
      return "📌 RECONOCIMIENTO: Se ha producido una fractura en el flujo de conocimiento.\n\n📖 CONTEXTO: Error de canalización digital.\n\n💡 EXPLICACIÓN: No he podido establecer conexión con el Oráculo en este momento. Por favor, intenta de nuevo.";
    }
  }

  async analyzeFinancialHealth(budget: number, transactions: any[]) {
    const apiKey = (window as any).process?.env?.API_KEY || '';
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
            text: `ESTADO DE LA BALANZA:\nPresupuesto Mensual: $${budget}\nCapital Actual: $${balance}\nMovimientos:\n${transactionsContext}`
          }]
        }],
        config: {
          systemInstruction: `Eres el Oráculo de la Balanza de Latón. Proporciona un diagnóstico financiero místico pero útil. Usa un tono que evoque aristocracia y sabiduría económica.`,
          temperature: 0.5,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Finance Error:", error);
      return "La balanza de latón se encuentra bloqueada por fuerzas externas.";
    }
  }
}

export const geminiService = new GeminiService();
