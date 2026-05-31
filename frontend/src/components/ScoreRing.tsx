import { motion } from "framer-motion";

export default function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const stroke = 10;
  const normalized = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#dbeafe"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-slate-900 dark:text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {normalized}
        </motion.span>
        <span className="text-xs font-medium text-slate-500">/ 100</span>
      </div>
    </div>
  );
}
