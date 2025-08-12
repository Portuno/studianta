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
  new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export default function Chat() {
  const { user } = useAuth();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRow | null>(null);
  const [topicInput, setTopicInput] = useState("");

  const MABOT_BASE_URL = useMemo(() => {
    const envAny = (import.meta as any)?.env || {};
    const fromEnv = envAny.VITE_MABOT_BASE_URL;
    const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem("mabot_base_url") : null;
    return (fromStorage || fromEnv || "").toString();
  }, []);

  const MABOT_USERNAME = useMemo(() => {
    const envAny = (import.meta as any)?.env || {};
    const fromEnv = envAny.VITE_MABOT_USERNAME;
    const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem("mabot_username") : null;
    return (fromStorage || fromEnv || "").toString();
  }, []);

  const MABOT_PASSWORD = useMemo(() => {
    const envAny = (import.meta as any)?.env || {};
    const fromEnv = envAny.VITE_MABOT_PASSWORD;
    const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem("mabot_password") : null;
    return (fromStorage || fromEnv || "").toString();
  }, []);

  const [mabotAccessToken, setMabotAccessToken] = useState<string>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("mabot_access_token") || "" : ""
  );
  const [mabotRefreshToken, setMabotRefreshToken] = useState<string>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("mabot_refresh_token") || "" : ""
  );

  const mabotConfigured = Boolean(MABOT_BASE_URL);

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
      if (!mabotConfigured || !MABOT_USERNAME || !MABOT_PASSWORD) return false;
      const body = new URLSearchParams();
      body.set("username", MABOT_USERNAME);
      body.set("password", MABOT_PASSWORD);
      body.set("grant_type", "password");
      const res = await fetch(`${MABOT_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const access = data?.access_token as string | undefined;
      const refresh = data?.refresh_token as string | undefined;
      if (!access || !refresh) return false;
      setMabotAccessToken(access);
      setMabotRefreshToken(refresh);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mabot_access_token", access);
        window.localStorage.setItem("mabot_refresh_token", refresh);
      }
      return true;
    } catch (error) {
      console.error("[Mabot Login]", error);
      return false;
    }
  };

  const refreshMabotTokens = async (): Promise<boolean> => {
    try {
      if (!mabotConfigured || !mabotRefreshToken) return false;
      const res = await fetch(`${MABOT_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: mabotRefreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const access = data?.access_token as string | undefined;
      const refresh = data?.refresh_token as string | undefined;
      if (!access || !refresh) return false;
      setMabotAccessToken(access);
      setMabotRefreshToken(refresh);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mabot_access_token", access);
        window.localStorage.setItem("mabot_refresh_token", refresh);
      }
      return true;
    } catch {
      return false;
    }
  };

  const ensureMabotAuth = async (): Promise<boolean> => {
    if (!mabotConfigured) return false;
    if (mabotAccessToken) return true;
    if (await loginToMabot()) return true;
    return false;
  };

  const buildDeveloperInstruction = (session: ChatSession) => {
    const name = user?.user_metadata?.full_name || user?.email || "the student";
    if (session.contextType === "agenda") {
      return (
        `ROLE: You are the student's academic agenda assistant.\n` +
        `Student: ${name}.\n` +
        `Use ONLY the provided calendar, schedules, and goals data. If missing, ask for details or suggest adding them in Plan.\n` +
        `Answer concisely and in the user's language.\n` +
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
      `Use ONLY the provided materials and notes. If insufficient, ask for more uploads (via Library).\n` +
      `Answer in the user's language and keep it clear.\n` +
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
            
            // Add file to context files for attachment
            if (m.type === "pdf" || m.mime_type === "application/pdf") {
              files.push({
                url: urlData.signedUrl,
                fileName: m.title,
                mimeType: m.mime_type || "application/pdf",
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

    const messages: any[] = [
      {
        role: "user",
        contents: [{ type: "text", value: buildDeveloperInstruction(session), parse_mode: "Markdown" }],
      },
    ];

    if (contextText && contextText.trim().length > 0) {
      messages.push({ role: "user", contents: [{ type: "text", value: contextText }] });
    }

    // Add context files if available
    if (contextFiles && contextFiles.length > 0) {
      console.log(`[Mabot] Attaching ${contextFiles.length} file(s) to context`);
      
      for (const file of contextFiles) {
        try {
          console.log(`[Mabot] Processing file: ${file.fileName} (${file.mimeType})`);
          
          const fileResponse = await fetch(file.url);
          if (!fileResponse.ok) {
            throw new Error(`HTTP ${fileResponse.status}: ${fileResponse.statusText}`);
          }
          
          const fileBlob = await fileResponse.blob();
          const fileBuffer = await fileBlob.arrayBuffer();
          
          // Check file size to avoid sending extremely large files
          const fileSizeMB = fileBuffer.byteLength / (1024 * 1024);
          if (fileSizeMB > 10) { // 10MB limit
            console.warn(`[Mabot] File ${file.fileName} too large (${fileSizeMB.toFixed(2)}MB), skipping`);
            continue;
          }
          
          messages.push({
            role: "user",
            contents: [
              {
                type: "file",
                file: {
                  data: Array.from(new Uint8Array(fileBuffer)),
                  mime_type: file.mimeType || "application/octet-stream",
                  file_name: file.fileName || "document.pdf"
                }
              }
            ]
          });
          
          console.log(`[Mabot] Successfully attached file: ${file.fileName}`);
        } catch (error) {
          console.error(`[Mabot] Failed to attach file: ${file.fileName}`, error);
          
          // Add a note about the failed file in the context
          messages.push({
            role: "user",
            contents: [{ 
              type: "text", 
              value: `⚠️ Note: Could not attach file "${file.fileName}" due to error: ${error}` 
            }]
          });
        }
      }
      
      console.log(`[Mabot] Total files attached: ${messages.filter(m => 
        m.contents?.some(c => c.type === "file")
      ).length}`);
    }

    messages.push({ role: "user", contents: [{ type: "text", value: userText }] });

    const payload = {
      platform: "web",
      chat_id: session.mabotChatId || null,
      platform_chat_id: platformChatId,
      bot_username: "cuaderbot",
      prefix_with_bot_name: false,
      messages,
    };

    const res = await fetch(`${MABOT_BASE_URL}/io/input`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mabotAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      const refreshed = await refreshMabotTokens();
      if (!refreshed) return { ok: false, error: "Unauthorized" } as const;
      const retry = await fetch(`${MABOT_BASE_URL}/io/input`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("mabot_access_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      if (!retry.ok) return { ok: false, error: `HTTP ${retry.status}` } as const;
      const data = await retry.json();
      return { ok: true, data } as const;
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Mabot Error]", errorText);
      return { ok: false, error: `HTTP ${res.status}` } as const;
    }

    const data = await res.json();
    return { ok: true, data } as const;
  };

  const extractAssistantText = (updateOut: any): string => {
    try {
      const msgs: any[] = updateOut?.messages || [];
      const assistantMsgs = msgs.filter((m) => m?.role === "assistant");
      if (!assistantMsgs.length) return "";
      const parts: string[] = [];
      for (const m of assistantMsgs) {
        const contents = m?.contents || [];
        for (const c of contents) {
          if (c?.type === "text" && typeof c?.value === "string") parts.push(c.value);
        }
      }
      return parts.join("\n\n");
    } catch {
      return "";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentChat) return;

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
    } else {
      const context = await prepareSubjectContextText(currentChat);
      contextText = context.text;
      contextFiles = context.files;
    }

    const result = await sendToMabot(currentChat, textToSend, contextText, contextFiles);
    if (result.ok) {
      const data = result.data as any;
      const mabotChatId = data?.chat_id as string | undefined;
      const plainText = extractAssistantText(data) || "...";

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        message: plainText,
        time: nowTime(),
      };

      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                mabotChatId: mabotChatId || chat.mabotChatId,
                contextUploaded: true, // Keep this for backward compatibility but it's no longer restrictive
                messages: [...chat.messages, botMessage],
                lastActivity: new Date(),
              }
            : chat
        )
      );
      setIsLoading(false);
      return;
    }

    const errorMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      message: `Error: failed to connect to the AI assistant. ${result.error}`,
      time: nowTime(),
    };

    setChatSessions((prev) =>
      prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage], lastActivity: new Date() } : chat))
    );
    setIsLoading(false);
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
          message: `Ready. I am your academic agenda. Ask me about events, schedules, or goals.\n\n📅 Your calendar events, schedules, and weekly goals will be automatically provided as context.`,
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
          message: `New chat for ${subject.name}${topic ? ` (topic: ${topic})` : ""}. What would you like to explore?\n\n📚 Your study materials and files will be automatically attached to provide context for the AI assistant.`,
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
      const refreshMessage = `🔄 Context refreshed with ${context.files.length} attached file(s) and latest materials.`;
      
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
        message: "❌ Error refreshing context. Please try again.",
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

  const showMabotBanner = !mabotConfigured || !MABOT_USERNAME || !MABOT_PASSWORD;

  return (
    <div className="flex flex-col h-screen pb-20">
      <div className="flex items-center justify-between pt-8 pb-4 px-6">
        <div className="w-10" />
        <div className="text-center">
          <h1 className="text-2xl font-light text-foreground/90 mb-1">Chat</h1>
          <p className="text-muted-foreground text-sm">Start a new conversation or continue an existing one</p>
        </div>
        <div className="flex items-center gap-2">
          {currentChat && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">Session</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer" onClick={() => deleteChat(currentChat.id)}>
                  <Trash2 size={14} className="mr-2 text-destructive" />
                  Delete chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setIsStartOpen(true)}>
                  <Plus size={14} className="mr-2" />
                  New chat
                </DropdownMenuItem>
                {currentChat.contextType === "subject" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer" 
                      onClick={() => handleRefreshContext(currentChat)}
                    >
                      <BookOpen size={14} className="mr-2" />
                      Refresh context
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
            Configure `VITE_MABOT_BASE_URL`, `VITE_MABOT_USERNAME`, and `VITE_MABOT_PASSWORD` or use localStorage (`mabot_base_url`, `mabot_username`, `mabot_password`).
          </p>
        </div>
      )}

      {!currentChat && (
        <div className="flex-1 flex items-center justify-center px-6">
          <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-40 h-40 rounded-3xl flex flex-col items-center justify-center text-foreground bg-muted hover:bg-muted/80 border border-border/30 shadow-sm"
                aria-label="Start a new chat"
              >
                <Plus size={40} className="mb-2" />
                New chat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Link conversation</DialogTitle>
                <DialogDescription>
                  Choose to talk with your agenda or a subject. You can optionally add a topic for focus.
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
                      <p className="text-sm text-muted-foreground">Academic calendar and schedules</p>
                    </div>
                  </div>
                  <Button onClick={startAgendaChat} className="rounded-xl">Chat with Agenda</Button>
                </div>
              </Card>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground/80">Subjects</p>
                <div className="rounded-xl border border-border/30">
                  <Command className="rounded-xl">
                    <CommandInput placeholder="Search subject..." />
                    <CommandList className="max-h-64 overflow-auto">
                      <CommandEmpty>No subjects found.</CommandEmpty>
                      <CommandGroup heading="Available">
                        {subjectsLoading ? (
                          <div className="p-3 text-sm text-muted-foreground">Loading...</div>
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
                      placeholder="Optional topic (e.g., Derivatives, Unit 3)"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      className="rounded-xl"
                      aria-label="Optional topic"
                    />
                    <div className="flex gap-2">
                      <Button className="rounded-xl" onClick={() => startSubjectChat(selectedSubject, topicInput)}>
                        Start with topic
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={() => startSubjectChat(selectedSubject)}>
                        Chat with subject
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
                        ? "Processing materials and files..." 
                        : "Thinking..."
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
                  ? "📎 Context loaded with materials and files" 
                  : "🔄 Context will be refreshed with latest materials and files"
                }
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder={
                currentChat.contextType === "agenda" ? "Ask your agenda..." : `Ask about ${currentChat.title}...`
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
              aria-label="Message"
            />
            <Button
              size="icon"
              className="rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}