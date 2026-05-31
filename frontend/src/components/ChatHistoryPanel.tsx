import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../api/client";
import ModeBadge from "./ModeBadge";
import type { ChatMode, ChatSummary } from "../types";
import { formatRelativeTime } from "../utils/format";

const modeFilters: { id: "all" | ChatMode; label: string; icon: typeof Briefcase }[] = [
  { id: "all", label: "All", icon: MessageCircle },
  { id: "Career Coach", label: "Career", icon: Briefcase },
  { id: "Mental Health", label: "Wellness", icon: Heart },
  { id: "free", label: "Open", icon: MessageCircle },
];

interface Props {
  chats: ChatSummary[];
  activeId: number | null;
  onSelect: (chat: ChatSummary) => void;
  onNewChat: (mode: ChatMode) => void;
  onRefresh: () => void;
  compact?: boolean;
}

export default function ChatHistoryPanel({
  chats,
  activeId,
  onSelect,
  onNewChat,
  onRefresh,
  compact,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ChatMode>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats.filter((c) => {
      if (filter !== "all" && c.mode !== filter) return false;
      if (!q) return true;
      const hay = `${c.title || ""} ${c.preview || ""} ${c.mode}`.toLowerCase();
      return hay.includes(q);
    });
  }, [chats, search, filter]);

  async function deleteChat(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    setDeletingId(id);
    try {
      await api.deleteChat(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside
      className={`flex w-full flex-col border-r border-slate-200/80 bg-white/50 backdrop-blur-xl ${
        compact ? "" : "w-80 shrink-0"
      }`}
    >
      <div className="border-b border-slate-200/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
            Chat history
          </h2>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {chats.length}
          </span>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {modeFilters.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
                filter === id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(["Career Coach", "Mental Health", "free"] as ChatMode[]).map((m) => (
            <motion.button
              key={m}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => onNewChat(m)}
              className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-emerald-500/25 bg-emerald-500/10/50 py-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              {m === "free" ? "Open" : m === "Mental Health" ? "Wellness" : "Career"}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="chat-scroll flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              {search || filter !== "all"
                ? "No conversations match your filters."
                : "No saved chats yet. Start one above!"}
            </p>
          )}
          {filtered.map((c) => {
            const active = c.id === activeId;
            return (
              <motion.button
                key={c.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                type="button"
                onClick={() => onSelect(c)}
                className={`group mb-1.5 flex w-full flex-col rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 shadow-md ring-1 ring-emerald-500/25"
                    : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white hover:shadow-sm dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {c.title || "Untitled chat"}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => deleteChat(e, c.id)}
                    disabled={deletingId === c.id}
                    className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {c.preview && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-300">{c.preview}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ModeBadge mode={c.mode} small />
                  <span className="text-[10px] text-slate-400">
                    {c.message_count} msgs · {formatRelativeTime(c.updated_at)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
