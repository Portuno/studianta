// API Route para Gemini - Protege la API key del cliente
// Este endpoint se ejecuta en el servidor, por lo que la API key nunca se expone al cliente

import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  console.log('[Gemini API] 🚀 Handler ejecutado - Method:', req.method);
  
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

  console.log('[Gemini API] Request recibida:', { 
    type, 
    typeLength: type?.length,
    typeTrimmed: type?.trim(),
    paramsKeys: Object.keys(params),
    bodyKeys: Object.keys(req.body || {})
  });

  if (!type) {
    console.error('[Gemini API] Error: tipo de consulta requerido');
    return res.status(400).json({ error: 'Tipo de consulta requerido' });
  }

  const normalizedType = type?.trim()?.toLowerCase();
  console.log('[Gemini API] Tipo normalizado:', normalizedType);

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

    if (type === 'nutrition-text' || normalizedType === 'nutrition-text') {
      console.log('[Gemini API] ✅ Procesando nutrition-text - Tipo reconocido correctamente');
      console.log('[Gemini API] Debug - type:', type, 'normalizedType:', normalizedType);
      // Análisis nutricional desde texto
      const { text } = params;
      
      if (!text) {
        return res.status(400).json({ 
          error: 'Texto requerido',
          message: 'Se requiere el parámetro "text"'
        });
      }

      const systemPrompt = `Eres un experto nutricionista y analista de alimentos. Tu tarea es analizar texto libre que describe comida y extraer información nutricional precisa.

REGLAS:
1. Identifica TODOS los alimentos mencionados en el texto
2. Extrae cantidades y unidades (ej: "2 huevos", "una taza de café", "200g de pollo")
3. Calcula macros nutricionales (calorías, proteínas, carbohidratos, grasas) para cada alimento
4. Estima el impacto en glucosa: 'low' (bajo), 'medium' (medio), 'high' (alto), 'spike' (pico alto)
5. Asigna un energy_score de 1-10 basado en el tipo de comida
6. Identifica tags de "brain food": 'omega3', 'antioxidants', 'hydration', 'complex_carbs', 'protein'

FORMATO DE RESPUESTA (JSON estricto):
{
  "foods": [
    {
      "name": "nombre del alimento",
      "quantity": número,
      "unit": "unidad (unidades, gramos, tazas, etc.)",
      "calories": número,
      "protein": número (gramos),
      "carbs": número (gramos),
      "fats": número (gramos)
    }
  ],
  "total_calories": número,
  "total_protein": número,
  "total_carbs": número,
  "total_fats": número,
  "estimated_glucose_impact": "low|medium|high|spike",
  "energy_score": número (1-10),
  "brain_food_tags": ["tag1", "tag2"],
  "confidence": número (0-1)
}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.`;

      const prompt = `Analiza el siguiente texto y extrae la información nutricional:

"${text}"

Responde con el JSON en el formato especificado.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            responseMimeType: 'application/json',
          }
        });

        if (!response.text) {
          throw new Error('No se recibió respuesta del análisis nutricional');
        }

        let analysisData;
        try {
          analysisData = JSON.parse(response.text);
        } catch (parseError) {
          const jsonMatch = response.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('La respuesta no contiene JSON válido');
          }
        }

        return res.status(200).json({ analysis: analysisData });
      } catch (apiError: any) {
        console.error('[Gemini API] Error en nutrition-text:', apiError);
        throw apiError;
      }
    }

    if (type === 'nutrition-photo' || normalizedType === 'nutrition-photo') {
      console.log('[Gemini API] ✅ Procesando nutrition-photo - Tipo reconocido correctamente');
      console.log('[Gemini API] Debug - type:', type, 'normalizedType:', normalizedType);
      // Análisis nutricional desde foto
      const { imageBase64 } = params;
      
      if (!imageBase64) {
        return res.status(400).json({ 
          error: 'Imagen requerida',
          message: 'Se requiere el parámetro "imageBase64"'
        });
      }

      // Extraer el base64 sin el prefijo data:image/...
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mimeType = imageBase64.includes('data:') 
        ? imageBase64.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
        : 'image/jpeg';

      const systemPrompt = `Eres un experto nutricionista y analista de alimentos con visión artificial. Tu tarea es analizar una foto de comida y extraer información nutricional precisa.

REGLAS:
1. Identifica TODOS los alimentos visibles en la foto
2. Estima porciones basándote en el tamaño relativo y objetos de referencia (platos, cubiertos, etc.)
3. Calcula macros nutricionales (calorías, proteínas, carbohidratos, grasas) para cada alimento
4. Estima el impacto en glucosa: 'low' (bajo), 'medium' (medio), 'high' (alto), 'spike' (pico alto)
5. Asigna un energy_score de 1-10 basado en el tipo de comida
6. Identifica tags de "brain food": 'omega3', 'antioxidants', 'hydration', 'complex_carbs', 'protein'

FORMATO DE RESPUESTA (JSON estricto):
{
  "foods": [
    {
      "name": "nombre del alimento",
      "quantity": número,
      "unit": "unidad (unidades, gramos, porciones, etc.)",
      "calories": número,
      "protein": número (gramos),
      "carbs": número (gramos),
      "fats": número (gramos)
    }
  ],
  "total_calories": número,
  "total_protein": número,
  "total_carbs": número,
  "total_fats": número,
  "estimated_glucose_impact": "low|medium|high|spike",
  "energy_score": número (1-10),
  "brain_food_tags": ["tag1", "tag2"],
  "confidence": número (0-1)
}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.`;

      const prompt = `Analiza esta foto de comida y extrae la información nutricional. Estima las porciones basándote en el tamaño relativo de los objetos en la imagen.

Responde con el JSON en el formato especificado.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            responseMimeType: 'application/json',
          }
        });

        if (!response.text) {
          throw new Error('No se recibió respuesta del análisis nutricional');
        }

        let analysisData;
        try {
          analysisData = JSON.parse(response.text);
        } catch (parseError) {
          const jsonMatch = response.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('La respuesta no contiene JSON válido');
          }
        }

        return res.status(200).json({ analysis: analysisData });
      } catch (apiError: any) {
        console.error('[Gemini API] Error en nutrition-photo:', apiError);
        console.error('[Gemini API] Error details:', {
          message: apiError?.message,
          status: apiError?.status,
          code: apiError?.code,
        });
        throw apiError;
      }
    }

    if (type === 'exam-generation') {
      // Generación de exámenes
      const { subjectName, materialsText, examType, questionCount, difficulty } = params;
      
      if (!subjectName || !materialsText || !examType || !questionCount) {
        return res.status(400).json({ 
          error: 'Parámetros incompletos',
          message: 'Se requieren: subjectName, materialsText, examType, questionCount'
        });
      }

      // System prompt pedagógico estricto
      const systemPrompt = `Actúas como un Experto Pedagogo y Evaluador Académico. Tu objetivo es crear un examen basado únicamente en el contexto proporcionado por los apuntes de la usuaria.

REGLAS ESTRICTAS:

1. FIDELIDAD AL TEXTO:
   - NO incluyas información externa que no esté en los documentos proporcionados.
   - Si no hay suficiente información en el material para crear una pregunta, omítela.
   - Cita el material fuente cuando sea relevante.

2. DISTRIBUCIÓN DE DIFICULTAD:
   - 20% fácil (conceptos básicos, definiciones directas)
   - 60% intermedio (aplicación de conceptos, análisis básico)
   - 20% difícil (análisis crítico, síntesis, evaluación)

3. DISTRACTORES PLAUSIBLES:
   - En preguntas de opción múltiple, las respuestas incorrectas deben parecer lógicas para alguien que no estudió bien.
   - Evita opciones absurdas o obviamente incorrectas.
   - Los distractores deben basarse en conceptos relacionados pero incorrectos del material.

4. EXPLICACIÓN PEDAGÓGICA:
   - Para cada pregunta, genera una 'explicación' que explique por qué la respuesta es correcta.
   - Genera una 'racionalidad' que explique la lógica detrás de la respuesta basándote en el material.
   - Incluye el nombre del material fuente cuando sea relevante.

5. FORMATO DE SALIDA:
   - Responde SIEMPRE en formato JSON válido.
   - Estructura: { "exam": { "title": "...", "questions": [...] } }
   - Cada pregunta debe tener: number, type, text, options (si aplica), correctAnswer, explanation, rationale, sourceMaterial, difficulty

TIPOS DE PREGUNTAS:
- multiple-choice: 4 opciones, una correcta
- true-false: Solo verdadero o falso
- open-ended: Pregunta abierta con respuesta esperada
- cloze: Completar el párrafo con palabra clave
- case-study: Situación práctica que requiere aplicar teoría

IMPORTANTE: Si el material no tiene suficiente contenido para generar ${questionCount} preguntas del tipo ${examType}, genera las que puedas y ajusta la cantidad.`;

      // Construir el prompt con el material
      const materialsContext = Array.isArray(materialsText) 
        ? materialsText.map((text, idx) => `--- Material ${idx + 1} ---\n${text}\n`).join('\n')
        : `--- Material de Estudio ---\n${materialsText}\n`;

      const examPrompt = `Genera un examen de ${questionCount} preguntas de tipo "${examType}" para la asignatura "${subjectName}".

Dificultad solicitada: ${difficulty || 'mixed'}

Material de estudio:
${materialsContext}

Responde ÚNICAMENTE con un JSON válido en el siguiente formato:
{
  "exam": {
    "title": "Título descriptivo del examen",
    "questions": [
      {
        "number": 1,
        "type": "${examType}",
        "text": "Texto de la pregunta",
        "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
        "correctAnswer": 0,
        "explanation": "Explicación pedagógica de por qué esta es la respuesta correcta",
        "rationale": "Razonamiento basado en el material",
        "sourceMaterial": "Nombre del material fuente",
        "difficulty": "easy|intermediate|hard"
      }
    ]
  }
}

IMPORTANTE: 
- Para true-false, options debe ser ["Verdadero", "Falso"] y correctAnswer debe ser 0 o 1
- Para open-ended, options debe ser null y correctAnswer debe ser la respuesta esperada
- Para cloze, el texto debe tener [_____] donde va la palabra clave
- Para case-study, incluye el caso práctico en el texto de la pregunta`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: examPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          responseMimeType: 'application/json',
        }
      });

      // Verificar que la respuesta tenga texto
      if (!response.text) {
        console.error('Respuesta sin texto:', response);
        throw new Error('No se pudo generar el examen. Por favor, intenta nuevamente.');
      }

      console.log('[Gemini API] Respuesta recibida (primeros 500 chars):', response.text.substring(0, 500));

      // Intentar parsear el JSON
      let examData;
      try {
        examData = JSON.parse(response.text);
        console.log('[Gemini API] JSON parseado correctamente');
      } catch (parseError) {
        console.error('[Gemini API] Error parsing JSON:', parseError);
        console.error('[Gemini API] Response text completo:', response.text);
        
        // Intentar extraer JSON del texto si está envuelto en markdown o tiene texto adicional
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            examData = JSON.parse(jsonMatch[0]);
            console.log('[Gemini API] JSON extraído de markdown correctamente');
          } catch (extractError) {
            console.error('[Gemini API] Error parseando JSON extraído:', extractError);
            throw new Error('La respuesta contiene JSON pero no es válido. Por favor, intenta nuevamente.');
          }
        } else {
          throw new Error('La respuesta no contiene JSON válido. Por favor, intenta nuevamente.');
        }
      }

      // Validar estructura del examen
      if (!examData) {
        throw new Error('La respuesta está vacía. Por favor, intenta nuevamente.');
      }

      // Aceptar tanto { exam: {...} } como directamente { questions: [...] }
      if (examData.exam) {
        if (!examData.exam.questions || !Array.isArray(examData.exam.questions)) {
          console.error('[Gemini API] Estructura inválida - exam.questions no es un array:', examData);
          throw new Error('La respuesta no tiene el formato esperado: falta el array de preguntas.');
        }
        return res.status(200).json({ exam: examData.exam });
      } else if (examData.questions && Array.isArray(examData.questions)) {
        // Si viene directamente con questions, envolver en exam
        return res.status(200).json({ 
          exam: {
            title: examData.title || `Examen de ${subjectName}`,
            questions: examData.questions
          }
        });
      } else {
        console.error('[Gemini API] Estructura inválida:', examData);
        throw new Error('La respuesta no tiene el formato esperado. Debe contener "exam.questions" o "questions".');
      }
    }

    console.error('[Gemini API] Tipo de consulta no válido:', type, 'Normalized:', normalizedType);
    return res.status(400).json({ error: 'Tipo de consulta no válido', receivedType: type });
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

