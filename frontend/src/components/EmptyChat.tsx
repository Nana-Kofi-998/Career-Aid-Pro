import { motion } from "framer-motion";
import { Globe, Brain, MessageSquarePlus, Sparkles, Search, Briefcase, Heart, Lightbulb, Shield } from "lucide-react";
import ModeBadge from "./ModeBadge";
import type { ChatMode } from "../types";

const PromptCard = ({ icon: Icon, text, color, onClick }: { icon: typeof Globe; text: string; color: string; onClick: () => void }) => (
  <motion.li
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`group cursor-pointer rounded-xl border bg-white/5 p-3.5 transition-all duration-200 hover:bg-white/10`}
    style={{ borderColor: `${color}40` }}
  >
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors`}
        style={{ backgroundColor: `${color}20` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <span className="text-sm font-medium text-slate-200 group-hover:text-white">{text}</span>
    </div>
  </motion.li>
);

export default function EmptyChat({ mode }: { mode: ChatMode }) {
  const hints: Record<ChatMode, { icon: typeof Globe; text: string }[]> = {
    "Career Coach": [
      { icon: Briefcase, text: "Ask about future jobs that match your interests" },
      { icon: Search, text: "Learn about Ghanaian universities and courses" },
      { icon: MessageSquarePlus, text: "Get study tips for exams like WASSCE" },
    ],
    "Mental Health": [
      { icon: Heart, text: "Share how you're feeling - I'm here to listen" },
      { icon: Brain, text: "Learn simple ways to manage stress and relax" },
      { icon: Lightbulb, text: "Discover fun activities that boost your mood" },
    ],
    free: [
      { icon: Globe, text: "Ask me anything - from animals to space!" },
      { icon: Brain, text: "Try fun science or math questions" },
      { icon: Shield, text: "Chat about hobbies, games, or favorite books" },
    ],
  };

  const modeColors = {
    "Career Coach": "#00d4aa",
    "Mental Health": "#ec4899",
    free: "#8b5cf6",
  };

  const modeGradients = {
    "Career Coach": "from-emerald-500/20 to-teal-500/20",
    "Mental Health": "from-pink-500/20 to-rose-500/20",
    free: "from-indigo-500/20 to-purple-500/20",
  };

  const color = modeColors[mode];
  const gradient = modeGradients[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-2 py-10 text-center md:py-16"
    >
      <div className="relative mb-8">
        <div className={`absolute -inset-8 rounded-full bg-gradient-to-r ${gradient} blur-3xl animate-pulse`} />
        <div
          className="relative mb-6 rounded-[1.35rem] border p-6 shadow-glow-sm"
          style={{ borderColor: `${color}40`, background: "var(--bg-card)" }}
        >
          <Sparkles className="mx-auto h-10 w-10" style={{ color }} />
        </div>
      </div>

      <ModeBadge mode={mode} />
      <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">Start a new conversation</h2>
      <p className="mt-3 max-w-md text-base text-slate-400">
        Your messages stay on this device. Pick a prompt below or type your own.
      </p>

      <ul className="mt-8 w-full max-w-lg space-y-2.5 text-left">
        {hints[mode].map((h, i) => (
          <PromptCard key={i} icon={h.icon} text={h.text} color={color} onClick={() => {}} />
        ))}
      </ul>
    </motion.div>
  );
}