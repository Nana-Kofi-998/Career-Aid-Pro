import { motion } from "framer-motion";
import { Brain, Briefcase, FileText, Heart, Shield, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { PublicFooter } from "./MobileNav";

const features = [
  { icon: Briefcase, text: "Ghana-focused career coaching & CV tools" },
  { icon: Heart, text: "Mental wellness tailored to your temperament" },
  { icon: FileText, text: "AI CV builder & document-aware chat" },
  { icon: Shield, text: "Secure hosted access with protected accounts" },
];

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <motion.div className="auth-shell-dark dark relative flex min-h-screen overflow-hidden bg-[#080b12] text-white">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-violet-400/15 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(52,211,153,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_80%,rgba(167,139,250,0.12),transparent_50%)]" />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md shadow-glow-sm">
              <Brain className="h-9 w-9 text-emerald-300" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Career-Aid Pro</p>
              <p className="text-sm text-slate-400">Your AI career & wellness companion</p>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-12 max-w-md text-3xl font-bold leading-tight tracking-tight"
          >
            Build your future with{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              confidence
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400"
          >
            Hosted AI coaching, temperament insights, CV scoring, and a professional CV builder —
            designed for students and professionals in Ghana and beyond.
          </motion.p>

          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-slate-300"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-emerald-400" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative flex items-center gap-2 text-xs text-slate-500"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400/80" />
          Hosted AI service · Secure account-based experience
        </motion.div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400/30"
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [0, -12, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 text-white shadow-glow-sm">
              <Brain className="h-7 w-7" />
            </div>
            <div>
            <p className="font-bold text-white">Career-Aid Pro</p>
            <p className="text-sm text-slate-400">Hosted AI career & wellness</p>
            </div>
          </div>

<div className="relative glass-panel p-6 shadow-glass-lg sm:p-8">
            <p className="label-caps mb-2 text-emerald-400">Account</p>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

            <div className="mt-6">{children}</div>
          </div>
          <PublicFooter />
        </motion.div>
      </main>
    </motion.div>
  );
}
