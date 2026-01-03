// API Route para Gemini - Protege la API key del cliente
// Este endpoint se ejecuta en el servidor, por lo que la API key nunca se expone al cliente

import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener API key del servidor (no VITE_)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key no configurada',
      message: 'Por favor, configura GEMINI_API_KEY en las variables de entorno de Vercel (no VITE_GEMINI_API_KEY)'
    });
  }

  const { type, ...params } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Tipo de consulta requerido' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    if (type === 'academic') {
      // Consulta académica
      const { subjectName, prompt, context, studentProfile } = params;
      
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

      return res.status(200).json({ text: response.text });
    }

    if (type === 'finance') {
      // Análisis financiero
      const { budget, transactions } = params;
      
      const transactionsContext = transactions.map((t) => 
        `${t.date}: ${t.amount} en ${t.category} (${t.description})`
      ).join('\n');
      
      const spent = transactions.reduce((acc, t) => 
        acc + (t.type === 'Gasto' ? t.amount : 0), 0
      );
      const income = transactions.reduce((acc, t) => 
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

      return res.status(200).json({ text: response.text });
    }

    return res.status(400).json({ error: 'Tipo de consulta no válido' });
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Manejo específico de errores de API key
    if (error?.status === 403 || error?.message?.includes('API key') || error?.message?.includes('leaked') || error?.message?.includes('PERMISSION_DENIED')) {
      return res.status(403).json({ 
        error: 'API key inválida o comprometida',
        message: 'Por favor, genera una nueva API key en Google AI Studio y actualiza GEMINI_API_KEY en Vercel'
      });
    }

    return res.status(500).json({ 
      error: 'Error al procesar la consulta',
      message: error?.message || 'Error desconocido'
    });
  }
};

