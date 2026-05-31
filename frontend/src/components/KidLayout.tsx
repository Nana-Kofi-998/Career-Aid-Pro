import { motion } from "framer-motion";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MobileNav from "./MobileNav";

const kidLinks = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, color: "bg-sky-500" },
  { to: "/chat", label: "Chat", icon: MessageSquare, color: "bg-blue-600" },
  { to: "/personality", label: "Personality", icon: Sparkles, color: "bg-cyan-600" },
  { to: "/settings", label: "Settings", icon: Settings, color: "bg-amber-500" },
];

const infoLinks = [
  { to: "/about", label: "About", icon: Info },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat": "Chat",
  "/personality": "Know Your Personality",
  "/settings": "Settings",
  "/about": "About",
  "/faq": "FAQ",
};

export default function KidLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname] ?? "Career-Aid Pro";

  const displayName =
    [user?.first_name].filter(Boolean).join(" ") || user?.username || "Explorer";

  return (
    <div 
      className="flex min-h-screen min-h-[100dvh]"
      style={{ 
        background: "linear-gradient(135deg, var(--kid-bg-primary) 0%, var(--kid-bg-secondary) 54%, var(--kid-bg-tertiary) 100%)",
        fontFamily: "'Nunito', 'Inter', sans-serif"
      }}
    >
      {/* Kid Sidebar */}
      <aside 
        className="hidden w-72 shrink-0 flex-col overflow-hidden border-r md:flex"
        style={{ 
          background: "var(--kid-gradient-card)",
          borderColor: "var(--kid-border)"
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex shrink-0 items-center gap-3 px-6 py-8"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-lg">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-extrabold" style={{ color: "var(--kid-text-primary)" }}>Junior Explorer</p>
            <p className="text-xs font-medium" style={{ color: "var(--kid-text-secondary)" }}>Learning Adventures</p>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 py-4">
          {kidLinks.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `kid-nav-item ${isActive ? "active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} shadow-md`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-white"}`} />
                  </div>
                  <span className="font-semibold">{label}</span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white shadow-md" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Info Links */}
        <div className="shrink-0 px-4 py-4">
          <div className="mb-3 px-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--kid-text-secondary)" }}>
            Information
          </div>
          {infoLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `kid-nav-item text-sm ${isActive ? "active" : ""}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* User Card - Kid Style */}
        <div className="shrink-0 border-t p-4" style={{ borderColor: "var(--kid-border)" }}>
          <div className="flex items-center gap-3 rounded-2xl p-4 shadow-md" style={{ background: "var(--kid-bg-card)" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-lg font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold" style={{ color: "var(--kid-text-primary)" }}>{displayName}</p>
              <p className="truncate text-xs" style={{ color: "var(--kid-text-secondary)" }}>Young Explorer</p>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-300 text-red-700 transition hover:bg-red-400"
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
        <header className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md md:hidden"
          style={{ borderColor: "var(--kid-border)", background: "var(--kid-bg-card)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700">
              <Star className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold" style={{ color: "var(--kid-text-primary)" }}>{pageTitle}</span>
          </div>
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-xs font-bold text-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-700 transition hover:bg-red-200"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-20 hidden border-b px-8 py-5 backdrop-blur-md md:flex"
          style={{ borderColor: "var(--kid-border)", background: "var(--kid-bg-card)" }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--kid-text-secondary)" }}>
              Learning Zone
            </p>
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--kid-text-primary)" }}>{pageTitle}</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <MobileNav isKid />
    </div>
  );
}
