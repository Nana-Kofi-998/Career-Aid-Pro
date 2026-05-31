import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Briefcase, Download, FileImage, Pencil, RefreshCw, Send, User, X, Heart, Globe, Paperclip, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { api, streamChat } from "../api/client";
import CareerCoachPanel from "../components/chat/CareerCoachPanel";
import EmptyChat from "../components/EmptyChat";
import KidEmptyChat from "../components/KidEmptyChat";
import LoadingDots from "../components/LoadingDots";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import type { ChatMessage } from "../types";
import { modeLabel } from "../utils/format";
import { useSearchParams } from "react-router-dom";

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, user } = useAuth();
  const {
    mode,
    setMode,
    chatId,
    history,
    setHistory,
    loadChats,
    bindChatId,
    docContext,
    setDocContext,
    docName,
    setDocName,
  } = useChat();
  const isKid = user?.age ? user.age < 13 : false;
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingTurn, setEditingTurn] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [fileBusy, setFileBusy] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Max file size is 10 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (base64) {
        setSelectedFile({
          base64,
          mimeType: file.type,
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setMenuOpen(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streaming]);

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (!prompt || input.trim() || history.length > 0) return;
    setInput(prompt);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
    const next = new URLSearchParams(searchParams);
    next.delete("prompt");
    setSearchParams(next, { replace: true });
  }, [history.length, input, searchParams, setSearchParams]);

  async function runStream(message: string, priorHistory: ChatMessage[], fileData: { base64: string; mimeType: string; name: string } | null = null) {
    setError("");
    setBusy(true);
    setStreaming("");

    try {
      await streamChat({
        message,
        mode,
        history: priorHistory,
        docContext: mode === "Career Coach" ? docContext : "",
        chatId,
        tone: settings.tone,
        webSearchEnabled: settings.webSearchEnabled,
        demoMode: settings.demoMode,
        responseLength: settings.responseLength,
        includePersonality: settings.includePersonality,
        file: fileData,
        onToken: (t) => setStreaming((s) => s + t),
        onDone: (payload) => {
          setHistory(payload.history);
          setStreaming("");
          setEditingTurn(null);
          loadChats();
          if (payload.chat_id) bindChatId(payload.chat_id);
        },
        onError: (err) => setError(err.message),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      setStreaming("");
    } finally {
      setBusy(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !selectedFile) return;
    if (busy) return;
    setInput("");
    const fileToSend = selectedFile;
    setSelectedFile(null);
    await runStream(text, history, fileToSend);
  }

  function startEdit(index: number) {
    const msg = history[index];
    if (msg.role !== "user" || busy) return;
    setHistory(history.slice(0, index));
    setInput(msg.content);
    setEditingTurn(index);
    setError("");
    textareaRef.current?.focus();
  }

  function cancelEdit() {
    setEditingTurn(null);
    setInput("");
  }

  function getFileSourceText(type: "word" | "pdf" | "image", text: string) {
    const cleanText = text.trim();
    if (type !== "image") return cleanText;

    const imageSection = cleanText.match(/\*\*Image:\*\*([\s\S]*?)(?=\n\s*\*\*|$)/i);
    const titleSection = cleanText.match(/\*\*Title:\*\*\s*(.+)/i)?.[0] || "";
    const subtitleSection = cleanText.match(/\*\*Subtitle:\*\*\s*(.+)/i)?.[0] || "";
    const milestones = cleanText.match(/\n\s*\d+\.\s*\*\*[\s\S]+/);

    return [titleSection, subtitleSection, imageSection?.[0] || "", milestones?.[0] || ""]
      .filter(Boolean)
      .join("\n\n")
      .trim() || cleanText;
  }

  async function generateFile(
    type: "word" | "pdf" | "image",
    text: string,
    key: string
  ) {
    const cleanText = getFileSourceText(type, text);
    if (!cleanText) return;
    setError("");
    setFileBusy(key);
    try {
      await api.generateChatFile({
        type,
        text: cleanText,
        prompt: cleanText,
        title:
          type === "image"
            ? "Career Aid Generated Image"
            : "Career Aid Chat Response",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate file");
    } finally {
      setFileBusy(null);
    }
  }

  async function regenerateResponse(index: number) {
    const msg = history[index];
    if (msg.role !== "ai" || busy) return;
    const throughUser = history.slice(0, index);
    const userMsg = throughUser[throughUser.length - 1];
    if (!userMsg || userMsg.role !== "user") return;

    setHistory(throughUser);
    setEditingTurn(null);
    setInput("");
    await runStream(userMsg.content, throughUser.slice(0, -1));
  }

  return (
    <motion.div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Desktop Mode Selector Header */}
      <header
        className="shrink-0 border-b px-4 py-4 md:px-6 hidden md:block"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
      >
        <p className="label-caps mb-3 text-center md:text-left">Session mode</p>
        <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setMode("Career Coach")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              mode === "Career Coach"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow-sm"
                : "border border-slate-200 bg-white/5 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 dark:border-slate-600"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Career Coach
          </button>
          <button
            type="button"
            onClick={() => setMode("Mental Health")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              mode === "Mental Health"
                ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-glow-sm"
                : "border border-slate-200 bg-white/5 text-slate-300 hover:bg-pink-500/20 hover:text-pink-300 dark:border-slate-600"
            }`}
          >
            <Heart className="h-4 w-4" />
            Mental Wellness
          </button>
          <button
            type="button"
            onClick={() => setMode("free")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              mode === "free"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-sm"
                : "border border-slate-200 bg-white/5 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 dark:border-slate-600"
            }`}
          >
            <Globe className="h-4 w-4" />
            Open Chat
          </button>
        </div>
      </header>

      {/* Mobile Collapsible Mode Selector Header */}
      <header
        className="shrink-0 border-b border-white/5 bg-[#0d0d12]/95 px-4 py-3 md:hidden z-20"
      >
        <button
          type="button"
          onClick={() => setSessionMenuOpen(!sessionMenuOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Session:</span>
            {mode === "Career Coach" && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Briefcase className="h-4 w-4" /> Career Coach
              </span>
            )}
            {mode === "Mental Health" && (
              <span className="flex items-center gap-1.5 text-pink-400">
                <Heart className="h-4 w-4" /> Mental Wellness
              </span>
            )}
            {mode === "free" && (
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Globe className="h-4 w-4" /> Open Chat
              </span>
            )}
          </div>
          {sessionMenuOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {sessionMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-3 flex flex-col gap-2 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  setMode("Career Coach");
                  setSessionMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  mode === "Career Coach"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow-sm"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Career Coach
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("Mental Health");
                  setSessionMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  mode === "Mental Health"
                    ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-glow-sm"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-pink-500/20 hover:text-pink-300"
                }`}
              >
                <Heart className="h-4 w-4" />
                Mental Wellness
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("free");
                  setSessionMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  mode === "free"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-sm"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300"
                }`}
              >
                <Globe className="h-4 w-4" />
                Open Chat
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {mode === "Career Coach" && (
        <CareerCoachPanel
          docName={docName}
          hasDoc={!!docContext}
          onClearDoc={() => {
            setDocContext("");
            setDocName("");
          }}
        />
      )}

      {mode === "Mental Health" && (
        <div className="border-b border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <div className="mx-auto max-w-3xl">
            This space can offer supportive reflection, but it is not emergency or clinical care. If you may harm yourself or someone else, contact local emergency services or a trusted person immediately.
          </div>
        </div>
      )}

      <div className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          {history.length === 0 && !streaming && !busy && (
            isKid ? <KidEmptyChat mode={mode} /> : <EmptyChat mode={mode} />
          )}

          <AnimatePresence initial={false}>
            {history.map((msg, i) => (
              <motion.div
                key={`msg-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group chat-message mb-5 flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-glow-sm"
                      : "border text-slate-600 dark:text-slate-300"
                  }`}
                  style={
                    msg.role === "ai"
                      ? { borderColor: "var(--border-subtle)", background: "var(--bg-card)" }
                      : undefined
                  }
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className={`flex max-w-[85%] flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={
                      msg.role === "user"
                        ? "chat-bubble chat-bubble-user"
                        : "chat-bubble chat-bubble-assistant"
                    }
                  >
                    {settings.showTimestamps && msg.ts && (
                      <p className="mb-1 text-[10px] opacity-70">{msg.ts}</p>
                    )}
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
              {msg.file && msg.file.mimeType.startsWith("image/") && msg.file.base64 && (
                <div className="mt-2">
                  <img
                          src={`data:${msg.file.mimeType};base64,${msg.file.base64}`}
                          alt="Uploaded"
                          className="max-w-xs rounded border"
                        />
                  </div>
                )}
                    {msg.file && (!msg.file.mimeType.startsWith("image/") || !msg.file.base64) && (
                      <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{msg.file.name || "Attached document"}</span>
                        {msg.file.hasExtractedText && <span className="shrink-0 opacity-70">read</span>}
                      </div>
                    )}
                  </div>
                  <div className="msg-actions flex flex-wrap gap-1 px-1">
                    {msg.role === "user" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startEdit(i)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                        title="Edit and resend"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => regenerateResponse(i)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Regenerate response"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Regenerate
                        </button>
                        <button
                          type="button"
                          disabled={!!fileBusy}
                          onClick={() => generateFile("word", msg.content, `word-${i}`)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-300"
                          title="Download as Word"
                        >
                          <FileText className="h-3 w-3" />
                          {fileBusy === `word-${i}` ? "Making..." : "Word"}
                        </button>
                        <button
                          type="button"
                          disabled={!!fileBusy}
                          onClick={() => generateFile("pdf", msg.content, `pdf-${i}`)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
                          title="Download as PDF"
                        >
                          <Download className="h-3 w-3" />
                          {fileBusy === `pdf-${i}` ? "Making..." : "PDF"}
                        </button>
                        <button
                          type="button"
                          disabled={!!fileBusy}
                          onClick={() => generateFile("image", msg.content, `image-${i}`)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300"
                          title="Generate image from this response"
                        >
                          <FileImage className="h-3 w-3" />
                          {fileBusy === `image-${i}` ? "Making..." : "Image"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {streaming && (
            <div className="mb-5 flex gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-card)" }}
              >
                <Bot className="h-4 w-4" />
              </div>
              <div className="chat-bubble chat-bubble-assistant max-w-[85%]">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{streaming}</p>
                <span className="mt-1 inline-block h-4 w-0.5 animate-pulse bg-emerald-500" />
              </div>
            </div>
          )}
          {busy && !streaming && (
            <div className="mb-5 pl-12">
              <LoadingDots />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <p className="shrink-0 bg-red-500/10 px-4 py-2 text-center text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

<form
          className="shrink-0 border-t p-4 md:p-6"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
          onSubmit={(e) => { e.preventDefault(); onSend(e); }}
        >
          {editingTurn !== null && (
            <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
              <span>Editing message — send to replace this turn and everything after it</span>
              <button type="button" onClick={cancelEdit} className="rounded-lg p-1 hover:bg-emerald-500/20">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  editingTurn !== null
                    ? "Edit your message…"
                    : `Message ${modeLabel(mode)}…`
                }
                className={`chat-input-field max-h-40 min-h-[44px] w-full py-2.5 text-sm ${selectedFile ? "pl-10" : ""}`}
                onKeyDown={(e) => {
                  if (settings.enterToSend && e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend(e);
                  }
                }}
              />
              {selectedFile && (
                <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center text-sm font-medium text-slate-600 bg-white/90 rounded-full shadow">
                  <Paperclip className="h-4 w-4" />
                </div>
              )}
            </div>
<div className="flex shrink-0 items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleMenu}
                  className="rounded-lg hover:bg-slate-100/50 transition-colors p-2"
                >
                  <Paperclip className="h-5 w-5 text-slate-500 hover:text-slate-700" />
                </button>
{menuOpen && (
                    <div className="upload-menu absolute right-0 z-20 mt-2 w-44 rounded-md border border-slate-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100"
                      >
                        Attach
                      </button>
                      <button
                        type="button"
                        disabled={!input.trim() || !!fileBusy}
                        onClick={() => {
                          setMenuOpen(false);
                          generateFile("image", input, "composer-image");
                        }}
                        className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Create image
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={busy || (!input.trim() && !selectedFile)}
                className="btn-accent !rounded-xl !p-2.5 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-slate-500">
            Hosted AI · Secure access · Not medical advice · Hover messages to edit or regenerate
            {!settings.enterToSend && " · Shift+Enter to send"}
          </p>
        </form>
    </motion.div>
  );
}
