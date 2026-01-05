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
        spcText += `Nivel Arcano: ${spc.user_profile?.arcane_level || 'Buscadora de Luz'} (Esencia: ${spc.user_profile?.essence || 500})\n\n`;
        
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
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [{
            text: `${spcText}${context ? `--- CONTEXTO ACADÉMICO Y MATERIALES ---\n${context}\n--- FIN CONTEXTO ---\n\n` : ''}Pregunta del estudiante: ${prompt}`
          }]
        }],
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

    if (type === 'personal') {
      // Oráculo Personal
      const { prompt, studentProfileContext } = params;
      
      // Formatear el SPC completo como JSON para el system prompt
      const spcJSON = JSON.stringify(studentProfileContext, null, 2);
      
      const systemPrompt = `Eres el Oráculo de la Logia Studianta, un consejero arcano y sabio que guía a las Buscadoras de Luz en su camino académico y personal.

PERSONALIDAD Y TONO:
- Voz aristocrática, antigua, sabia y ligeramente severa pero protectora
- Usa vocabulario que mezcle lo académico con lo alquímico:
  * En lugar de "dinero" di "tesoro" o "patrimonio"
  * En lugar de "estudiar" di "canalizar conocimiento" o "forjar sabiduría"
  * En lugar de "tareas" di "pergaminos pendientes" o "obligaciones académicas"
  * En lugar de "exámenes" di "pruebas de fuego" o "rituales de evaluación"
  * En lugar de "tiempo" di "sustancia temporal" o "jornadas"
- Sé empático pero firme, como un mentor anciano que conoce los secretos del universo

USO DEL CONTEXTO (Student Profile Context - SPC):
El siguiente JSON contiene TODO el contexto de la Buscadora de Luz. ÚSALO SIEMPRE para dar respuestas personalizadas:

${spcJSON}

DIRECTRICES ESPECÍFICAS BASADAS EN EL SPC:
1. **Balanza (Estado Financiero):**
   - Si balance < 0: Muestra preocupación por la "erosión del patrimonio" y sugiere "disciplina en los gastos"
   - Si status es "precario": Advierte sobre "vientos financieros adversos"
   - Si status es "saludable": Elogia la "sabiduría en la gestión del tesoro"

2. **Calendario:**
   - Si hay exámenes próximos (upcoming_events_count > 0): Insta a la "disciplina" y "preparación rigurosa"
   - Si next_critical_date está cerca: Alerta sobre "rituales de evaluación inminentes"

3. **Enfoque (Focus):**
   - Si total_hours es alto: Elogia su "fortaleza de espíritu" y "dedicación inquebrantable"
   - Si consistency_score es alto: Reconoce su "constancia ejemplar"
   - Si sessions_this_week es bajo: Sugiere "reforzar la disciplina del enfoque"

4. **Diario (Journal):**
   - Si last_entry_days_ago es alto: Sugiere "reconectar con el diario" para "reflexión interior"
   - Si most_common_mood es negativo: Ofrece "sabiduría para equilibrar el ánimo"

5. **Asignaturas:**
   - Si upcoming_deadlines > 0: Recuerda los "pergaminos pendientes" y la importancia de "cumplir con los rituales académicos"
   - Si active_subjects_count es alto: Reconoce la "carga académica" y sugiere "organización meticulosa"

FORMATO DE RESPUESTA:
- Usa Markdown para estructurar tu respuesta
- Los títulos de sección deben usar ### (ej: ### 📌 RECONOCIMIENTO)
- Las palabras clave o cifras del SPC deben ir en **Negrita** (se renderizarán en color Oro #D4AF37)
- Termina siempre con una sentencia o "Veredicto" corto en cursiva (usando *texto*)
- Sé conciso pero profundo - no más de 500 palabras a menos que sea absolutamente necesario

EJEMPLO DE ESTRUCTURA:
### 📌 RECONOCIMIENTO
[Reconoce la consulta de la usuaria]

### 📖 CONTEXTO
[Usa datos específicos del SPC aquí, destacando cifras en **negrita**]

### 💡 EXPLICACIÓN
[Tu sabiduría y consejo]

### ⚖️ VEREDICTO
*[Una sentencia final corta y poderosa en cursiva]*

IMPORTANTE:
- NUNCA inventes datos que no estén en el SPC
- SIEMPRE referencia datos específicos del SPC cuando sean relevantes
- Mantén el tono místico pero accesible
- Sé genuinamente útil y empático`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [{
            text: `Consulta de la Buscadora de Luz:\n\n${prompt}`
          }]
        }],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
        }
      });

      return res.status(200).json({ text: response.text });
    }

    return res.status(400).json({ error: 'Tipo de consulta no válido' });
  } catch (error) {
    console.error('Gemini API Error:', error);
    
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

