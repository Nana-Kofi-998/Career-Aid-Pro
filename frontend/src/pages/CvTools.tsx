import { motion } from "framer-motion";
import { ChevronDown, FileText, Sparkles, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import CvAnalyzerPage from "./CvAnalyzer";
import CvBuilderPage from "./CvBuilder";

export default function CvToolsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const path = location.pathname;
  const selection = useMemo(() => {
    if (path.includes("/cv-analyzer")) return "analyzer";
    if (path.includes("/cv-builder")) return "builder";
    return "builder";
  }, [path]);

  const title = selection === "analyzer" ? "CV Analyzer" : "CV Builder";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-indigo-600 p-3 text-white shadow-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CV Tools</h1>
            <p className="text-sm text-slate-400">
              Choose what you want to do with your CV.
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur transition hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-2">
              {selection === "analyzer" ? (
                <Sparkles className="h-4 w-4 text-emerald-400" />
              ) : (
                <Upload className="h-4 w-4 text-violet-400" />
              )}
              {title}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-white/10 bg-[#0d0d12] p-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/cv-tools/cv-analyzer");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                CV Analyzer
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/cv-tools/cv-builder");
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                CV Builder
              </button>
              <div className="px-3 py-2 text-xs text-slate-500">
                <Link to="/chat" className="text-emerald-400 hover:underline">
                  Open Career Coach
                </Link>
                {" "}for further AI refinement.
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="glass-panel p-4 md:p-6">
        {selection === "analyzer" ? <CvAnalyzerPage /> : <CvBuilderPage />}
      </div>
    </div>
  );
}
