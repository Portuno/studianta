import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AlertTriangle, Bot, Calendar, Loader2, Plus, Send, Trash2, User, BookOpen } from "lucide-react";

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  message: string;
  time: string;
}

interface ChatSession {
  id: string;
  title: string;
  contextType: "subject" | "agenda";
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  mabotChatId?: string;
  contextUploaded?: boolean;
}

interface SubjectRow {
  id: string;
  name: string;
}

interface StudyMaterialRow {
  id: string;
  title: string;
  type: "notes" | "document" | "audio" | "video" | "pdf" | "image";
  content?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
}

const nowTime = () =>
  new Date().toLocaleTimeString("es-ES", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });

export default function Chat() {
  const { user } = useAuth();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRow | null>(null);
  const [topicInput, setTopicInput] = useState("");

  // Mabot configuration now handled by Supabase Edge Function
  const mabotConfigured = true; // Always true since we're using Edge Function

  const currentChat = chatSessions.find((c) => c.id === currentChatId) || null;

  useEffect(() => {
    setChatSessions([]);
    setCurrentChatId("");
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setSubjectsLoading(true);
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setSubjects((data || []) as SubjectRow[]);
      } catch (e) {
        console.error("Error loading subjects for chat:", e);
      } finally {
        setSubjectsLoading(false);
      }
    };
    load();
  }, [user]);

  const loginToMabot = async (): Promise<boolean> => {
    try {
      // Use Supabase Edge Function for authentication
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mabot-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });
      
      if (!res.ok) return false;
      const data = await res.json();
      
      if (data.success && data.token) {
        // Store token for future use
        if (typeof window !== "undefined") {
          window.localStorage.setItem("mabot_token", data.token);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[Mabot Login]", error);
      return false;
    }
  };

  const refreshMabotTokens = async (): Promise<boolean> => {
    try {
      // Use Supabase Edge Function for token refresh
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mabot-refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });
      
      if (!res.ok) return false;
      const data = await res.json();
      
      if (data.success && data.token) {
        // Store new token
        if (typeof window !== "undefined") {
          window.localStorage.setItem("mabot_token", data.token);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[Mabot Refresh]", error);
      return false;
    }
  };

  const ensureMabotAuth = async (): Promise<boolean> => {
    if (!mabotConfigured) return false;
    
    // Check if we have a valid token
    const token = typeof window !== "undefined" ? window.localStorage.getItem("mabot_token") : null;
    if (token) return true;
    
    // Try to login
    if (await loginToMabot()) return true;
    return false;
  };

  const buildDeveloperInstruction = (session: ChatSession) => {
    const name = user?.user_metadata?.full_name || user?.email || "el estudiante";
    if (session.contextType === "agenda") {
      return (
        `ROLE: You are the student's academic agenda assistant.\n` +
        `Student: ${name}.\n` +
        `LANGUAGE INSTRUCTION: Detect the language of the user's question and respond in the SAME language. If they ask in Spanish, respond in Spanish. If they ask in English, respond in English.\n` +
        `Use ONLY the provided calendar, schedules, and goals data. If missing, ask for details or suggest adding them in Plan.\n` +
        `Answer concisely and in the user's detected language.\n` +
        `Then suggest a relevant next action (e.g., schedule a session, review material).\n` +
        `Question:`
      );
    }

    const ctx = session.subjectName || "the selected subject";
    const topicHint = session.topic ? ` (topic: ${session.topic})` : "";
    return (
      `ROLE: You are an AI study assistant.\n` +
      `Student: ${name}.\n` +
      `Primary context: ${ctx}${topicHint}.\n` +
      `LANGUAGE INSTRUCTION: Detect the language of the user's question and respond in the SAME language. If they ask in Spanish, respond in Spanish. If they ask in English, respond in English.\n` +
      `Use ONLY the provided materials and notes. If insufficient, ask for more uploads (via Library).\n` +
      `Keep it clear and in the user's detected language.\n` +
      `Question:`
    );
  };

  const prepareSubjectContextText = async (session: ChatSession): Promise<{ text: string; files: any[] }> => {
    if (!session.subjectId || !user) return { text: "", files: [] };

    const { data: materials, error } = await supabase
      .from("study_materials")
      .select("id, title, type, content, file_path, file_size, mime_type, created_at")
      .eq("user_id", user.id)
      .eq("subject_id", session.subjectId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching materials for context:", error);
      return { text: "", files: [] };
    }

    if (!materials || materials.length === 0) {
      return { text: "No materials found for this subject yet.", files: [] };
    }

    const topic = (session.topic || "").toLowerCase().trim();
    const filtered = !topic
      ? (materials as StudyMaterialRow[])
      : (materials as StudyMaterialRow[]).filter((m) =>
          m.title?.toLowerCase().includes(topic) || (m.content || "").toLowerCase().includes(topic)
        );

    const lines: string[] = [];
    const files: any[] = [];
    lines.push(`Attached study materials (${filtered.length}/${materials.length}):`);

    for (const m of filtered) {
      let urlNote = "";
      if (m.file_path) {
        try {
          const { data: urlData, error: urlErr } = await supabase.storage
            .from("study-materials")
            .createSignedUrl(m.file_path, 60 * 60);
          if (!urlErr && urlData?.signedUrl) {
            urlNote = ` [url: ${urlData.signedUrl}]`;
            
            // Add file to context files for attachment (use keys expected by Edge Function)
            if (m.type === "pdf" || m.mime_type === "application/pdf") {
              files.push({
                url: urlData.signedUrl,
                title: m.title,
                mime_type: m.mime_type || "application/pdf",
                type: m.type
              });
            }
          }
        } catch (e) {
          console.warn("Signed URL error:", e);
        }
      }

      const snippet = m.content ? ` snippet: ${m.content.slice(0, 400)}${m.content.length > 400 ? "…" : ""}` : "";
      lines.push(`- ${m.title} (${m.type})${urlNote}${snippet}`);
    }

    return { text: lines.join("\n"), files };
  };

  const prepareAgendaContextText = async (): Promise<string> => {
    if (!user) return "";

    const { data: events } = await supabase
      .from("subject_events")
      .select("name, event_type, event_date, description")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true })
      .limit(50);

    const { data: schedules } = await supabase
      .from("subject_schedules")
      .select("day_of_week, start_time, end_time, location, description")
      .eq("user_id", user.id)
      .order("day_of_week", { ascending: true })
      .limit(50);

    const { data: goals } = await supabase
      .from("weekly_goals")
      .select("target_hours, current_hours, week_start, week_end, subjects:subject_id ( id, name )")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(10);

    const lines: string[] = [];
    lines.push("Agenda data provided to assistant:");

    if (events && events.length > 0) {
      lines.push("Upcoming events:");
      for (const e of events) {
        lines.push(`- ${e.name} [${e.event_type}] on ${e.event_date}${e.description ? ` — ${e.description}` : ""}`);
      }
    } else {
      lines.push("No upcoming subject events.");
    }

    if (schedules && schedules.length > 0) {
      lines.push("Weekly schedules:");
      for (const s of schedules) {
        lines.push(`- Day ${s.day_of_week}: ${s.start_time}-${s.end_time} at ${s.location || "(no location)"}${s.description ? ` — ${s.description}` : ""}`);
      }
    } else {
      lines.push("No weekly schedules configured.");
    }

    if (goals && goals.length > 0) {
      lines.push("Recent weekly goals:");
      for (const g of goals) {
        const subjectName = (g as any)?.subjects?.name || "(unknown subject)";
        lines.push(`- ${subjectName}: ${g.current_hours}/${g.target_hours}h for week ${g.week_start} → ${g.week_end}`);
      }
    }

    return lines.join("\n");
  };

  const sendToMabot = async (session: ChatSession, userText: string, contextText?: string, contextFiles?: any[]) => {
    const ok = await ensureMabotAuth();
    if (!ok) return { ok: false, error: "Mabot not configured or auth failed" } as const;

    const platformChatId = session.mabotChatId || `web_${session.id}_${Date.now()}`;

    // 🔧 CONSOLIDAR TODO EN UN SOLO MENSAJE (OPTIMIZADO)
    let consolidatedContent = buildDeveloperInstruction(session);
    
    // Agregar instrucción de idioma específica (SIMPLIFICADA)
    consolidatedContent += `\n🌐 IDIOMA: Responde en el mismo idioma de la pregunta del usuario.\n`;
    
    // Agregar instrucción para archivos por URL
    if (contextFiles && contextFiles.length > 0) {
      consolidatedContent += `\n📎 ARCHIVOS: Los archivos se adjuntan como binarios por el backend (a partir de las URLs). Analiza su contenido para responder.\n`;
    }
    
    // Agregar contexto si existe (LIMITADO)
    if (contextText && contextText.trim().length > 0) {
      // Limitar el contexto a 1000 caracteres para evitar mensajes muy largos
      const limitedContext = contextText.length > 1000 
        ? contextText.substring(0, 1000) + "... [contexto truncado]"
        : contextText;
      consolidatedContent += `\n📋 CONTEXTO:\n${limitedContext}`;
    }

    // Agregar listado de archivos adjuntos sin crear mensajes extra
    if (contextFiles && contextFiles.length > 0) {
      const fileList = contextFiles
        .map((f: any, idx: number) => `- ${f.title || f.fileName || `file_${idx+1}`}`)
        .join("\n");
      consolidatedContent += `\n📄 Archivos adjuntos:\n${fileList}`;
    }

    // Agregar pregunta del usuario
    consolidatedContent += `\n\n❓ PREGUNTA:\n${userText}`;

    const messages: any[] = [
      {
        role: "user",
        contents: [{ 
          type: "text", 
          value: consolidatedContent, 
          parse_mode: "Markdown" 
        }],
      },
    ];

    // No agregamos mensajes adicionales por archivo. La Edge Function recibirá contextFiles
    // y se encargará de descargar y adjuntar los binarios en un solo mensaje.
    if (contextFiles && contextFiles.length > 0) {
      console.log(`[Mabot] contextFiles provided: ${contextFiles.length}. Relying on Edge Function to attach binaries.`);
    }

    // 🔍 DEBUG: Ver qué se está enviando a Mabot (ahora consolidado)
    console.group("🚀 MABOT REQUEST DEBUG - ENVIANDO (CONSOLIDADO)");
    console.log("📤 PLATFORM:", "web");
    console.log("🤖 BOT USERNAME:", "cuaderbot");
    console.log("💬 CHAT ID:", session.mabotChatId || null);
    console.log("🆔 PLATFORM CHAT ID:", platformChatId);
    console.log("📝 TOTAL MESSAGES:", messages.length);
    console.log("📋 MESSAGES DETAIL:", messages);
    console.log("🔧 CONTENIDO CONSOLIDADO:", consolidatedContent.substring(0, 300) + "...");
    console.groupEnd();

    try {
      // Use Supabase Edge Function for Mabot communication
      const controller = new AbortController();
      // Timeout más largo para PDFs ya que procesar URLs toma más tiempo
      const timeoutSeconds = contextFiles && contextFiles.length > 0 ? 45000 : 30000;
      const timeoutId = setTimeout(() => {
        console.log(`[Mabot] Timeout reached after ${timeoutSeconds/1000}s, aborting request`);
        controller.abort();
      }, timeoutSeconds);
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mabot-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          platform: "web",
          bot_username: "cuaderbot",
          chat_id: session.mabotChatId || null,
          platform_chat_id: platformChatId,
          messages,
          // legacy support fields also sent for compatibility
          session: {
            userId: user?.id,
            subjectId: session.subjectId,
            topicId: session.topic,
            mabotChatId: session.mabotChatId,
            subjectName: session.subjectName,
            contextType: session.contextType
          },
          userText,
          contextText,
          contextFiles
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Mabot Error]", errorText);
        
        // Manejar errores específicos de Supabase
        if (res.status === 546 || errorText.includes("WORKER_LIMIT")) {
          return { 
            ok: false, 
            error: "El servidor está sobrecargado. Intenta de nuevo en unos minutos o reduce el tamaño del archivo." 
          } as const;
        }
        
        return { ok: false, error: `HTTP ${res.status}` } as const;
      }

      const data = await res.json();
      
      // 🔍 DEBUG: Ver qué se recibió de Mabot
      console.group("📥 MABOT RESPONSE DEBUG - RECIBIDO");
      console.log("📊 RESPONSE STATUS:", res.status);
      console.log("📋 RESPONSE HEADERS:", Object.fromEntries(res.headers.entries()));
      console.log("📦 RESPONSE DATA:", data);
      console.log("🔍 DATA STRUCTURE:", {
        hasData: !!data?.data,
        hasChatId: !!data?.chatId,
        dataType: typeof data?.data,
        dataKeys: data?.data ? Object.keys(data?.data) : []
      });
      console.groupEnd();
      
      return { ok: true, data } as const;
    } catch (error) {
      console.error("[Mabot Error]", error);
      
      // Manejar errores específicos
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { 
            ok: false, 
            error: "La solicitud tardó demasiado en procesarse. Intenta de nuevo o reduce la complejidad de tu pregunta." 
          } as const;
        }
        
        if (error.message.includes('fetch')) {
          return { 
            ok: false, 
            error: "Error de conexión. Verifica tu conexión a internet e intenta de nuevo." 
          } as const;
        }
      }
      
      return { ok: false, error: "Network error" } as const;
    }
  };

  const extractAssistantText = (updateOut: any): string => {
    try {
      // 1. DEBUG SIMPLIFICADO: Ahora solo debería haber una respuesta
      debugMabotResponse(updateOut);
      
      // 2. SOLUCIÓN: Tomar SOLO la primera respuesta del asistente
      const msgs: any[] = updateOut?.messages || [];
      const assistantMsgs = msgs.filter((m) => m?.role === "assistant");
      
      if (!assistantMsgs.length) return "";
      
      // 🔧 NUEVA LÓGICA: Solo la primera respuesta
      const firstAssistantMsg = assistantMsgs[0];
      const contents = firstAssistantMsg?.contents || [];
      
      const parts: string[] = [];
      for (const c of contents) {
        if (c?.type === "text" && typeof c?.value === "string") {
          parts.push(c.value);
        }
      }
      
      const firstResponse = parts.join("\n\n");
      
      // 🔍 DEBUG: Confirmar que solo tomamos la primera
      console.log(`✅ EXTRACTED: Solo primera respuesta (${firstResponse.length} chars)`);
      
      return firstResponse;
    } catch {
      return "";
    }
  };

  // 🔍 FUNCIÓN DE DEBUGGING SIMPLIFICADA (ahora para una sola respuesta)
  const debugMabotResponse = (apiData: any) => {
    console.group("🔍 MABOT RESPONSE DEBUG - INICIO");
    console.log("📊 DATOS COMPLETOS RECIBIDOS:", apiData);
    
    const messages: any[] = apiData?.messages || [];
    console.log("📝 TOTAL DE MENSAJES:", messages.length);
    
    if (messages.length === 0) {
      console.warn("⚠️ NO HAY MENSAJES EN LA RESPUESTA");
      console.groupEnd();
      return;
    }
    
    // Analizar cada mensaje individualmente
    messages.forEach((message: any, index: number) => {
      console.group(`📨 MENSAJE ${index + 1} (${message?.role || 'unknown'})`);
      
      console.log("🔑 PROPIEDADES DEL MENSAJE:", {
        role: message?.role,
        hasContents: !!message?.contents,
        contentsLength: message?.contents?.length || 0,
        messageId: message?.id || 'No ID',
        timestamp: message?.timestamp || 'No timestamp'
      });
      
      // Analizar el contenido del mensaje
      if (message?.contents && Array.isArray(message.contents)) {
        message.contents.forEach((content: any, contentIndex: number) => {
          console.group(`📄 CONTENIDO ${contentIndex + 1}`);
          console.log("📋 TIPO:", content?.type);
          console.log("📏 VALOR:", {
            length: content?.value?.length || 0,
            preview: content?.value?.substring(0, 200) || "No value",
            fullValue: content?.value || "No value"
          });
          console.log("🏷️ METADATOS:", {
            filename: content?.filename,
            mimetype: content?.mimetype,
            parse_mode: content?.parse_mode
          });
          console.groupEnd();
        });
      } else {
        console.warn("⚠️ MENSAJE SIN CONTENIDO VÁLIDO");
      }
      
      console.groupEnd();
    });
    
    // Análisis de roles
    const roleCounts = messages.reduce((acc: any, msg: any) => {
      const role = msg?.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    console.log("👥 DISTRIBUCIÓN DE ROLES:", roleCounts);
    
    // Análisis de contenido
    const contentTypes = messages.flatMap((msg: any) => 
      msg?.contents?.map((c: any) => c?.type) || []
    );
    const contentTypeCounts = contentTypes.reduce((acc: any, type: any) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    console.log("📊 TIPOS DE CONTENIDO:", contentTypeCounts);
    
    // Verificar si ahora solo hay una respuesta
    const assistantMessages = messages.filter((m) => m?.role === "assistant");
    if (assistantMessages.length === 1) {
      console.log("✅ ÉXITO: Ahora solo hay una respuesta del asistente");
    } else if (assistantMessages.length > 1) {
      console.warn("🚨 PROBLEMA PERSISTE: Múltiples mensajes del asistente");
      console.log("📋 MENSAJES DE ASISTENTE:", assistantMessages.map((msg, i) => ({
        index: i + 1,
        contentPreview: msg?.contents?.[0]?.value?.substring(0, 100) || "No content",
        contentLength: msg?.contents?.length || 0
      })));
    }
    
    console.groupEnd();
    console.log("🔍 MABOT RESPONSE DEBUG - FIN");
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentChat) return;

    // 🔍 DEBUG: Inicio del proceso de envío
    console.group("💬 CHAT MESSAGE FLOW - INICIO");
    console.log("📝 INPUT MESSAGE:", inputMessage);
    console.log("💬 CURRENT CHAT:", {
      id: currentChat.id,
      contextType: currentChat.contextType,
      subjectId: currentChat.subjectId,
      subjectName: currentChat.subjectName,
      topic: currentChat.topic,
      mabotChatId: currentChat.mabotChatId
    });
    console.groupEnd();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      message: inputMessage,
      time: nowTime(),
    };

    setChatSessions((prev) =>
      prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, userMessage], lastActivity: new Date() } : chat))
    );

    const textToSend = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    let contextText: string | undefined = undefined;
    let contextFiles: any[] | undefined = undefined;
    
    // Always prepare context to get the most recent files and materials
    if (currentChat.contextType === "agenda") {
      contextText = await prepareAgendaContextText();
      console.log("📅 AGENDA CONTEXT PREPARED:", {
        contextLength: contextText?.length || 0,
        contextPreview: contextText?.substring(0, 200) || "No context"
      });
    } else {
      const context = await prepareSubjectContextText(currentChat);
      contextText = context.text;
      contextFiles = context.files;
      // Actualizar estado para mostrar indicador de procesamiento de archivos
      setIsProcessingFiles(contextFiles && contextFiles.length > 0);
      console.log("📚 SUBJECT CONTEXT PREPARED:", {
        contextLength: contextText?.length || 0,
        contextFilesCount: contextFiles?.length || 0,
        contextPreview: contextText?.substring(0, 200) || "No context"
      });
    }

    const result = await sendToMabot(currentChat, textToSend, contextText, contextFiles);
    
    // 🔍 DEBUG: Resultado de sendToMabot
    console.group("📤 SEND TO MABOT RESULT");
    console.log("✅ SUCCESS:", result.ok);
    console.log("📊 DATA:", result.data);
    console.log("❌ ERROR:", result.error);
    console.groupEnd();
    
    if (result.ok) {
      const payload = result.data as any;
      const apiData = payload?.data;
      const resolvedChatId: string | undefined = payload?.chatId || apiData?.chat_id;
      const plainText = extractAssistantText(apiData) || "...";

      // 🔍 DEBUG: Texto extraído
      console.group("📝 EXTRACTED TEXT DEBUG");
      console.log("🔍 API DATA:", apiData);
      console.log("📋 EXTRACTED TEXT:", plainText);
      console.log("📏 TEXT LENGTH:", plainText.length);
      console.groupEnd();

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        message: plainText,
        time: nowTime(),
      };

      // 🔧 INDICADOR: Mostrar si se filtró respuesta múltiple
      const totalAssistantMsgs = (apiData?.messages || []).filter((m: any) => m?.role === "assistant").length;
      if (totalAssistantMsgs > 1) {
        botMessage.message += `\n\n---\n*Nota: Se filtró la respuesta para mostrar solo la información principal.*`;
      }

      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                mabotChatId: resolvedChatId || chat.mabotChatId,
                contextUploaded: true,
                messages: [...chat.messages, botMessage],
                lastActivity: new Date(),
              }
            : chat
        )
      );
      setIsLoading(false);
      setIsProcessingFiles(false);
      return;
    }

    const errorMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      message: `Error: no se pudo conectar con el asistente de IA. ${result.error}`,
      time: nowTime(),
    };

    setChatSessions((prev) =>
      prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage], lastActivity: new Date() } : chat))
    );
    setIsLoading(false);
    setIsProcessingFiles(false);
  };

  const startAgendaChat = () => {
    const session: ChatSession = {
      id: `${Date.now()}`,
      title: "Agenda",
      contextType: "agenda",
      messages: [
        {
          id: "1",
          type: "bot",
          message: `Listo. Soy tu agenda académica. Pregúntame sobre eventos, horarios o metas.\n\n📅 Tus eventos del calendario, horarios y metas semanales se proporcionarán automáticamente como contexto.`,
          time: nowTime(),
        },
      ],
      createdAt: new Date(),
      lastActivity: new Date(),
      contextUploaded: false,
    };
    setChatSessions((prev) => [...prev, session]);
    setCurrentChatId(session.id);
    setIsStartOpen(false);
  };

  const startSubjectChat = (subject: SubjectRow, topic?: string) => {
    const session: ChatSession = {
      id: `${Date.now()}`,
      title: subject.name,
      contextType: "subject",
      subjectId: subject.id,
      subjectName: subject.name,
      topic: topic?.trim() || undefined,
      messages: [
        {
          id: "1",
          type: "bot",
          message: `Nuevo chat para ${subject.name}${topic ? ` (tema: ${topic})` : ""}. ¿Qué te gustaría explorar?\n\n📚 Tus materiales de estudio y archivos se adjuntarán automáticamente para proporcionar contexto al asistente de IA.`,
          time: nowTime(),
        },
      ],
      createdAt: new Date(),
      lastActivity: new Date(),
      contextUploaded: false,
    };
    setChatSessions((prev) => [...prev, session]);
    setCurrentChatId(session.id);
    setIsStartOpen(false);
  };

  const deleteChat = (chatId: string) => {
    setChatSessions((prev) => prev.filter((c) => c.id !== chatId));
    if (chatId === currentChatId) {
      setCurrentChatId("");
    }
  };

  const handleRefreshContext = async (chat: ChatSession) => {
    if (chat.contextType !== "subject" || !chat.subjectId) return;
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Get fresh context with latest files
      const context = await prepareSubjectContextText(chat);
      
      // Send a system message to refresh context
      const refreshMessage = `🔄 Contexto actualizado con ${context.files.length} archivo(s) adjunto(s) y materiales más recientes.`;
      
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "bot",
        message: refreshMessage,
        time: nowTime(),
      };
      
      // Add system message to chat
      setChatSessions((prev) =>
        prev.map((c) =>
          c.id === chat.id
            ? {
                ...c,
                messages: [...c.messages, systemMessage],
                lastActivity: new Date(),
              }
            : c
        )
      );
      
      // Update the chat session to mark context as refreshed
      setChatSessions((prev) =>
        prev.map((c) =>
          c.id === chat.id
            ? {
                ...c,
                contextUploaded: false, // Reset to allow fresh context in next message
                lastActivity: new Date(),
              }
            : c
        )
      );
      
    } catch (error) {
      console.error("Error refreshing context:", error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "bot",
        message: "❌ Error al actualizar el contexto. Por favor, inténtalo de nuevo.",
        time: nowTime(),
      };
      
      setChatSessions((prev) =>
        prev.map((c) =>
          c.id === chat.id
            ? { ...c, messages: [...c.messages, errorMessage], lastActivity: new Date() }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

      const showMabotBanner = !mabotConfigured;

  return (
    <div className="flex flex-col h-screen pb-20">
      <div className="flex items-center justify-between pt-8 pb-4 px-6">
        <div className="w-10" />
        <div className="text-center">
          <h1 className="text-2xl font-light text-foreground/90 mb-1">Chat</h1>
          <p className="text-muted-foreground text-sm">Inicia una nueva conversación o continúa una existente</p>
        </div>
        <div className="flex items-center gap-2">
          {currentChat && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">Sesión</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer" onClick={() => deleteChat(currentChat.id)}>
                  <Trash2 size={14} className="mr-2 text-destructive" />
                  Eliminar chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsStartOpen(true)}>
                  <Plus size={14} className="mr-2" />
                  Nuevo chat
                </DropdownMenuItem>
                {currentChat.contextType === "subject" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer" 
                      onClick={() => handleRefreshContext(currentChat)}
                    >
                      <BookOpen size={14} className="mr-2" />
                      Actualizar contexto
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {showMabotBanner && (
        <div className="mx-6 mb-2 rounded-xl border border-yellow-300/40 bg-yellow-500/5 px-3 py-2 text-yellow-700 flex items-center gap-2" role="alert" aria-live="polite">
          <AlertTriangle size={16} />
          <p className="text-xs">
            Mabot ahora está configurado a través de Supabase Edge Functions. Contacta a tu administrador si necesitas acceso.
          </p>
        </div>
      )}

      {!currentChat && (
        <div className="flex-1 flex items-center justify-center px-6">
          <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-40 h-40 rounded-3xl flex flex-col items-center justify-center text-foreground bg-muted hover:bg-muted/80 border border-border/30 shadow-sm"
                aria-label="Iniciar un nuevo chat"
              >
                <Plus size={40} className="mb-2" />
                Nuevo chat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Vincular conversación</DialogTitle>
                <DialogDescription>
                  Elige hablar con tu agenda o una asignatura. Opcionalmente puedes agregar un tema para enfocarte.
                </DialogDescription>
              </DialogHeader>

              <Card className="p-4 rounded-2xl border border-border/30 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="text-primary" size={18} />
                    </div>
                    <div>
                      <p className="font-medium">Agenda</p>
                      <p className="text-sm text-muted-foreground">Calendario académico y horarios</p>
                    </div>
                  </div>
                  <Button onClick={startAgendaChat} className="rounded-xl">Chat con Agenda</Button>
                </div>
              </Card>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground/80">Asignaturas</p>
                <div className="rounded-xl border border-border/30">
                  <Command className="rounded-xl">
                    <CommandInput placeholder="Buscar asignatura..." />
                    <CommandList className="max-h-64 overflow-auto">
                      <CommandEmpty>No se encontraron asignaturas.</CommandEmpty>
                      <CommandGroup heading="Disponibles">
                        {subjectsLoading ? (
                          <div className="p-3 text-sm text-muted-foreground">Cargando...</div>
                        ) : (
                          subjects.map((s) => (
                            <CommandItem key={s.id} onSelect={() => setSelectedSubject(s)} className="cursor-pointer">
                              <BookOpen className="mr-2 h-4 w-4 text-primary" />
                              <span>{s.name}</span>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                {selectedSubject && (
                  <div className="mt-2 space-y-2">
                    <Input
                      placeholder="Tema opcional (ej., Derivadas, Unidad 3)"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      className="rounded-xl"
                      aria-label="Tema opcional"
                    />
                    <div className="flex gap-2">
                      <Button className="rounded-xl" onClick={() => startSubjectChat(selectedSubject, topicInput)}>
                        Iniciar con tema
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={() => startSubjectChat(selectedSubject)}>
                        Chat con asignatura
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {currentChat && (
        <div className="flex-1 px-6 space-y-4 overflow-y-auto">
          {currentChat.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.type === "user" ? "bg-primary text-primary-foreground ml-8" : "gradient-card border-border/30 mr-8"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {msg.type === "bot" ? (
                    <Bot size={16} className="text-primary mt-0.5" />
                  ) : (
                    <User size={16} className="text-primary-foreground mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <span
                      className={`text-xs mt-2 block ${msg.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="gradient-card border-border/30 p-4 rounded-2xl mr-8">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-primary" />
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {currentChat?.contextType === "subject" && !currentChat?.contextUploaded 
                        ? "Procesando materiales y archivos..." 
                        : isProcessingFiles
                         ? "Procesando archivos PDF (esto puede tomar un momento)..." 
                         : "Pensando..."
                       }
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {currentChat && (
        <div className="px-6 pb-4">
          {/* Context status indicator */}
          {currentChat.contextType === "subject" && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen size={12} />
              <span>
                {currentChat.contextUploaded 
                  ? "📎 Contexto cargado con materiales y archivos" 
                  : "🔄 El contexto se actualizará con los materiales y archivos más recientes"
                }
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder={
                currentChat.contextType === "agenda" ? "Pregunta a tu agenda..." : `Pregunta sobre ${currentChat.title}...`
              }
              className="flex-1 rounded-2xl border-border/30 bg-card/50 backdrop-blur-sm"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              aria-label="Mensaje"
            />
            <Button
              size="icon"
              className="rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Enviar mensaje"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}