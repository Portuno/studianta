
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {}

  async queryAcademicOracle(subjectName: string, prompt: string, context: string, studentProfile: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [{
            text: `${context ? `--- FUENTES DE ESTUDIO ---\n${context}\n--- FIN FUENTES ---\n\n` : ''}Pregunta del estudiante: ${prompt}`
          }]
        },
        config: {
          systemInstruction: `Eres el Oráculo Académico de Studianta, un tutor especializado en la asignatura "${subjectName}". 
          Tu tono es erudito, empoderador y sumamente claro. 
          
          REGLAS DE RESPUESTA:
          1. Utiliza prioritariamente el material de las fuentes proporcionadas.
          2. Estructura tu respuesta con estos encabezados exactos: 📌 RECONOCIMIENTO, 📖 CONTEXTO, 💡 EXPLICACIÓN, 📚 EJEMPLO, ❓ PREGUNTA DE SEGUIMIENTO.
          3. Mantén un lenguaje elegante pero accesible.
          4. No inventes datos fuera del contexto académico si el estudiante pregunta sobre sus apuntes específicos.`,
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Academic Error:", error);
      return "📌 RECONOCIMIENTO: Se ha producido una fractura en el flujo de conocimiento.\n\n📖 CONTEXTO: Error interno de canalización.\n\n💡 EXPLICACIÓN: El Oráculo no puede responder en este momento debido a una inestabilidad en el éter digital (Error 500). Por favor, intenta de nuevo en unos instantes.";
    }
  }

  async analyzeFinancialHealth(budget: number, transactions: any[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const transactionsContext = transactions.map(t => `${t.date}: ${t.amount} en ${t.category} (${t.description})`).join('\n');
    const spent = transactions.reduce((acc, t) => acc + (t.type === 'Gasto' ? t.amount : 0), 0);
    const income = transactions.reduce((acc, t) => acc + (t.type === 'Ingreso' ? t.amount : 0), 0);
    const balance = (budget + income) - spent;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [{
            text: `CONTEXTO FINANCIERO:\nPresupuesto Mensual: $${budget}\nCapital Actual: $${balance}\nGastos e Ingresos recientes:\n${transactionsContext}`
          }]
        },
        config: {
          systemInstruction: `Eres el Oráculo de la Balanza de Latón. Proporciona un diagnóstico financiero místico pero muy útil. Analiza si el presupuesto es sostenible basado en los gastos. Usa un lenguaje sofisticado y EB Garamond como referencia estética mental.`,
          temperature: 0.5,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Finance Error:", error);
      return "La balanza de latón se ha bloqueado. No es posible leer los astros financieros en este momento.";
    }
  }
}

export const geminiService = new GeminiService();
