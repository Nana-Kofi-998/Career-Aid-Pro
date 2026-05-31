import { Briefcase, Heart, Globe } from "lucide-react";
import { modeLabel } from "../utils/format";

const styles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  "Career Coach": {
    bg: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    icon: <Briefcase className="h-3 w-3 mr-1" />,
  },
  "Mental Health": {
    bg: "bg-gradient-to-r from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/40",
    text: "text-pink-300",
    icon: <Heart className="h-3 w-3 mr-1" />,
  },
  free: {
    bg: "bg-gradient-to-r from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/40",
    text: "text-indigo-300",
    icon: <Globe className="h-3 w-3 mr-1" />,
  },
};

export default function ModeBadge({ mode, small }: { mode: string; small?: boolean }) {
  const style = styles[mode] || {
    bg: "bg-slate-500/20",
    border: "border-slate-300/50",
    text: "text-slate-300",
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${style.bg} ${style.border} ${style.text} ${
        small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      {style.icon}
      {modeLabel(mode)}
    </span>
  );
}