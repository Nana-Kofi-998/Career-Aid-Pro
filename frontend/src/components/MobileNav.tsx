import {
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const mainTabs = [
   { to: "/dashboard", label: "Home", icon: LayoutDashboard },
   { to: "/guidance", label: "Guidance", icon: GraduationCap },
   { to: "/chat", label: "Chat", icon: MessageSquare },
   { to: "/cv-tools/cv-builder", label: "CV Tools", icon: FileText },
   { to: "/personality", label: "Personality", icon: Sparkles },
 ];

const kidTabs = [
   { to: "/dashboard", label: "Home", icon: LayoutDashboard },
   { to: "/chat", label: "Chat", icon: MessageSquare },
   { to: "/personality", label: "Personality", icon: Sparkles },
   { to: "/settings", label: "More", icon: Settings },
 ];

interface MobileNavProps {
   isKid?: boolean;
 }

export default function MobileNav({ isKid = false }: MobileNavProps) {
  const tabs = isKid ? kidTabs : mainTabs;
  const isActiveStyle = isKid 
    ? "text-sky-700 dark:text-sky-300" 
    : "text-emerald-600 dark:text-accent";
  const inactiveStyle = isKid 
    ? "text-slate-500 dark:text-slate-400" 
    : "text-slate-500 dark:text-slate-400";
  const activeIndicator = isKid 
    ? "bg-gradient-to-r from-sky-500 to-blue-600" 
    : "bg-gradient-to-r from-emerald-500 to-teal-400";
  
   return (
     <nav
       className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-glass md:hidden"
       style={isKid ? { 
         borderColor: "var(--kid-border)", 
         background: "var(--kid-bg-card)" 
       } : { borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
       aria-label="Main navigation"
     >
       <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
         {tabs.map(({ to, label, icon: Icon }) => (
           <NavLink
             key={to}
             to={to}
             className={({ isActive }) =>
               `relative flex min-h-[52px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition ${
                 isActive
                   ? isActiveStyle
                   : inactiveStyle
               }`}
           >
             {({ isActive }) => (
               <>
                 {isActive && (
                   <span className={`absolute top-0 h-0.5 w-8 rounded-full ${activeIndicator}`} />
                 )}
                 <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} />
                 <span className="truncate">{label}</span>
               </>
             )}
           </NavLink>
         ))}
       </div>
     </nav>
   );
 }

export function PublicFooter() {
  return (
    <footer
      className="safe-bottom mt-8 flex flex-wrap items-center justify-center gap-4 border-t pt-6 text-sm"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <NavLink
        to="/about"
        className="inline-flex items-center gap-1.5 text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-accent"
      >
        <Info className="h-4 w-4" />
        About
      </NavLink>
      <NavLink
        to="/faq"
        className="inline-flex items-center gap-1.5 text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-accent"
      >
        <HelpCircle className="h-4 w-4" />
        FAQ
      </NavLink>
    </footer>
  );
}
