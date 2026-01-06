// API Route para Gemini - Protege la API key del cliente
// Este endpoint se ejecuta en el servidor, por lo que la API key nunca se expone al cliente

import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener API key del servidor (puede ser GEMINI_API_KEY o VITE_GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key no configurada',
      message: 'Por favor, configura GEMINI_API_KEY en las variables de entorno del servidor (o VITE_GEMINI_API_KEY). En desarrollo local, puedes usar GEMINI_API_KEY en tu archivo .env.local y el servidor la leerá automáticamente.'
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
      const { subjectName, prompt, context, studentProfileContext } = params;
      
      // Formatear el SPC de manera textual
      let spcText = '';
      if (studentProfileContext) {
        const spc = studentProfileContext;
        spcText = `\n\n--- CONTEXTO COMPLETO DEL ESTUDIANTE ---\n`;
        spcText += `Perfil: ${spc.user_profile?.full_name || spc.user_profile?.email || 'Estudiante'} - ${spc.user_profile?.career || 'Sin carrera especificada'} - ${spc.user_profile?.institution || 'Sin institución'}\n`;
        spcText += `Nivel Arcano: ${spc.user_profile?.arcane_level || 'Buscadora de Luz'} (Esencia: ${spc.user_profile?.essence || 0})\n\n`;
        
        if (spc.financial_state && spc.financial_state.transactions && spc.financial_state.transactions.length > 0) {
          spcText += `Estado Financiero: ${spc.financial_state.status || 'N/A'} - Balance: $${spc.financial_state.balance || 0}\n`;
          const recentTransactions = spc.financial_state.transactions.slice(0, 5);
          spcText += `Últimas 5 transacciones: ${recentTransactions.map(t => `${t.date}: ${t.type} $${t.amount} (${t.category})`).join(', ')}\n\n`;
        }
        
        if (spc.subjects && spc.subjects.length > 0) {
          spcText += `Asignaturas Activas: ${spc.academic_summary?.active_subjects_count || 0}\n`;
          spcText += `Próximos Deadlines: ${spc.academic_summary?.upcoming_deadlines || 0} (Próximo: ${spc.academic_summary?.next_critical_date || 'N/A'})\n`;
          spcText += `Asignaturas: ${spc.subjects.map(s => s.name).join(', ')}\n\n`;
        }
        
        if (spc.focus && spc.focus.sessions && spc.focus.sessions.length > 0) {
          spcText += `Patrones de Enfoque: ${spc.focus.summary?.total_hours || 0}h totales, ${spc.focus.summary?.sessions_this_week || 0} sesiones esta semana, constancia: ${((spc.focus.summary?.consistency_score || 0) * 100).toFixed(0)}%\n\n`;
        }
        
        if (spc.journal && spc.journal.entries && spc.journal.entries.length > 0) {
          spcText += `Actividad del Diario: ${spc.journal.summary?.total_entries || 0} entradas, último hace ${spc.journal.summary?.last_entry_days_ago || 0} días, mood más común: ${spc.journal.summary?.most_common_mood || 'N/A'}\n`;
          const recentEntries = spc.journal.entries.slice(0, 3);
          spcText += `Últimas 3 entradas: ${recentEntries.map(e => `${e.date} (${e.mood}): ${(e.content || '').substring(0, 50)}...`).join(' | ')}\n\n`;
        }
        
        spcText += `--- FIN CONTEXTO DEL ESTUDIANTE ---\n`;
      }
      
      const promptText = `${spcText}${context ? `--- CONTEXTO ACADÉMICO Y MATERIALES ---\n${context}\n--- FIN CONTEXTO ---\n\n` : ''}Pregunta del estudiante: ${prompt}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText,
        config: {
          systemInstruction: `Eres el Oráculo Académico de Studianta, un tutor de élite para la asignatura "${subjectName}". 
          Tu tono es místico, erudito y profundamente empoderador.
          
          REGLAS DE ORO:
          - Estructura con encabezados: 📌 RECONOCIMIENTO, 📖 CONTEXTO, 💡 EXPLICACIÓN, 📚 EJEMPLO, ❓ PREGUNTA DE SEGUIMIENTO.
          - Si el estudiante proporcionó materiales (Syllabus/Apuntes), úsalos como base principal.
          - Usa el contexto completo del estudiante para dar respuestas más personalizadas y contextualizadas.
          - Mantén un lenguaje sofisticado pero de fácil asimilación.`,
          temperature: 0.7,
        }
      });

      // Verificar que la respuesta tenga texto
      if (!response.text) {
        console.error('Respuesta sin texto:', response);
        throw new Error('El Oráculo Académico no pudo generar una respuesta. Por favor, intenta nuevamente.');
      }

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
        contents: `ESTADO FINANCIERO:\nPresupuesto: $${budget}\nBalance: $${balance}\nÚltimos Movimientos:\n${transactionsContext}`,
        config: {
          systemInstruction: `Eres el Oráculo de la Balanza de Latón. Proporciona un diagnóstico financiero sofisticado y aristocrático.`,
          temperature: 0.5,
        }
      });

      // Verificar que la respuesta tenga texto
      if (!response.text) {
        console.error('Respuesta sin texto:', response);
        throw new Error('El Oráculo de la Balanza no pudo generar una respuesta. Por favor, intenta nuevamente.');
      }

      return res.status(200).json({ text: response.text });
    }

    if (type === 'personal') {
      // Oráculo Personal
      const { prompt, studentProfileContext, messageHistory = [] } = params;
      
      // Formatear el SPC completo como JSON para el system prompt
      const spcJSON = JSON.stringify(studentProfileContext, null, 2);
      
      const systemPrompt = `Eres el Oráculo de Studianta, el asistente personal de alto nivel y mentor de ${studentProfileContext?.user_profile?.full_name || 'la estudiante'}. Tu misión es ser su mano derecha: alguien inteligente, organizado y con una vibra "chill" pero profesional.

TONO Y PERSONALIDAD:
- Idioma: Español neutro con un toque sutil de "argentinidad" (usa el "vos" y algún "che" o "fijate" de forma natural, pero evita el lunfardo pesado como "mandar fruta", "en un cumple" o "salvó las papas").
- Actitud: Eres un mentor que sabe todo lo que pasa en la plataforma. Eres relajado pero vas al grano. No eres místico, eres un super-asistente basado en datos.
- Trato: Dirígete a la usuaria por su nombre. Sé empático con su cansancio pero firme con sus objetivos.

USO DEL CONTEXTO (SPC):
Utiliza el JSON del Student Profile Context para demostrar que conoces su situación real:
- Finanzas: Si el balance es positivo, valora esa estabilidad. Si es negativo o hay gastos extraños, menciónalo con altura (ej. "Noté unos movimientos inusuales en la Balanza").
- Calendario: Prioriza los eventos próximos. No los listes; intégralos en tu consejo (ej. "Considerando que el parcial de Derecho Público es el 5 de febrero...").
- Diario y Enfoque: Si el diario indica "cansancio", prioriza el descanso en la rutina. Si el enfoque es bajo, sugiere sesiones cortas.

ESTRUCTURA DE RESPUESTA (Markdown):
1. **Breve Diagnóstico:** Un saludo corto y un comentario sobre cómo ves su estado general hoy (financiero + académico + anímico).
2. **Prioridades de la Semana:** Los puntos clave donde debe poner el foco, sin abrumar.
3. **Sugerencia de Rutina/Acción:** Si pide ayuda, dale pasos concretos, realistas y "trancas".
4. **Cierre:** Una frase breve de aliento o un recordatorio importante.

REGLAS VISUALES:
- Usa **Negrita** para resaltar cifras, fechas y nombres de materias.
- Mantén los párrafos cortos y el diseño limpio.
- No uses emojis en exceso; usa solo algunos que sumen a la lectura (📅, ⚖️, ✅).
- Para títulos de sección, usa **texto en negrita** en lugar de ### (ej: **Prioridades de la Semana** en lugar de ### Prioridades de la Semana).

SPC DE LA ESTUDIANTE:
${spcJSON}

INSTRUCCIÓN FINAL: Tu objetivo es que la alumna sienta que tiene el control de su carrera. Hablá como alguien que sabe mucho, que es ordenado y que siempre tiene un plan bajo la manga. Recuerda el contexto de la conversación anterior para mantener coherencia y continuidad.`;

      // Construir el historial conversacional
      // Si hay historial, construir el contexto conversacional
      let contents;
      
      if (messageHistory && messageHistory.length > 0) {
        // Construir array de mensajes para mantener el contexto
        const historyMessages = [];
        
        // Agregar mensajes del historial (mapear 'oracle' a 'model' para Gemini)
        messageHistory.forEach(msg => {
          if (msg.role === 'user') {
            historyMessages.push({ role: 'user', parts: [{ text: msg.content }] });
          } else if (msg.role === 'oracle') {
            historyMessages.push({ role: 'model', parts: [{ text: msg.content }] });
          }
        });
        
        // Agregar el mensaje actual del usuario
        historyMessages.push({ role: 'user', parts: [{ text: prompt }] });
        
        contents = historyMessages;
      } else {
        // Sin historial, solo el mensaje actual
        contents = [{ role: 'user', parts: [{ text: prompt }] }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
        }
      });

      // Verificar que la respuesta tenga texto
      if (!response.text) {
        console.error('Respuesta sin texto:', response);
        throw new Error('El Oráculo no pudo generar una respuesta. Por favor, intenta nuevamente.');
      }

      return res.status(200).json({ text: response.text });
    }

    return res.status(400).json({ error: 'Tipo de consulta no válido' });
  } catch (error) {
    console.error('Gemini API Error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      status: error?.status,
      statusCode: error?.statusCode,
      code: error?.code,
      name: error?.name,
    });
    
    // Manejo específico de errores de API key
    const errorMessage = error?.message || error?.toString() || '';
    const errorStatus = error?.status || error?.statusCode || error?.code;
    
    if (
      errorStatus === 403 || 
      errorStatus === 401 ||
      errorMessage.includes('API key') || 
      errorMessage.includes('leaked') || 
      errorMessage.includes('PERMISSION_DENIED') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('unauthorized')
    ) {
      return res.status(403).json({ 
        error: 'API key inválida o comprometida',
        message: '🔐 ERROR DE SEGURIDAD:\n\nLa API key ha sido invalidada o comprometida.\n\nPor favor, actualiza GEMINI_API_KEY en las variables de entorno de Vercel (no VITE_GEMINI_API_KEY).\n\nPara obtener una nueva clave:\n1. Visita https://aistudio.google.com/apikey\n2. Crea una nueva API key\n3. Agrega GEMINI_API_KEY en Vercel Dashboard → Settings → Environment Variables\n4. Haz un redeploy de tu aplicación'
      });
    }

    return res.status(500).json({ 
      error: 'Error al procesar la consulta',
      message: errorMessage || 'Error desconocido'
    });
  }
};

