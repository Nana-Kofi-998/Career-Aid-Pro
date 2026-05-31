import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  docName: string;
  hasDoc: boolean;
  onClearDoc: () => void;
}

export default function CareerCoachPanel({
  docName,
  hasDoc,
  onClearDoc,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!hasDoc) return null;

  return (
    <motion.div className="border-b border-slate-200 bg-gradient-to-r from-blue-50/80 to-teal-500/10/50 dark:border-slate-700 dark:from-slate-800/80 dark:to-indigo-950/40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-slate-900 dark:text-white"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          CV loaded for context
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4"
          >
            <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              <span className="truncate">Loaded: {docName}</span>
              <button
                type="button"
                onClick={() => {
                  onClearDoc();
                }}
                className="ml-2 font-semibold underline"
              >
                Remove
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Your CV context is being used for career guidance. You can also upload or edit your CV in the{" "}
              <Link to="/cv-tools/cv-builder" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                CV Builder
              </Link>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
