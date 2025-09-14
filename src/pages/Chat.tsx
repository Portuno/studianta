import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Inserts, Tables } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, Bot, Calendar, Loader2, Send, User, BookOpen, GraduationCap, Paperclip, X, FileText, Plus, Trash2 } from "lucide-react";
import { usePrograms } from "@/hooks/useSupabase";

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  message: string;
  time: string;
}

interface ChatSession {
  id: string;
  title: string;
  contextType: "general" | "agenda" | "subject" | "program" | "folder";
  subjectId?: string;
  subjectName?: string;
  topic?: string;
  programId?: string;
  programName?: string;
  folderId?: string;
  folderName?: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  mabotChatId?: string;
  contextUploaded?: boolean;
}

interface SubjectRow {
  id: string;
  name: string;
  program_id?: string;
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
  const [searchParams] = useSearchParams();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  // Keep ref in sync with state
  useEffect(() => {
    chatSessionsRef.current = chatSessions;
  }, [chatSessions]);

  // Obtener parámetros de URL para carpeta específica
  const folderId = searchParams.get('folderId');
  const folderName = searchParams.get('folderName');
  const subjectId = searchParams.get('subjectId');

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const chatSessionsRef = useRef<ChatSession[]>([]);

  // Context data
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const { programs } = usePrograms();
  const [currentProgramId, setCurrentProgramId] = useState<string | null>(null);
  const currentProgram = useMemo(() => programs.find((p) => p.id === currentProgramId) || null, [programs, currentProgramId]);

