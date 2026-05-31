import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Info,
  LayoutDashboard,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeft,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "../../api/client";
import { useChat } from "../../context/ChatContext";
import type { ChatSummary } from "../../types";
import { groupChatsByDate } from "../../utils/chatGroups";
import { modeLabel } from "../../utils/format";

export default function ChatSidebar() {
   const {
     chats,
     chatId,
     loadChats,
     selectChat,
     startNewChat,
     sidebarOpen,
     setSidebarOpen,
   } = useChat();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      `${c.title || ""} ${c.preview || ""}`.toLowerCase().includes(q)
    );
  }, [chats, search]);

  const groups = useMemo(() => groupChatsByDate(filtered), [filtered]);

  async function deleteChat(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    setDeletingId(id);
    try {
      await api.deleteChat(id);
      if (chatId === id) startNewChat();
      loadChats();
    } finally {
      setDeletingId(null);
    }
  }

  if (!sidebarOpen) {
    return (
      <div className="hidden w-12 flex-col items-center border-r py-3 lg:flex"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          title="Show sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => startNewChat()}
          className="mt-2 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          title="New chat"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>
      </div>
    );
  }

return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] shrink-0 flex-col shadow-xl lg:relative lg:z-auto lg:w-[280px] border-r-2 border-emerald-500/20"
        style={{ background: "var(--bg-elevated)" }}
      >
        {/* Visual separator line */}
        <div className="absolute -right-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/40 via-teal-500/40 to-emerald-500/40 opacity-60 hidden lg:block"></div>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-slate-700/80 p-3">
          <button
            type="button"
            onClick={() => startNewChat()}
            className="btn-accent flex-1 !rounded-xl !py-2.5 text-sm"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            title="Hide sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="input-field !rounded-xl !py-2 !pl-8 !text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ maxHeight: "calc(100vh - 180px)" }}>
          {groups.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-slate-500">
              No conversations yet
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              {group.chats.map((c) => (
                <ChatRow
                  key={c.id}
                  chat={c}
                  active={c.id === chatId}
                  deleting={deletingId === c.id}
                  onSelect={() => selectChat(c)}
                  onDelete={(e) => deleteChat(e, c.id)}
                />
              ))}
            </div>
          ))}
        </div>

<div className="space-y-0.5 border-t border-slate-700/80 p-2">
           <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
           <SidebarLink to="/personality" icon={Sparkles} label="Know Your Personality" />
           <SidebarLink to="/settings" icon={Settings} label="Settings" />
           <SidebarLink to="/about" icon={Info} label="About" />
           <SidebarLink to="/faq" icon={HelpCircle} label="FAQ" />
         </div>
      </div>
    </aside>
    </>
  );
}

function ChatRow({
  chat,
  active,
  deleting,
  onSelect,
  onDelete,
}: {
  chat: ChatSummary;
  active: boolean;
  deleting: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const displayTitle = chat.title || modeLabel(chat.mode);
  const truncatedTitle = displayTitle.length > 28 ? displayTitle.slice(0, 25) + "…" : displayTitle;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`group mb-0.5 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm transition ${
        active ? "nav-link-active" : "hover:bg-emerald-500/10"
      } ${deleting ? "opacity-50" : ""}`}
    >
      <span className="line-clamp-1 flex-1 font-normal" title={displayTitle}>
        {truncatedTitle}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded p-1 text-slate-500 opacity-0 hover:bg-slate-600 hover:text-red-300 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Settings;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
