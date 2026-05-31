import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Compass,
  Mic,
  Sparkles,
  Settings,
  Info,
  HelpCircle,
  LogOut,
  Brain,
  Star,
  GraduationCap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isKid?: boolean;
}

export default function MobileMenuDrawer({ isOpen, onClose, isKid = false }: MobileMenuDrawerProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adultLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/chat", label: "AI Chat", icon: MessageSquare },
    { to: "/cv-tools/cv-builder", label: "CV Tools", icon: FileText },
    { to: "/career-path", label: "Career Path", icon: Compass },
    { to: "/interview-prep", label: "Interview Prep", icon: Mic },
    { to: "/personality", label: "Know Your Personality", icon: Sparkles },
    { to: "/guidance", label: "Guidance Hub", icon: GraduationCap },
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/about", label: "About", icon: Info },
    { to: "/faq", label: "FAQ", icon: HelpCircle },
  ];

  const kidLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/chat", label: "AI Chat", icon: MessageSquare },
    { to: "/personality", label: "Know Your Personality", icon: Sparkles },
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/about", label: "About", icon: Info },
    { to: "/faq", label: "FAQ", icon: HelpCircle },
  ];

  const links = isKid ? kidLinks : adultLinks;
  
  const displayName = isKid
    ? [user?.first_name].filter(Boolean).join(" ") || user?.username || "Explorer"
    : [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "User";

  const handleLogout = () => {
    onClose();
    logout();
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Drawer Content Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={`fixed bottom-0 right-0 top-0 z-50 flex h-full w-[280px] flex-col border-l shadow-2xl backdrop-blur-xl md:hidden ${
              isKid 
                ? "border-sky-500/10 text-sky-900" 
                : "border-white/10 bg-[#0c0c12]/95 text-white"
            }`}
            style={isKid ? {
              background: "linear-gradient(180deg, var(--kid-bg-card) 0%, var(--kid-bg-secondary) 100%)",
              borderColor: "var(--kid-border)"
            } : {}}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" 
              style={isKid ? { borderColor: "var(--kid-border)" } : { borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${
                  isKid ? "from-sky-500 to-blue-600" : "from-emerald-500 to-teal-600"
                }`}>
                  {isKid ? <Star className="h-4 w-4 text-white" /> : <Brain className="h-4 w-4 text-white" />}
                </div>
                <span className={`text-sm font-bold ${isKid ? "text-sky-950 font-extrabold" : "text-white"}`}>
                  {isKid ? "Menu Explorer" : "Workspace Menu"}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${
                  isKid ? "text-sky-800 hover:bg-sky-500/10" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Links Area */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? isKid
                          ? "bg-sky-500/20 text-sky-800"
                          : "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400"
                        : isKid
                          ? "text-sky-800 hover:bg-sky-500/10"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* User Profile Card & Logout Footer */}
            <div className="p-4 border-t shrink-0" 
              style={isKid ? { borderColor: "var(--kid-border)" } : { borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className={`flex items-center gap-3 rounded-xl p-3 ${
                isKid ? "bg-sky-500/10" : "bg-white/5"
              }`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white bg-gradient-to-br ${
                  isKid ? "from-sky-500 to-blue-600" : "from-violet-500 to-purple-600"
                }`}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`truncate text-sm font-semibold ${isKid ? "text-sky-950 font-bold" : "text-white"}`}>
                    {displayName}
                  </p>
                  <p className={`truncate text-xs ${isKid ? "text-sky-700/60" : "text-slate-500"}`}>
                    {isKid ? "Explorer Account" : "Hosted workspace"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isKid 
                      ? "bg-red-100 text-red-700 hover:bg-red-200" 
                      : "text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                  }`}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