  // Chat attachments (PDF/TXT) and scrolling
  const [attachedFiles, setAttachedFiles] = useState<Array<{ file: File; title: string; mime_type: string; url?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const accepted = files.filter((f) => {
      const ext = f.name.toLowerCase().split('.').pop() || '';
      const type = (f.type || '').toLowerCase();
      return type === 'application/pdf' || type === 'text/plain' || ext === 'pdf' || ext === 'txt';
    });
    const mapped = accepted.map((f) => ({ file: f, title: f.name, mime_type: f.type || (f.name.toLowerCase().endsWith('.txt') ? 'text/plain' : 'application/pdf') }));
    setAttachedFiles((prev) => [...prev, ...mapped]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };


  const uploadChatFile = async (file: File): Promise<{ url: string; mime_type: string; title: string; fileName: string; name: string; mimeType: string } | null> => {
    try {
      const userId = user?.id || 'anon';
      const safeName = file.name.replace(/[^\w.\-]/g, '_');
      const path = `${userId}/chat/${Date.now()}_${safeName}`;
      const contentType = file.type || (file.name.toLowerCase().endsWith('.txt') ? 'text/plain' : 'application/pdf');
      const { error: upErr } = await supabase.storage.from('study-materials').upload(path, file, { contentType, upsert: false });
      if (upErr) {
        console.error('Upload error:', upErr);
        return null;
      }
      const { data: signed, error: urlErr } = await supabase.storage.from('study-materials').createSignedUrl(path, 60 * 60);
      if (urlErr || !signed?.signedUrl) {
        console.error('Signed URL error:', urlErr);
        return null;
      }
      return { url: signed.signedUrl, mime_type: contentType, title: file.name, fileName: file.name, name: file.name, mimeType: contentType };
    } catch (err) {
      console.error('uploadChatFile failed:', err);
      return null;
    }
  };

  // Mabot configuration now handled by Supabase Edge Function
  const mabotConfigured = true; // Always true since we're using Edge Function

  const currentChat = chatSessions.find((c) => c.id === currentChatId) || null;

  // ---- Sessions management ----
  const handleCreateNewChat = async () => {
    if (!user?.id) return;
    const baseTitle = "Nuevo chat";
    const suffix = chatSessions.length + 1;
    const title = `${baseTitle} ${suffix}`;
    try {
      const toInsert: Inserts<"chat_sessions"> = {
        user_id: user.id,
        title,
        context: "general",
      } as any;
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert([toInsert])
        .select("id, title, context, mabot_chat_id, created_at, last_activity, subject_id, folder_id, folder_name")
        .single();
      if (error) throw error;
      const newSession: ChatSession = {
        id: data.id,
        title: data.title || title,
        contextType: (data.context as any) || "general",
        subjectId: data.subject_id || undefined,
        folderId: data.folder_id || undefined,
        folderName: data.folder_name || undefined,
        messages: [],
        createdAt: new Date(data.created_at),
        lastActivity: new Date(data.last_activity || data.created_at),
        mabotChatId: data.mabot_chat_id || undefined,
        contextUploaded: false,
      };
      setChatSessions((prev) => [newSession, ...prev]);
      setCurrentChatId(data.id);
      // Load messages (should be none initially)
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("id, chat_id, user_id, content, role, created_at")
        .eq("chat_id", data.id)
        .order("created_at", { ascending: true });
      const mappedMsgs: ChatMessage[] = (msgs || []).map((m: any) => ({
        id: m.id,
        type: m.role === "assistant" ? "bot" : "user",
        message: m.content,
        time: new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit", hour12: false }),
      }));
      setChatSessions((prev) => prev.map((c) => (c.id === data.id ? { ...c, messages: mappedMsgs } : c)));
    } catch (e) {
      console.error("Failed to create new chat session:", e);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (!sessionId || currentChatId === sessionId) return;
    setCurrentChatId(sessionId);
    // Messages load via effect, but we can prefetch for snappy UX
    try {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("id, chat_id, user_id, content, role, created_at")
        .eq("chat_id", sessionId)
        .order("created_at", { ascending: true });
      const mappedMsgs: ChatMessage[] = (msgs || []).map((m: any) => ({
        id: m.id,
        type: m.role === "assistant" ? "bot" : "user",
        message: m.content,
        time: new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit", hour12: false }),
      }));
      setChatSessions((prev) => prev.map((c) => (c.id === sessionId ? { ...c, messages: mappedMsgs } : c)));
    } catch (e) {
      console.error("Failed to prefetch messages for session:", e);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      await supabase.from("chat_sessions").delete().eq("id", sessionId);
      setChatSessions((prev) => prev.filter((c) => c.id !== sessionId));
      if (currentChatId === sessionId) {
        const next = chatSessions.find((c) => c.id !== sessionId)?.id || "";
        setCurrentChatId(next);
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  // Remember active chat across navigations
  useEffect(() => {
    if (currentChatId && typeof window !== "undefined") {
      window.localStorage.setItem("activeChatId", currentChatId);
    }
  }, [currentChatId]);

  // Smooth autoscroll; instant on first render to avoid visible jump
  const didInitialScrollRef = useRef<boolean>(false);
  useEffect(() => {
    const behavior = didInitialScrollRef.current ? 'smooth' : 'auto';
    messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'end' });
    if (!didInitialScrollRef.current) didInitialScrollRef.current = true;
  }, [currentChat?.messages.length, isLoading]);

  // Handle folder-specific chat navigation
  useEffect(() => {
    const createFolderSession = async () => {
      if (folderId && folderName && subjectId && user) {
        // Crear o encontrar sesión de chat para esta carpeta
        const folderSessionTitle = `Chat con carpeta: ${folderName}`;
        
        // Buscar si ya existe una sesión para esta carpeta
        const existingSession = chatSessionsRef.current.find(session => 
          session.folderId === folderId && 
          session.subjectId === subjectId
        );
        
        if (existingSession) {
          setCurrentChatId(existingSession.id);
        } else {
          // Crear nueva sesión para la carpeta en la base de datos
          try {
            const sessionId = `folder-${folderId}-${Date.now()}`;
            const toInsert: Inserts<"chat_sessions"> = {
              id: sessionId,
              user_id: user.id,
              title: folderSessionTitle,
              context: "folder",
              subject_id: subjectId,
              folder_id: folderId,
              folder_name: folderName,
            } as any;
            
            const { data, error } = await supabase
              .from("chat_sessions")
              .insert([toInsert])
              .select("id, title, context, mabot_chat_id, created_at, last_activity, subject_id, folder_id, folder_name")
              .single();
              
            if (error) throw error;
            
            const newSession: ChatSession = {
              id: data.id,
              title: data.title || folderSessionTitle,
              contextType: "folder",
              subjectId: subjectId,
              folderId: folderId,
              folderName: folderName,
              messages: [],
              createdAt: new Date(data.created_at),
              lastActivity: new Date(data.last_activity || data.created_at),
              mabotChatId: data.mabot_chat_id || undefined,
              contextUploaded: false,
            };
            
            setChatSessions(prev => [newSession, ...prev]);
            setCurrentChatId(newSession.id);
          } catch (e) {
            console.error("Failed to create folder chat session:", e);
            // Fallback to local session if DB fails
            const newSession: ChatSession = {
              id: `folder-${folderId}-${Date.now()}`,
              title: folderSessionTitle,
              contextType: "folder",
              subjectId: subjectId,
              folderId: folderId,
              folderName: folderName,
              messages: [],
              createdAt: new Date(),
              lastActivity: new Date(),
            };
            
            setChatSessions(prev => [newSession, ...prev]);
            setCurrentChatId(newSession.id);
          }
        }
      }
    };
    
    createFolderSession();
  }, [folderId, folderName, subjectId, user]);

  // Handle subject-specific chat navigation (without folder)
  useEffect(() => {
    const createSubjectSession = async () => {
      if (subjectId && !folderId && user) {
        // Buscar si ya existe una sesión para esta asignatura
        const existingSession = chatSessionsRef.current.find(session => 
          session.subjectId === subjectId && 
          !session.folderId
        );
        
        if (existingSession) {
          setCurrentChatId(existingSession.id);
        } else {
          // Crear nueva sesión para la asignatura en la base de datos
          try {
            const sessionId = `subject-${subjectId}-${Date.now()}`;
            const subjectSessionTitle = `Chat con asignatura`;
            
            const toInsert: Inserts<"chat_sessions"> = {
              id: sessionId,
              user_id: user.id,
              title: subjectSessionTitle,
              context: "subject",
            } as any;
            
            const { data, error } = await supabase
              .from("chat_sessions")
              .insert([toInsert])
              .select("id, title, context, mabot_chat_id, created_at, last_activity, subject_id, folder_id, folder_name")
              .single();
              
            if (error) throw error;
            
            const newSession: ChatSession = {
              id: data.id,
              title: data.title || subjectSessionTitle,
              contextType: "subject",
              subjectId: subjectId,
              messages: [],
              createdAt: new Date(data.created_at),
              lastActivity: new Date(data.last_activity || data.created_at),
              mabotChatId: data.mabot_chat_id || undefined,
              contextUploaded: false,
            };
            
            setChatSessions(prev => [newSession, ...prev]);
            setCurrentChatId(newSession.id);
          } catch (e) {
            console.error("Failed to create subject chat session:", e);
            // Fallback to local session if DB fails
            const newSession: ChatSession = {
              id: `subject-${subjectId}-${Date.now()}`,
              title: "Chat con asignatura",
              contextType: "subject",
              subjectId: subjectId,
              messages: [],
              createdAt: new Date(),
              lastActivity: new Date(),
            };
            
            setChatSessions(prev => [newSession, ...prev]);
            setCurrentChatId(newSession.id);
          }
        }
      }
    };
    
    createSubjectSession();
  }, [subjectId, folderId, user]);

  // Load sessions from DB and ensure a default exists
  useEffect(() => {
    const loadSessionsFromDb = async () => {
      if (!user) return;
      setLoadingSessions(true);
      try {
        const { data: sessions, error } = await supabase
          .from("chat_sessions")
          .select("id, title, context, mabot_chat_id, created_at, last_activity, subject_id, folder_id, folder_name")
          .order("last_activity", { ascending: false });
        if (error) throw error;

        if (!sessions || sessions.length === 0) {
          const toInsert: Inserts<"chat_sessions"> = {
            user_id: user.id,
            title: "Chat General",
            context: "general",
          } as any;
          const { data: created, error: insErr } = await supabase
            .from("chat_sessions")
            .insert([toInsert])
            .select("id, title, context, mabot_chat_id, created_at, last_activity, subject_id, folder_id, folder_name")
            .single();
          if (insErr) throw insErr;
          const mapped: ChatSession = {
            id: created.id,
            title: created.title || "Chat General",
            contextType: (created.context as any) || "general",
            subjectId: created.subject_id || undefined,
            folderId: created.folder_id || undefined,
            folderName: created.folder_name || undefined,
            messages: [],
            createdAt: new Date(created.created_at),
            lastActivity: new Date(created.last_activity || created.created_at),
            mabotChatId: created.mabot_chat_id || undefined,
            contextUploaded: false,
          };
          setChatSessions([mapped]);
          setCurrentChatId(created.id);
          // Fetch messages for the created session
          const { data: msgs } = await supabase
            .from("chat_messages")
            .select("id, chat_id, user_id, content, role, created_at")
            .eq("chat_id", created.id)
            .order("created_at", { ascending: true });
          const mappedMsgs: ChatMessage[] = (msgs || []).map((m: any) => ({
            id: m.id,
            type: m.role === "assistant" ? "bot" : "user",
            message: m.content,
            time: new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit", hour12: false }),
          }));
          setChatSessions((prev) => prev.map((c) => (c.id === created.id ? { ...c, messages: mappedMsgs } : c)));
          return;
        }

        const mapped: ChatSession[] = sessions.map((s: any) => ({
          id: s.id,
          title: s.title || "Chat",
          contextType: (s.context as any) || "general",
          subjectId: s.subject_id || undefined,
          folderId: s.folder_id || undefined,
          folderName: s.folder_name || undefined,
          messages: [],
          createdAt: new Date(s.created_at),
          lastActivity: new Date(s.last_activity || s.created_at),
          mabotChatId: s.mabot_chat_id || undefined,
          contextUploaded: false,
        }));
        setChatSessions(mapped);
        const saved = typeof window !== "undefined" ? window.localStorage.getItem("activeChatId") : null;
        const exists = mapped.find((m) => m.id === saved)?.id;
        const activeId = exists || mapped[0]?.id || "";
        setCurrentChatId((prev) => prev || activeId);

        if (activeId) {
          const { data: msgs, error: msgsErr } = await supabase
            .from("chat_messages")
            .select("id, chat_id, user_id, content, role, created_at")
            .eq("chat_id", activeId)
            .order("created_at", { ascending: true });
          if (!msgsErr) {
            const mappedMsgs: ChatMessage[] = (msgs || []).map((m: any) => ({
              id: m.id,
              type: m.role === "assistant" ? "bot" : "user",
              message: m.content,
              time: new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit", hour12: false }),
            }));
            setChatSessions((prev) => prev.map((c) => (c.id === activeId ? { ...c, messages: mappedMsgs } : c)));
          }
        }
      } catch (e) {
        console.error("Failed to load chat sessions:", e);
      } finally {
        setLoadingSessions(false);
      }
    };
    loadSessionsFromDb();
  }, [user]);

  // Load messages for current session
  useEffect(() => {
    const loadMessages = async (sessionId: string) => {
      if (!user || !sessionId) return;
      const { data: msgs, error } = await supabase
        .from("chat_messages")
        .select("id, chat_id, user_id, content, role, created_at")
        .eq("chat_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Failed to load messages:", error);
        return;
      }
      const mapped: ChatMessage[] = (msgs || []).map((m: any) => ({
        id: m.id,
        type: m.role === "assistant" ? "bot" : "user",
        message: m.content,
        time: new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit", hour12: false }),
      }));
      setChatSessions((prev) => prev.map((c) => (c.id === sessionId ? { ...c, messages: mapped } : c)));
    };
    if (currentChatId) loadMessages(currentChatId);
  }, [currentChatId, user]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setSubjectsLoading(true);
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, name, program_id")
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

  // Initialize default program (persisted)
  useEffect(() => {
    if (!currentProgramId && programs.length > 0) {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("chatProgramId") : null;
      const fallback = programs[0]?.id;
      const chosen = programs.find((p) => p.id === saved)?.id || fallback || null;
      if (chosen) {
        setCurrentProgramId(chosen);
        if (typeof window !== "undefined") window.localStorage.setItem("chatProgramId", chosen);
      }
    }
  }, [programs, currentProgramId]);

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

    if (session.contextType === "general") {
      return (
        `ROLE: You are an AI study assistant.\n` +
        `Student: ${name}.\n` +
        `CONTEXT: General chat without attached materials. Prefer concise, practical guidance.\n` +
        `LANGUAGE INSTRUCTION: Detect the language and respond in the SAME language.\n` +
        `If user needs deeper help, suggest selecting a context (Agenda, Subject, Program) or uploading materials via Library.\n` +
        `Question:`
      );
    }

    if (session.contextType === "program") {
      const ctx = session.programName || "the selected program";
      return (
        `ROLE: You are an AI study assistant focused on the user's program.\n` +
        `Student: ${name}.\n` +
        `Primary context: Program — ${ctx}.\n` +
        `LANGUAGE INSTRUCTION: Detect the language and respond in the SAME language.\n` +
        `Use ONLY the provided program subjects, materials and notes when available. If insufficient, ask to refine or upload.\n` +
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
    // Use session.subjectId if available, otherwise fallback to URL params
    const effectiveSubjectId = session.subjectId || subjectId;
    const effectiveFolderId = session.folderId || folderId;
    
    console.log("🔍 PREPARE SUBJECT CONTEXT DEBUG:", {
      sessionSubjectId: session.subjectId,
      urlSubjectId: subjectId,
      effectiveSubjectId,
      sessionFolderId: session.folderId,
      urlFolderId: folderId,
      effectiveFolderId,
      sessionContextType: session.contextType
    });
    
    if (!effectiveSubjectId || !user) return { text: "", files: [] };

    // Construir query base
    let query = supabase
      .from("study_materials")
      .select("id, title, type, content, file_path, file_size, mime_type, created_at, folder_id")
      .eq("user_id", user.id)
      .eq("subject_id", effectiveSubjectId);

    // Si hay una carpeta específica, filtrar por ella
    if (effectiveFolderId) {
      query = query.eq("folder_id", effectiveFolderId);
    }

    const { data: materials, error } = await query
      .order("created_at", { ascending: false })
      .limit(25);

    console.log("📚 MATERIALS QUERY RESULT:", {
      materialsCount: materials?.length || 0,
      materials: materials?.map(m => ({ id: m.id, title: m.title, folder_id: m.folder_id })) || [],
      error: error?.message || null
    });

    if (error) {
      console.error("Error fetching materials for context:", error);
      return { text: "", files: [] };
    }

    if (!materials || materials.length === 0) {
      const effectiveFolderName = session.folderName || folderName;
      const folderContext = effectiveFolderId ? ` in folder "${effectiveFolderName}"` : "";
      return { text: `No materials found for this subject${folderContext} yet.`, files: [] };
    }

    const topic = (session.topic || "").toLowerCase().trim();
    const filtered = !topic
      ? (materials as StudyMaterialRow[])
      : (materials as StudyMaterialRow[]).filter((m) =>
          m.title?.toLowerCase().includes(topic) || (m.content || "").toLowerCase().includes(topic)
        );

    const lines: string[] = [];
    const files: any[] = [];
    
    // Agregar contexto de carpeta si aplica
    if (session.folderId && session.folderName) {
      lines.push(`📁 Chatting with folder: "${session.folderName}"`);
      lines.push(`📚 Materials in this folder (${filtered.length}/${materials.length}):`);
    } else {
      lines.push(`📚 Attached study materials (${filtered.length}/${materials.length}):`);
    }

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

  const prepareProgramContextText = async (
    session: ChatSession
  ): Promise<{ text: string; files: any[] }> => {
    if (!user || !session.programId) return { text: "", files: [] };

    // Fetch subjects in the program
    const { data: subs, error: subsErr } = await supabase
      .from("subjects")
      .select("id,name")
      .eq("user_id", user.id)
      .eq("program_id", session.programId);

    if (subsErr) {
      console.error("Error fetching program subjects:", subsErr);
      return { text: "", files: [] };
    }

    const subjectIds = (subs || []).map((s) => s.id);
    const subjectNames = (subs || []).map((s) => s.name);

    if (subjectIds.length === 0) {
      return {
        text: `Program ${session.programName || "selected"} has no subjects yet.`,
        files: [],
      };
    }

    // Fetch recent materials across the program's subjects
    const { data: mats, error: matsErr } = await supabase
      .from("study_materials")
      .select("id,title,type,content,file_path,file_size,mime_type,created_at,subject_id")
      .eq("user_id", user.id)
      .in("subject_id", subjectIds)
      .order("created_at", { ascending: false })
      .limit(30);

    if (matsErr) {
      console.error("Error fetching program materials:", matsErr);
      return { text: "", files: [] };
    }

    const files: any[] = [];
    const lines: string[] = [];
    lines.push(`Program subjects: ${subjectNames.join(", ")}`);
    lines.push(`Attached study materials (${mats?.length || 0}):`);

    for (const m of mats || []) {
      let urlNote = "";
      if (m.file_path) {
        try {
          const { data: urlData, error: urlErr } = await supabase.storage
            .from("study-materials")
            .createSignedUrl(m.file_path, 60 * 60);
          if (!urlErr && urlData?.signedUrl) {
            urlNote = ` [url: ${urlData.signedUrl}]`;
            if (m.type === "pdf" || m.mime_type === "application/pdf") {
              files.push({
                url: urlData.signedUrl,
                title: m.title,
                mime_type: m.mime_type || "application/pdf",
                type: m.type,
              });
            }
          }
        } catch (e) {
          console.warn("Signed URL error (program):", e);
        }
      }
      const snippet = m.content
        ? ` snippet: ${m.content.slice(0, 400)}${m.content.length > 400 ? "…" : ""}`
        : "";
      lines.push(`- ${m.title} (${m.type})${urlNote}${snippet}`);
    }

    return { text: lines.join("\n"), files };
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
        .map((f: any, idx: number) => `- ${f.title || f.fileName || f.name || `file_${idx+1}`}`)
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
      const timeoutSeconds = contextFiles && contextFiles.length > 0 ? 60000 : 30000;
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
          contextFiles,
          files: contextFiles,
          attachments: contextFiles
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
    if (!user?.id) {
      console.error("Cannot send message without authenticated user");
      return;
    }

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

    // Optimistic UI append
    setChatSessions((prev) => prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, userMessage], lastActivity: new Date() } : chat)));

    // Persist user message
    try {
      const row: Inserts<"chat_messages"> = {
        chat_id: currentChat.id,
        user_id: user.id,
        content: inputMessage,
        role: "user",
      } as any;
      await supabase.from("chat_messages").insert([row]);
    } catch (e) {
      console.error("Failed to persist user message:", e);
    }

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
    } else if (currentChat.contextType === "subject") {
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
    } else if (currentChat.contextType === "program") {
      const context = await prepareProgramContextText(currentChat);
      contextText = context.text;
      contextFiles = context.files;
      setIsProcessingFiles(contextFiles && contextFiles.length > 0);
      console.log("🏫 PROGRAM CONTEXT PREPARED:", {
        contextLength: contextText?.length || 0,
        contextFilesCount: contextFiles?.length || 0,
        contextPreview: contextText?.substring(0, 200) || "No context",
      });
    }

    // Upload any files the user attached in this message (PDF/TXT)
    try {
      if (attachedFiles.length > 0) {
        setIsProcessingFiles(true);
        const uploaded: any[] = [];
        for (const f of attachedFiles) {
          const up = await uploadChatFile(f.file);
          if (up) uploaded.push(up);
        }
        contextFiles = [...(contextFiles || []), ...uploaded];
      }
    } catch (err) {
      console.error('Attachment upload failed:', err);
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
      // Persist assistant message and update session if needed
      try {
        if (resolvedChatId && resolvedChatId !== currentChat.mabotChatId) {
          await supabase.from("chat_sessions").update({ mabot_chat_id: resolvedChatId }).eq("id", currentChat.id);
        }
        const row: Inserts<"chat_messages"> = {
          chat_id: currentChat.id,
          user_id: user?.id || undefined,
          content: botMessage.message,
          role: "assistant",
        } as any;
        await supabase.from("chat_messages").insert([row]);
      } catch (e) {
        console.error("Failed to persist assistant message or update session:", e);
      }
      // Clear attachments after successful send
      setAttachedFiles([]);
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
    // Clear attachments on error as well
    setAttachedFiles([]);
    setIsLoading(false);
    setIsProcessingFiles(false);
  };

  // Context switchers (single chat UX)
  const setContextGeneral = async () => {
    if (!currentChat) return;
    const updated: ChatSession = {
      ...currentChat,
      title: "Chat General",
      contextType: "general",
      subjectId: undefined,
      subjectName: undefined,
      programId: undefined,
      programName: undefined,
      topic: undefined,
      contextUploaded: false,
      lastActivity: new Date(),
      messages: [
        ...currentChat.messages,
        {
          id: Date.now().toString(),
          type: "bot",
          message: "💬 Contexto cambiado a General.",
          time: nowTime(),
        },
      ],
    };
    setChatSessions((prev) => prev.map((c) => (c.id === currentChat.id ? updated : c)));
    try {
      await supabase.from("chat_sessions").update({ title: "Chat General", context: "general" }).eq("id", currentChat.id);
      await supabase.from("chat_messages").insert([
        { chat_id: currentChat.id, user_id: user?.id || undefined, content: "💬 Contexto cambiado a General.", role: "assistant" } as Inserts<"chat_messages">,
      ]);
    } catch (e) {
      console.error("Failed to persist general context change:", e);
    }
  };

  const setContextAgenda = async () => {
    if (!currentChat) return;
    const updated: ChatSession = {
      ...currentChat,
      title: "Agenda",
      contextType: "agenda",
      subjectId: undefined,
      subjectName: undefined,
      programId: undefined,
      programName: undefined,
      topic: undefined,
      contextUploaded: false,
      lastActivity: new Date(),
      messages: [
        ...currentChat.messages,
        {
          id: Date.now().toString(),
          type: "bot",
          message: "📅 Contexto cambiado a Agenda.",
          time: nowTime(),
        },
      ],
    };
    setChatSessions((prev) => prev.map((c) => (c.id === currentChat.id ? updated : c)));
    try {
      await supabase.from("chat_sessions").update({ title: "Agenda", context: "agenda" }).eq("id", currentChat.id);
      await supabase.from("chat_messages").insert([
        { chat_id: currentChat.id, user_id: user?.id || undefined, content: "📅 Contexto cambiado a Agenda.", role: "assistant" } as Inserts<"chat_messages">,
      ]);
    } catch (e) {
      console.error("Failed to persist agenda context change:", e);
    }
  };

  const setContextSubject = async (subject: SubjectRow) => {
    if (!currentChat) return;
    const updated: ChatSession = {
      ...currentChat,
      title: subject.name,
      contextType: "subject",
      subjectId: subject.id,
      subjectName: subject.name,
      programId: undefined,
      programName: undefined,
      topic: undefined,
      contextUploaded: false,
      lastActivity: new Date(),
      messages: [
        ...currentChat.messages,
        {
          id: Date.now().toString(),
          type: "bot",
          message: `📚 Contexto cambiado a Asignatura: ${subject.name}.`,
          time: nowTime(),
        },
      ],
    };
    setChatSessions((prev) => prev.map((c) => (c.id === currentChat.id ? updated : c)));

    try {
      await supabase.from("chat_sessions").update({ title: subject.name, context: "subject" }).eq("id", currentChat.id);
      await supabase.from("chat_messages").insert([
        {
          chat_id: currentChat.id,
          user_id: user?.id || undefined,
          content: `📚 Contexto cambiado a Asignatura: ${subject.name}.`,
          role: "assistant",
        } as Inserts<"chat_messages">,
      ]);
    } catch (e) {
      console.error("Failed to persist subject context change:", e);
    }
  };

  const setContextProgram = async (programId: string, programName: string) => {
    if (!currentChat) return;
    const updated: ChatSession = {
      ...currentChat,
      title: programName,
      contextType: "program",
      programId,
      programName,
      subjectId: undefined,
      subjectName: undefined,
      topic: undefined,
      contextUploaded: false,
      lastActivity: new Date(),
      messages: [
        ...currentChat.messages,
        {
          id: Date.now().toString(),
          type: "bot",
          message: `🎓 Contexto cambiado a Carrera: ${programName}.`,
          time: nowTime(),
        },
      ],
    };
    setChatSessions((prev) => prev.map((c) => (c.id === currentChat.id ? updated : c)));

    try {
      await supabase.from("chat_sessions").update({ title: programName, context: "program" }).eq("id", currentChat.id);
      await supabase.from("chat_messages").insert([
        {
          chat_id: currentChat.id,
          user_id: user?.id || undefined,
          content: `🎓 Contexto cambiado a Carrera: ${programName}.`,
          role: "assistant",
        } as Inserts<"chat_messages">,
      ]);
    } catch (e) {
      console.error("Failed to persist program context change:", e);
    }
  };

  const handleSelectProgram = (programId: string, programName: string) => {
    setCurrentProgramId(programId);
    if (typeof window !== "undefined") window.localStorage.setItem("chatProgramId", programId);
    if (currentChat?.contextType === "program") {
      setContextProgram(programId, programName);
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
    <div className="flex flex-col h-[100vh] overflow-hidden">
      <div className="flex items-center justify-between pt-8 pb-4 px-6">
        <div className="text-left">
          <h1 className="text-2xl font-light text-foreground/90 mb-1">Chat</h1>
          <p className="text-muted-foreground text-sm">Acción inmediata → Contexto opcional</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={handleCreateNewChat} aria-label="Nuevo chat">
            <Plus size={14} className="mr-1" /> Nuevo chat
          </Button>
          {currentChat && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="rounded-xl bg-violet-300 text-white hover:bg-violet-400 border-0">
                  {`Contexto: ${
                    currentChat.contextType === "agenda"
                      ? "Agenda"
                      : currentChat.contextType === "subject"
                      ? currentChat.subjectName || "Asignatura"
                      : currentChat.contextType === "program"
                      ? currentChat.programName || "Carrera"
                      : "Chat General"
                  }`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel>Seleccionar contexto</DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer" onClick={setContextGeneral}>
                  🟣 Chat General
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={setContextAgenda}>
                  📅 Agenda
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="inline-flex items-center gap-2"><BookOpen size={14} /> Asignaturas</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 overflow-auto">
                    {subjectsLoading && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">Cargando…</div>
                    )}
                    {!subjectsLoading && (!currentProgram || subjects.filter((s) => (s as any).program_id === currentProgram.id).length === 0) && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">{currentProgram ? "Sin asignaturas en esta carrera" : "Primero selecciona una carrera"}</div>
                    )}
                    {!subjectsLoading && currentProgram && subjects
                      .filter((s) => (s as any).program_id === currentProgram.id)
                      .map((s) => (
                        <DropdownMenuItem key={s.id} className="cursor-pointer" onClick={() => setContextSubject(s)}>
                          {s.name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span className="inline-flex items-center gap-2">🎓 Carreras</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 overflow-auto">
                    {(programs || []).length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No hay carreras</div>
                    )}
                    {(programs || []).map((p) => (
                      <DropdownMenuItem key={p.id} className="cursor-pointer" onClick={() => handleSelectProgram(p.id, p.name)}>
                        <GraduationCap size={14} className="mr-2" />
                        <span className="flex-1">{p.name}</span>
                        {currentProgramId === p.id && <span className="text-xs text-primary">✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {currentChat.contextType === "subject" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleRefreshContext(currentChat)}>
                      <BookOpen size={14} className="mr-2" /> Actualizar contexto
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Sessions list */}
      <div className="px-6 -mt-2 mb-2 flex items-center gap-2 overflow-x-auto">
        {chatSessions.map((s) => (
          <div key={s.id} className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 border ${s.id === currentChatId ? 'bg-primary/10 border-primary/40' : 'bg-background border-border'} cursor-pointer`}
               onClick={() => handleSelectSession(s.id)}
               role="button" tabIndex={0}
               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectSession(s.id); }}
               aria-label={`Seleccionar chat ${s.title}`}>
            <span className="text-sm whitespace-nowrap max-w-[200px] truncate">{s.title}</span>
            <button
              type="button"
              className="p-1 rounded hover:bg-muted"
              aria-label={`Eliminar chat ${s.title}`}
              onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
            >
              <Trash2 size={14} className="text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      {/* Selector de carrera fijo al lado del contexto para acceso rápido */}
      <div className="px-6 -mt-2 mb-2 flex items-center gap-2">
        {programs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-xl bg-violet-300 text-white hover:bg-violet-400 border-0">
                {`Carrera: ${currentProgram?.name || "—"}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              <DropdownMenuLabel>Cambiar carrera</DropdownMenuLabel>
              {programs.map((p) => (
                <DropdownMenuItem key={p.id} className="cursor-pointer" onClick={() => handleSelectProgram(p.id, p.name)}>
                  <GraduationCap size={14} className="mr-2" />
                  <span className="flex-1">{p.name}</span>
                  {currentProgramId === p.id && <span className="text-xs text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {showMabotBanner && (
        <div className="mx-6 mb-2 rounded-xl border border-yellow-300/40 bg-yellow-500/5 px-3 py-2 text-yellow-700 flex items-center gap-2" role="alert" aria-live="polite">
          <AlertTriangle size={16} />
          <p className="text-xs">
            Mabot ahora está configurado a través de Supabase Edge Functions. Contacta a tu administrador si necesitas acceso.
          </p>
        </div>
      )}

      {/* Siempre mostramos el chat activo (única sesión) */}
      {currentChat && (
        <div className="flex-1 min-h-0 px-6 space-y-4 overflow-y-auto">
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
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" />
                        ),
                        ul: ({node, ...props}) => (
                          <ul {...props} className="list-disc ml-5 my-2" />
                        ),
                        ol: ({node, ...props}) => (
                          <ol {...props} className="list-decimal ml-5 my-2" />
                        ),
                        li: ({node, ...props}) => <li {...props} className="my-0.5" />,
                        code: ({node, className, children, ...props}) => (
                          <code className={`rounded px-1 py-0.5 bg-muted text-foreground/90 ${className || ''}`} {...props}>{children}</code>
                        )
                      }}
                      className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                    >
                      {msg.message}
                    </ReactMarkdown>
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
          <div ref={messagesEndRef} />
        </div>
      )}

      {currentChat && (
        <div className="px-6 pb-5 pt-2 border-t border-violet-300/50 bg-violet-200/60 backdrop-blur supports-[backdrop-filter]:bg-violet-200/60 flex-shrink-0">
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

          {/* Attached files chips */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((f, idx) => (
                <span key={`${f.title}-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground">
                  <FileText size={12} className="text-muted-foreground" />
                  <span className="max-w-[180px] truncate" title={f.title}>{f.title}</span>
                  <button
                    type="button"
                    aria-label={`Quitar ${f.title}`}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/10"
                    onClick={() => handleRemoveAttachment(idx)}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              className="rounded-2xl bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-200/40"
              onClick={handleChooseFiles}
              aria-label="Adjuntar archivos (PDF o TXT)"
              disabled={isLoading}
            >
              <Paperclip size={18} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Input
              placeholder={
                currentChat.contextType === "agenda"
                  ? "Pregunta sobre tu agenda..."
                  : currentChat.contextType === "subject"
                  ? `Pregunta sobre ${currentChat.subjectName || "la asignatura"}...`
                  : currentChat.contextType === "program"
                  ? `Pregunta sobre ${currentChat.programName || "la carrera"}...`
                  : "Pregunta sobre lo que quieras..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 rounded-2xl border-violet-300/50 focus:border-violet-400/50 focus:ring-violet-400/20"
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              className="rounded-2xl bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-200/40"
              onClick={handleSendMessage}
              aria-label="Enviar mensaje"
              disabled={isLoading || !inputMessage.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}