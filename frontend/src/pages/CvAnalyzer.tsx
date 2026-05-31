import { motion } from "framer-motion";
import { ArrowRight, ClipboardCheck, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import type { CvAnalysis } from "../types";
import { explainCvScore, recordCvScore } from "../utils/productJourney";

const CV_BUILDER_DRAFT_KEY = "career_aid_cv_builder_draft";

function listFromReport(report: string | null, key: string): string[] {
  if (!report) return [];
  try {
    const parsed = JSON.parse(report) as Record<string, unknown>;
    const value = parsed[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export default function CvAnalyzerPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [docName, setDocName] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState<CvAnalysis | null>(null);
  const [feedbackReport, setFeedbackReport] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const recommendations = useMemo(() => {
    if (!analysis) return [];
    return uniqueItems([
      ...listFromReport(feedbackReport, "priority_actions"),
      ...listFromReport(feedbackReport, "recommended_improvements"),
      ...explainCvScore(analysis).items.map((item) => item.advice),
    ]).slice(0, 8);
  }, [analysis, feedbackReport]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    setAnalysis(null);
    setFeedbackReport(null);
    setExtractedText("");

    try {
      const result = await api.analyzeCv(file);
      setDocName(result.filename || file.name);
      setExtractedText(result.text || "");
      setAnalysis(result.analysis);
      recordCvScore(result.analysis.total_score);
      setFeedbackReport(result.feedback_report ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CV analysis failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function applyRecommendationsToBuilder() {
    if (!analysis) return;
    try {
      localStorage.setItem(
        CV_BUILDER_DRAFT_KEY,
        JSON.stringify({
          source: "cv_analyzer",
          docName,
          extractedText,
          analysis,
          feedbackReport,
          recommendations,
          createdAt: new Date().toISOString(),
        })
      );
      navigate("/cv-tools/cv-builder?from=analyzer");
    } catch {
      setError("Your browser blocked saving the CV draft. Please keep this report open and try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-indigo-600 p-3 text-white shadow-lg">
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">CV Analyzer</h2>
          <p className="text-sm text-slate-400">
            Upload your CV to get objective strengths, weaknesses, and improvements.
          </p>
        </div>
      </motion.div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="relative"
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-500/25 bg-white/5 px-4 py-8 text-sm text-slate-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10">
          <Upload className="h-7 w-7 text-emerald-400" />
          <div className="text-center">
            <div className="font-medium">{busy ? "Processing…" : "Click or drag & drop your CV"}</div>
            <div className="mt-1 text-xs text-slate-500">PDF, DOCX, TXT, or image</div>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            disabled={busy}
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {docName && (
        <div className="mt-1 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          <span className="truncate">Loaded: {docName}</span>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}

      {analysis && (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-white">Heuristic score</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(analysis.breakdown).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-xs text-slate-400">{k}</div>
                <div className="text-sm font-semibold text-white">{v} pts</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-300">
            Total: <span className="font-semibold text-white">{analysis.total_score}</span>
          </div>
        </div>
      )}

      {analysis && (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-white">Why this score?</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            The score is explainable: each section is checked for evidence a recruiter would expect, then the weakest areas are ranked first.
          </p>
          <div className="mt-3 space-y-2">
            {explainCvScore(analysis).items.map((item) => (
              <div key={item.section} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{item.section}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === "Strong"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : item.status === "Developing"
                        ? "bg-amber-500/10 text-amber-300"
                        : "bg-red-500/10 text-red-300"
                  }`}>
                    {item.status}: {item.score}/{item.max}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.advice}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-cyan-500/10 p-3 text-sm text-cyan-100">
            Example improvement: replace “Handled customer records” with “Managed 300+ customer records weekly with 98% accuracy.”
          </div>
        </div>
      )}

      {analysis && (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-400/15 p-2 text-emerald-200">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Apply recommendations safely</h3>
                <p className="mt-1 text-xs leading-5 text-emerald-100">
                  This creates an editable CV Builder draft from the extracted text and ranked recommendations. You review every field before generating the final CV.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={applyRecommendationsToBuilder}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Apply in CV Builder
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {recommendations.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs leading-5 text-emerald-50">
              {recommendations.slice(0, 3).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

       {feedbackReport && (
         <div className="glass-panel p-4">
           <h3 className="text-sm font-bold text-white">CV Report</h3>
           {/* Try to parse as JSON */}
           {typeof feedbackReport === 'string' ? 
             (() => {
               try {
                 const parsed = JSON.parse(feedbackReport);
                 return (
                   <>
                      {(parsed.objective || parsed.overall_objective_summary) && (
                        <div className="mb-4">
                          <h4 className="mb-1 font-semibold text-white">Objective</h4>
                          <p className="text-slate-200">{parsed.objective || parsed.overall_objective_summary}</p>
                        </div>
                      )}
                     {parsed.strengths && parsed.strengths.length > 0 && (
                       <div className="mb-4">
                         <h4 className="mb-1 font-semibold text-white">Strengths</h4>
                         <ul className="list-disc list-inside text-slate-200 space-y-1">
                  {parsed.strengths.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}

                         </ul>
                       </div>
                     )}
                     {parsed.weaknesses && parsed.weaknesses.length > 0 && (
                       <div className="mb-4">
                         <h4 className="mb-1 font-semibold text-white">Weaknesses</h4>
                         <ul className="list-disc list-inside text-slate-200 space-y-1">
                  {parsed.weaknesses.map((w: string, i: number) => (
                            <li key={i}>{w}</li>
                          ))}

                         </ul>
                       </div>
                     )}
                     {parsed.recommended_improvements && parsed.recommended_improvements.length > 0 && (
                       <div className="mb-4">
                         <h4 className="mb-1 font-semibold text-white">Recommended Improvements</h4>
                         <ul className="list-disc list-inside text-slate-200 space-y-1">
                  {parsed.recommended_improvements.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}

                         </ul>
                       </div>
                     )}
                     {parsed.priority_actions && parsed.priority_actions.length > 0 && (
                       <div className="mb-4">
                         <h4 className="mb-1 font-semibold text-white">Priority Actions</h4>
                         <ul className="list-disc list-inside text-slate-200 space-y-1">
                  {parsed.priority_actions.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}

                         </ul>
                       </div>
                     )}
                   </>
                 );
               } catch (e) {
                 // If parsing fails, display the raw string in a readable way
                 return (
                   <p className="text-slate-200 whitespace-pre-wrap">{feedbackReport}</p>
                 );
               }
             })() : 
             // If it's not a string (shouldn't happen, but just in case)
             <p className="text-slate-200">{feedbackReport}</p>
           }
         </div>
       )}
    </div>
  );
}
