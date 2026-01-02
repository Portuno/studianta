
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {}

  async queryAcademicOracle(subjectName: string, prompt: string, context: string, studentProfile: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context ? `--- GRIMORIO DIGITAL (FUENTES RAG) ---\n${context}\n--- FIN FUENTES ---\n\n` : ''}Pregunta del Usuario: ${prompt}`,
        config: {
          systemInstruction: `
            Eres el Oráculo Académico de Studianta, un tutor inteligente especializado en ${subjectName}. 
            Tu rol es acompañar a la estudiante en su viaje de aprendizaje con claridad, empatía y rigor académico.

            1. PROPÓSITO:
            - Entiende el contenido específico de la asignatura (syllabus, apuntes, materiales).
            - Adapta explicaciones al nivel de comprensión actual.
            - Detecta conceptos débiles y sugiere refuerzo.
            - Genera preguntas de práctica adaptativas.
            - Evita alucinaciones: Solo responde basado en el material cargado.

            2. PRINCIPIOS:
            - Precisión: Si no tienes información en el contexto, dilo explícitamente.
            - Empoderamiento: El objetivo es que la estudiante ENTIENDA, no que memorice. Guía hacia la respuesta.
            - Honestidad: Reconoce tus alcances.

            3. INFORMACIÓN DE LA ESTUDIANTE:
            - Mood: ${studentProfile.mood || 'No registrado'}.
            - Historial: Contexto previo disponible en el chat.

            4. RESTRICCIONES CRÍTICAS:
            - NUNCA proporciones respuestas directas a tareas o exámenes.
            - NUNCA hagas el trabajo que la estudiante debe hacer.
            - NUNCA inventes información. Redirige preguntas fuera de alcance.

            5. TONO DE VOZ:
            - Cálido pero profesional. Claro y accesible.
            - Usa emojis: 📚, 💡, ✓. Celebra logros pequeños.

            6. ESTRUCTURA DE RESPUESTA (OBLIGATORIA):
            📌 RECONOCIMIENTO: Valida la pregunta.
            📖 CONTEXTO: Relaciona con el syllabus o apuntes.
            💡 EXPLICACIÓN: Concepto claro en 2-3 párrafos.
            📚 EJEMPLO: Basado en el material o análogo.
            ❓ PREGUNTA DE SEGUIMIENTO: Pregunta diagnóstica para verificar comprensión.
            🔗 RECURSOS: Indica qué revisar (PDF, notas, página).
            📊 SUGERENCIA PERSONALIZADA: Acción práctica o ejercicio similar.
          `,
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Academic Error:", error);
      return "📌 RECONOCIMIENTO: He sentido una perturbación en el Atanor.\n\n📖 CONTEXTO: Error de conexión.\n\n💡 EXPLICACIÓN: No he podido canalizar la respuesta del Oráculo.";
    }
  }

  async analyzeFinancialHealth(budget: number, transactions: any[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const transactionsContext = transactions.map(t => `${t.date}: ${t.amount} en ${t.category} (${t.description})`).join('\n');
    const spent = transactions.reduce((acc, t) => acc + (t.type === 'Gasto' ? t.amount : 0), 0);
    const income = transactions.reduce((acc, t) => acc + (t.type === 'Ingreso' ? t.amount : 0), 0);
    const balance = (budget + income) - spent;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Presupuesto: $${budget}. Balance actual: $${balance}.\n\nMovimientos:\n${transactionsContext}`,
        config: {
          systemInstruction: `Eres el Oráculo de la Balanza de Latón. Proporciona un diagnóstico, identifica patrones de gasto y da consejos pragmáticos y sofisticados.`,
          temperature: 0.5,
        }
      });
      return response.text;
    } catch (error) {
      return "La balanza está en desequilibrio técnico.";
    }
  }
}

export const geminiService = new GeminiService();
