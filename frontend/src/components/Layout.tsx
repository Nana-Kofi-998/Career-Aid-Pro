import { motion } from "framer-motion";
import {
  Brain,
  Compass,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Mic,
  Settings,
  Sparkles,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MobileNav from "./MobileNav";
import MobileMenuDrawer from "./MobileMenuDrawer";
import { useState } from "react";

const infoLinks = [
  { to: "/about", label: "About", icon: Info },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/guidance": "Guidance Hub",
  "/onboarding": "Guided Setup",
  "/career-path": "Career Path",
  "/interview-prep": "Interview Prep",
  "/cv-tools": "CV Tools",
  "/cv-tools/cv-builder": "CV Builder",
  "/cv-tools/cv-analyzer": "CV Analyzer",
  "/cv-builder": "CV Builder",

  "/personality": "Know Your Personality",
  "/settings": "Settings",
  "/about": "About",
  "/faq": "FAQ",
  "/kid-personality": "Know Your Personality",
};

export default function Layout({ isKid }: { isKid?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname] ?? "Career-Aid Pro";
  const [menuOpen, setMenuOpen] = useState(false);

  const links = isKid
    ? [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/guidance", label: "Guidance Hub", icon: GraduationCap },
        { to: "/chat", label: "Chat", icon: MessageSquare },
        { to: "/personality", label: "Know Your Personality", icon: Sparkles },
        { to: "/settings", label: "Settings", icon: Settings },
      ]
    : [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/chat", label: "Chat", icon: MessageSquare },
        { to: "/cv-tools/cv-builder", label: "CV Tools", icon: FileText },
        { to: "/career-path", label: "Career Path", icon: Compass },
        { to: "/interview-prep", label: "Interview Prep", icon: Mic },

        { to: "/personality", label: "Know Your Personality", icon: Sparkles },
        { to: "/settings", label: "Settings", icon: Settings },
      ];

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "User";

return (
    <div className="flex min-h-screen min-h-[100dvh] bg-[#0a0a0f]">
{/* Sidebar */}
       <aside className="hidden w-64 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-[#0d0d12] backdrop-blur-xl md:flex">
         {/* Logo */}
         <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="flex shrink-0 items-center gap-3 px-5 py-6"
         >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Career-Aid Pro</p>
            <p className="text-[10px] text-slate-500">AI Workspace</p>
          </div>
        </motion.div>

        {/* Navigation - Static, no scroll on non-chat pages */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive ? "bg-emerald-500/20" : "bg-white/5"
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  </div>
                  <span>{label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Info Links */}
        <div className="shrink-0 px-3 py-2">
          <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-wider text-slate-600">
            Information
          </div>
          {infoLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* User Card */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs text-slate-500">Hosted workspace</p>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0d0d12]/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">{pageTitle}</span>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-20 hidden border-b border-white/10 bg-[#0d0d12]/80 px-8 py-5 backdrop-blur-xl md:flex">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1">
              Workspace
            </p>
            <h1 className="text-xl font-bold text-white">{pageTitle}</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <MobileNav isKid={isKid} onMenuToggle={() => setMenuOpen(true)} />
      <MobileMenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} isKid={isKid} />
    </div>
  );
}
