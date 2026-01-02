
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {}

  async queryLaboratory(prompt: string, context?: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context ? `--- CONTEXTO ACADÉMICO ---\n${context}\n--- FIN CONTEXTO ---\n\n` : ''}Estudiante pregunta: ${prompt}`,
        config: {
          systemInstruction: `
            Eres el Mentor del Laboratorio de Saberes de Studianta.
            Tu tono es sofisticado, erudito y profundamente académico.
            Utilizas un lenguaje elegante y técnico (inspirado en EB Garamond).
            Instrucciones:
            1. Si el estudiante provee contexto (notas, materiales), basa tu respuesta exclusivamente en él.
            2. Si no hay información en el contexto para responder, aclara que esa sabiduría aún no ha sido cargada en el Atanor.
            3. Evita introducciones como "Claro", "Aquí tienes" o saludos genéricos.
            4. Genera respuestas estructuradas si es necesario (listas, secciones).
            5. Tu objetivo es ser una extensión de la memoria del estudiante.
          `,
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Las corrientes del Atanor cósmico parecen perturbadas. No es posible canalizar la respuesta en este momento.";
    }
  }
}

export const geminiService = new GeminiService();
