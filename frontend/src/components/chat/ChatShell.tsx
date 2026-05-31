import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { ChatProvider, useChat } from "../../context/ChatContext";
import useChatTitle from "../../hooks/useChatTitle";
import ChatSidebar from "./ChatSidebar";

function ChatShellInner() {
  const { setSidebarOpen } = useChat();
  useChatTitle();

  return (
<div className="chat-shell flex h-[100dvh] w-full overflow-hidden">
       <ChatSidebar />
      {/* Vertical separator line */}
      <div className="hidden w-px bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent lg:block"></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="flex items-center gap-2 border-b px-3 py-2.5 lg:hidden"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-slate-600 transition hover:bg-emerald-500/10 dark:text-slate-300"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">Conversations</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default function ChatShell({ isKid }: { isKid?: boolean }) {
   return (
     <ChatProvider isKid={isKid}>
       <ChatShellInner />
     </ChatProvider>
   );
 }
