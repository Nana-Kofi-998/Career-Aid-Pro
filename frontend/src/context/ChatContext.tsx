import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { api, loadSettings } from "../api/client";
import type { AppSettings, ChatMessage, ChatMode, ChatSummary } from "../types";
import { mergeAppSettings } from "../utils/appSettings";

interface ChatContextValue {
  mode: ChatMode;
  setMode: (m: ChatMode) => void;
  chatId: number | null;
  history: ChatMessage[];
  setHistory: (h: ChatMessage[]) => void;
  chats: ChatSummary[];
  loadChats: () => void;
  selectChat: (c: ChatSummary) => void;
  startNewChat: (m?: ChatMode) => void;
  docContext: string;
  setDocContext: (t: string) => void;
  docName: string;
  setDocName: (n: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  bindChatId: (id: number) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const initialSettings = mergeAppSettings(loadSettings() as Partial<AppSettings> | null);

export function ChatProvider({ children, isKid }: { children: ReactNode; isKid?: boolean }) {
   const [params, setParams] = useSearchParams();
   const [mode, setModeState] = useState<ChatMode>(
     (params.get("mode") as ChatMode) || (isKid ? "free" : initialSettings.defaultMode)
   );
  const [chatId, setChatId] = useState<number | null>(
    params.get("id") ? Number(params.get("id")) : null
  );
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [docContext, setDocContext] = useState("");
  const [docName, setDocName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(!initialSettings.sidebarCollapsed);

  const loadChats = useCallback(() => {
    api.listChats().then(setChats).catch(console.error);
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    const id = params.get("id") || params.get("chat");
    const m = params.get("mode") as ChatMode | null;
    if (m) setModeState(m);
    if (id) {
      const n = Number(id);
      if (!Number.isNaN(n)) {
        setChatId(n);
        api.getChat(n).then((c) => {
          setHistory(c.history || []);
          setModeState(c.mode as ChatMode);
        });
      }
    }
  }, [params]);

  function syncUrl(id: number | null, m: ChatMode) {
    const next = new URLSearchParams();
    if (id) next.set("id", String(id));
    else next.set("mode", m);
    setParams(next, { replace: true });
  }

  const setMode = useCallback(
    (m: ChatMode) => {
      setModeState(m);
      if (m !== "Career Coach") {
        setDocContext("");
        setDocName("");
      }
    },
    []
  );

  const selectChat = useCallback((c: ChatSummary) => {
    setChatId(c.id);
    setModeState(c.mode as ChatMode);
    setDocContext("");
    setDocName("");
    syncUrl(c.id, c.mode as ChatMode);
    api.getChat(c.id).then((data) => setHistory(data.history || []));
    setSidebarOpen(false);
  }, [setParams]);

  const startNewChat = useCallback(
    (m?: ChatMode) => {
      const savedDefault = mergeAppSettings(loadSettings() as Partial<AppSettings> | null)
        .defaultMode;
      const nextMode = m || savedDefault;
      setChatId(null);
      setModeState(nextMode);
      setHistory([]);
      setDocContext("");
      setDocName("");
      syncUrl(null, nextMode);
    },
    [setParams]
  );

  const bindChatId = useCallback(
    (id: number) => {
      setChatId(id);
      syncUrl(id, mode);
    },
    [mode, setParams]
  );

  const value = useMemo(
    () => ({
      mode,
      setMode,
      chatId,
      history,
      setHistory,
      chats,
      loadChats,
      selectChat,
      startNewChat,
      docContext,
      setDocContext,
      docName,
      setDocName,
      sidebarOpen,
      setSidebarOpen,
      bindChatId,
    }),
    [
      mode,
      setMode,
      chatId,
      history,
      chats,
      loadChats,
      selectChat,
      startNewChat,
      docContext,
      docName,
      sidebarOpen,
      bindChatId,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
