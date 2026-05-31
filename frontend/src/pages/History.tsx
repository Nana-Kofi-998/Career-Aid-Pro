import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Filter,
  Heart,
  MessageCircle,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import ModeBadge from "../components/ModeBadge";
import type { ChatMode, ChatSummary } from "../types";
import { formatRelativeTime, modeLabel } from "../utils/format";

const groups: { mode: ChatMode | "all"; icon: typeof Briefcase; color: string }[] = [
  { mode: "all", icon: MessageCircle, color: "from-slate-500 to-slate-600" },
  { mode: "Career Coach", icon: Briefcase, color: "from-blue-500 to-indigo-600" },
  { mode: "Mental Health", icon: Heart, color: "from-rose-400 to-pink-600" },
  { mode: "free", icon: MessageCircle, color: "from-violet-500 to-purple-600" },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ChatMode | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listChats()
      .then(setChats)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats.filter((c) => {
      if (filter !== "all" && c.mode !== filter) return false;
      if (!q) return true;
      return `${c.title} ${c.preview} ${c.mode}`.toLowerCase().includes(q);
    });
  }, [chats, search, filter]);

  const stats = useMemo(() => {
    const byMode: Record<string, number> = {};
    for (const c of chats) byMode[c.mode] = (byMode[c.mode] || 0) + 1;
    return byMode;
  }, [chats]);

  async function deleteOne(id: number) {
    if (!confirm("Delete this conversation permanently?")) return;
    await api.deleteChat(id);
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel overflow-hidden p-6 md:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Chat history</h1>
            <p className="mt-1 text-slate-400">
              All saved conversations across Career, Wellness, and Open Chat modes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25"
          >
            New chat
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {groups.map(({ mode, icon: Icon, color }) => {
            const count = mode === "all" ? chats.length : stats[mode] || 0;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`rounded-2xl border p-4 text-left transition ${
                  filter === mode
                    ? "border-emerald-500/35 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/25"
                    : "border-white/10 bg-white/5 hover:shadow-md"
                }`}
              >
                <div
                  className={`mb-2 inline-flex rounded-lg bg-gradient-to-br ${color} p-2 text-white`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs font-medium text-slate-400">
                  {mode === "all" ? "Total" : modeLabel(mode)}
                </p>
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="glass-panel p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or message…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none ring-emerald-500/30 focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="h-4 w-4" />
            Showing {filtered.length} of {chats.length}
          </div>
        </div>

        {loading && (
          <p className="py-12 text-center text-sm text-slate-400">Loading conversations…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-slate-500" />
            <p className="mt-4 font-medium text-white">No conversations found</p>
            <p className="mt-1 text-sm text-slate-400">
              Start chatting from the dashboard or open the Chat page.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
                className="group flex items-stretch gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm transition hover:border-emerald-500/25 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/chat?id=${c.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">
                      {c.title || "Untitled chat"}
                    </p>
                    <ModeBadge mode={c.mode} small />
                  </div>
                  {c.preview && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{c.preview}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {c.message_count} messages · {formatRelativeTime(c.updated_at)}
                  </p>
                </button>
                <div className="flex flex-col justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/chat?id=${c.id}`)}
                    className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 opacity-0 transition group-hover:opacity-100"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteOne(c.id)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    title="Delete"
                  >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
