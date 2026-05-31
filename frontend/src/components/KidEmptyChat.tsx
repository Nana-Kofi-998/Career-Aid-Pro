import { motion } from "framer-motion";
import { Briefcase, Heart, Globe, Sparkles } from "lucide-react";
import ModeBadge from "./ModeBadge";

const kidModeOptions = [
  { 
    mode: "Career Coach", 
    icon: Briefcase, 
    color: "bg-gradient-to-br from-sky-400 to-blue-600",
    emoji: "💼",
    description: "Discover cool jobs!",
    examples: [
      "What jobs use robots?",
      "How do I become a scientist?",
      "What's fun about being an engineer?",
    ]
  },
  { 
    mode: "Mental Health", 
    icon: Heart, 
    color: "bg-gradient-to-br from-cyan-400 to-blue-600",
    emoji: "❤️",
    description: "Feelings helper",
    examples: [
      "I'm feeling sad today",
      "How do I calm down?",
      "What makes you happy?",
    ]
  },
  { 
    mode: "free", 
    icon: Globe, 
    color: "bg-gradient-to-br from-amber-400 to-sky-600",
    emoji: "🌍",
    description: "Ask anything!",
    examples: [
      "Why is the sky blue?",
      "Tell me a joke!",
      "What's the biggest animal?",
    ]
  },
];

const PromptCard = ({ 
  text, 
  onClick,
  emoji 
}: { 
  text: string; 
  onClick: () => void;
  emoji: string;
}) => (
  <motion.li
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="group cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 hover:shadow-lg"
    style={{ background: "var(--kid-bg-card)", borderColor: "var(--kid-border)" }}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-md">
        {emoji}
      </div>
      <div className="flex-1">
        <span className="text-sm font-bold" style={{ color: "var(--kid-text-primary)" }}>{text}</span>
      </div>
    </div>
  </motion.li>
);

export default function KidEmptyChat({ mode }: { mode: "Career Coach" | "Mental Health" | "free" }) {
  const currentMode = kidModeOptions.find(m => m.mode === mode) || kidModeOptions[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-2 py-10 text-center md:py-16"
    >
      <div className="relative mb-8">
        <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-sky-200/50 via-cyan-200/50 to-blue-200/50 blur-3xl animate-pulse dark:from-sky-900/35 dark:via-cyan-900/25 dark:to-blue-900/35" />
        <div className="relative mb-6 rounded-[2rem] border-4 p-6 shadow-xl" style={{ background: "var(--kid-bg-card)", borderColor: "var(--kid-border)" }}>
          <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl ${currentMode.color} shadow-lg`}>
            <span className="text-3xl">{currentMode.emoji}</span>
          </div>
          <Sparkles className="mx-auto h-6 w-6 text-sky-500" />
        </div>
      </div>

      <ModeBadge mode={mode} />
      <h2 className="mt-5 text-3xl font-extrabold" style={{ color: "var(--kid-text-primary)" }}>
        {currentMode.description}
      </h2>
      <p className="mt-2 max-w-md text-base" style={{ color: "var(--kid-text-secondary)" }}>
        Your messages stay on this device. Pick a fun question below!
      </p>

      <ul className="mt-8 w-full max-w-lg space-y-3 text-left">
        {currentMode.examples.map((example, i) => (
          <PromptCard
            key={i}
            text={example}
            emoji={currentMode.emoji}
            onClick={() => {}}
          />
        ))}
      </ul>
    </motion.div>
  );
}
