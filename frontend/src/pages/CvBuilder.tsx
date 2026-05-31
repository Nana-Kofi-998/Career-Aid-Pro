import { motion } from "framer-motion";
import { ClipboardCheck, Download, FileText, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Experience = { title: string; company: string; dates: string; bullets: string };
type Education = { degree: string; school: string; year: string };

const STEPS = ["Contact", "Summary", "Experience", "Education", "Skills", "Generate"];

const emptyExp = (): Experience => ({ title: "", company: "", dates: "", bullets: "" });
const emptyEdu = (): Education => ({ degree: "", school: "", year: "" });

const TEMPLATES = [
  { value: "sidebar", label: "Sidebar", desc: "Left sidebar layout", color: "from-blue-500 to-indigo-600" },
  { value: "twocolumn", label: "Two-Column", desc: "Balanced columns", color: "from-emerald-500 to-teal-600" },
  { value: "timeline", label: "Timeline", desc: "Vertical timeline with dates", color: "from-purple-500 to-pink-600" },
  { value: "minimalist", label: "Minimalist", desc: "Clean typography focus", color: "from-slate-700 to-slate-900" },
  { value: "infographic", label: "Infographic", desc: "Dark gradient with icons", color: "from-violet-600 to-purple-800" },
  { value: "centered", label: "Centered", desc: "Classic serif centered", color: "from-amber-600 to-orange-700" },
  { value: "boxed", label: "Boxed", desc: "Outlined section boxes", color: "from-cyan-500 to-blue-600" },
  { value: "dark", label: "Dark", desc: "Modern dark theme", color: "from-gray-800 to-gray-950" },
  { value: "lined", label: "Lined", desc: "Stationery paper style", color: "from-rose-500 to-pink-600" },
  { value: "classic", label: "Classic", desc: "Traditional formal layout", color: "from-indigo-500 to-blue-600" },
  { value: "executive", label: "Executive", desc: "Boardroom polish", color: "from-blue-700 to-sky-600" },
  { value: "atelier", label: "Atelier", desc: "Elegant creative serif", color: "from-rose-700 to-stone-500" },
  { value: "metro", label: "Metro", desc: "Sharp urban split", color: "from-teal-700 to-slate-700" },
  { value: "editorial", label: "Editorial", desc: "Magazine-style type", color: "from-zinc-800 to-zinc-500" },
  { value: "compact", label: "Compact", desc: "Dense one-page fit", color: "from-blue-600 to-cyan-500" },
  { value: "accentbar", label: "Accent Bar", desc: "Strong side accent", color: "from-amber-700 to-orange-500" },
  { value: "portfolio", label: "Portfolio", desc: "Creative header focus", color: "from-violet-700 to-fuchsia-500" },
  { value: "consultant", label: "Consultant", desc: "Clean advisory layout", color: "from-cyan-700 to-blue-500" },
  { value: "graduate", label: "Graduate", desc: "Fresh early-career", color: "from-cyan-500 to-teal-400" },
  { value: "tech", label: "Tech", desc: "Developer-friendly dark", color: "from-slate-900 to-green-600" },
];

const CV_BUILDER_DRAFT_KEY = "career_aid_cv_builder_draft";

type ImportedCvDraft = {
  source?: string;
  docName?: string;
  extractedText?: string;
  recommendations?: string[];
  analysis?: { total_score?: number };
  createdAt?: string;
};

const SKILL_KEYWORDS = [
  "Excel",
  "PowerPoint",
  "Python",
  "JavaScript",
  "React",
  "SQL",
  "Data analysis",
  "Customer service",
  "Communication",
  "Leadership",
  "Research",
  "Project management",
  "Accounting",
  "Marketing",
  "Graphic design",
  "Teaching",
  "Problem solving",
];

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function extractPhone(text: string) {
  return text.match(/(?:\+?\d[\s().-]?){8,}/)?.[0]?.trim() || "";
}

function extractLinkedIn(text: string) {
  return text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,;]+/i)?.[0] || "";
}

function extractName(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 12);
  return lines.find((line) => {
    if (line.length > 60 || /@|http|linkedin|curriculum|resume|cv/i.test(line)) return false;
    return /^[A-Za-z][A-Za-z .'-]{2,}$/.test(line) && line.split(/\s+/).length <= 5;
  }) || "";
}

function extractSkills(text: string) {
  const found = SKILL_KEYWORDS.filter((skill) => new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
  return Array.from(new Set(found)).join(", ");
}

function extractSummary(text: string) {
  const section = text.match(/(?:profile|professional summary|summary)\s*:?\s*([\s\S]{80,700}?)(?=\n\s*(?:experience|education|skills|certifications)\b|$)/i);
  return section?.[1]?.replace(/\s+/g, " ").trim().slice(0, 500) || "";
}

function extractEducation(text: string): Education[] {
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => /\b(university|college|school|shs|wassce|bachelor|degree|diploma|certificate)\b/i.test(item));
  return line ? [{ degree: line, school: "", year: "" }] : [emptyEdu()];
}

export default function CvBuilderPage() {
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [html, setHtml] = useState("");
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [importedDraft, setImportedDraft] = useState<ImportedCvDraft | null>(null);



  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    target_role: "",
    professional_summary: "",
    skills: "",
    certifications: "",
    languages: "",
    cv_template: "sidebar",
    use_ai: true,
    use_chat_context: true,
  });

  const [experience, setExperience] = useState<Experience[]>([emptyExp()]);
  const [education, setEducation] = useState<Education[]>([emptyEdu()]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        full_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || f.full_name,
      }));
    }
  }, [user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CV_BUILDER_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as ImportedCvDraft;
      if (draft.source !== "cv_analyzer") return;
      const text = draft.extractedText || "";
      const importedName = extractName(text);
      const importedEmail = extractEmail(text);
      const importedPhone = extractPhone(text);
      const importedLinkedIn = extractLinkedIn(text);
      const importedSkills = extractSkills(text);
      const importedSummary = extractSummary(text);
      setImportedDraft(draft);
      setForm((current) => ({
        ...current,
        full_name: current.full_name || importedName,
        email: current.email || importedEmail,
        phone: current.phone || importedPhone,
        linkedin: current.linkedin || importedLinkedIn,
        skills: current.skills || importedSkills,
        professional_summary: current.professional_summary || importedSummary,
        use_ai: true,
      }));
      setEducation((current) => {
        if (current.some((item) => item.degree || item.school || item.year)) return current;
        return extractEducation(text);
      });
    } catch {
      localStorage.removeItem(CV_BUILDER_DRAFT_KEY);
    }
  }, []);

  const inputClass = "input-field text-sm";

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await api.generateCv({
        ...form,
        improvement_notes: importedDraft?.recommendations || [],
        // Builder bullets come as newline text.
        experience: experience.map((e) => ({
          ...e,
          bullets: e.bullets.split("\n").filter(Boolean),
        })),
        education,
      });
      setHtml(res.html);
      setAiNote(res.ai_note);
      setStep(STEPS.length);

    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadHtml() {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.full_name || "cv"}.html`.replace(/\s+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
  }

  function printCv() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  function clearImportedDraft() {
    localStorage.removeItem(CV_BUILDER_DRAFT_KEY);
    setImportedDraft(null);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  if (step >= STEPS.length && html) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your CV</h1>
            {aiNote && <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{aiNote}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={printCv}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={downloadHtml}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600"
            >
              <Download className="h-4 w-4" />
              Download HTML
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setHtml("");
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600"
            >
              Edit answers
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-slate-700">
          <iframe
            title="CV preview"
            srcDoc={html}
            className="min-h-[55vh] w-full bg-slate-100 sm:min-h-[800px]"
          />
        </div>

        <p className="text-center text-sm text-slate-500">
          Tip: Use Print → Save as PDF for a polished file.{" "}
          <Link to="/chat" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Open Career Coach
          </Link>{" "}
          to refine with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <motion.div className="rounded-xl bg-gradient-to-br from-emerald-600 to-indigo-600 p-3 text-white shadow-lg">
          <FileText className="h-6 w-6" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CV Builder</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Answer a few questions — AI polishes your content using Career Coach chats.</p>
        </div>
      </motion.div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <p className="text-xs text-slate-500">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {importedDraft && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-50 p-4 text-slate-950 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="rounded-xl bg-emerald-600 p-2 text-white">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold">CV Analyzer recommendations imported</h2>
                <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-emerald-100">
                  {importedDraft.docName ? `Source: ${importedDraft.docName}. ` : ""}
                  Contact details, skills, summary, and education were prefilled only where the analyzer could identify them confidently.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearImportedDraft}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/30 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-200/30 dark:text-emerald-100 dark:hover:bg-white/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear import
            </button>
          </div>
          {!!importedDraft.recommendations?.length && (
            <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-800 dark:text-emerald-50">
              {importedDraft.recommendations.slice(0, 5).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="glass-panel space-y-4 p-6">
        {step === 0 && (
          <>
            <label className="block text-sm font-medium">Full name</label>
            <input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <label className="block text-sm font-medium">Location (city, country)</label>
            <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Accra, Ghana" />

            <label className="block text-sm font-medium">LinkedIn (optional)</label>
            <input className={inputClass} value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
          </>
        )}

        {step === 1 && (
          <>
            <label className="block text-sm font-medium">Target role / headline</label>
            <input className={inputClass} value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })} placeholder="e.g. Software Developer" />

            <label className="block text-sm font-medium">Professional summary</label>
            <textarea
              rows={5}
              className={inputClass}
              value={form.professional_summary}
              onChange={(e) => setForm({ ...form, professional_summary: e.target.value })}
              placeholder="Brief overview of your experience and goals…"
            />
          </>
        )}

        {step === 2 && (
          <>
            {experience.map((exp, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-600">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-semibold">Role {i + 1}</span>
                  {experience.length > 1 && (
                    <button type="button" onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    className={inputClass}
                    placeholder="Job title"
                    value={exp.title}
                    onChange={(e) => {
                      const n = [...experience];
                      n[i].title = e.target.value;
                      setExperience(n);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => {
                      const n = [...experience];
                      n[i].company = e.target.value;
                      setExperience(n);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Dates (e.g. Jan 2022 – Present)"
                    value={exp.dates}
                    onChange={(e) => {
                      const n = [...experience];
                      n[i].dates = e.target.value;
                      setExperience(n);
                    }}
                  />
                  <textarea
                    rows={3}
                    className={inputClass}
                    placeholder="Achievements (one per line)"
                    value={exp.bullets}
                    onChange={(e) => {
                      const n = [...experience];
                      n[i].bullets = e.target.value;
                      setExperience(n);
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setExperience([...experience, emptyExp()])}
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400"
            >
              <Plus className="h-4 w-4" /> Add another role
            </button>
          </>
        )}

        {step === 3 && (
          <>
            {education.map((ed, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-600">
                <input
                  className={inputClass}
                  placeholder="Degree / qualification"
                  value={ed.degree}
                  onChange={(e) => {
                    const n = [...education];
                    n[i].degree = e.target.value;
                    setEducation(n);
                  }}
                />
                <input
                  className={inputClass}
                  placeholder="School / university"
                  value={ed.school}
                  onChange={(e) => {
                    const n = [...education];
                    n[i].school = e.target.value;
                    setEducation(n);
                  }}
                />
                <input
                  className={inputClass}
                  placeholder="Year"
                  value={ed.year}
                  onChange={(e) => {
                    const n = [...education];
                    n[i].year = e.target.value;
                    setEducation(n);
                  }}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setEducation([...education, emptyEdu()])}
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400"
            >
              <Plus className="h-4 w-4" /> Add education
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <label className="block text-sm font-medium">Skills (comma-separated)</label>
            <textarea rows={3} className={inputClass} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />

            <label className="block text-sm font-medium">Certifications</label>
            <input className={inputClass} value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} />

            <label className="block text-sm font-medium">Languages</label>
            <input className={inputClass} value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
          </>
        )}

        {/* Upload step removed from CV Builder; CV upload now lives in CV Analyzer */}

        {step === 5 && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We will format your CV and optionally enhance it with AI using your Career Coach conversations.
            </p>

            <label className="block text-sm font-medium">CV template</label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cv_template: t.value }))}
                  className={`rounded-xl border px-3 py-2.5 text-left transition text-xs ${
                    form.cv_template === t.value
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-200 hover:border-emerald-500/25"
                  }`}
                >
                  <div className={`h-1 w-6 rounded bg-gradient-to-r ${t.color} mb-1`} />
                  <p className={`text-xs font-semibold ${form.cv_template === t.value ? "text-emerald-700 dark:text-emerald-200" : "text-slate-900 dark:text-slate-100"}`}>{t.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{t.desc}</p>
                </button>
              ))}
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.use_ai} onChange={(e) => setForm({ ...form, use_ai: e.target.checked })} />
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Polish with AI
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.use_chat_context}
                onChange={(e) => setForm({ ...form, use_chat_context: e.target.checked })}
              />
              Include insights from Career Coach chats
            </label>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={generate}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Wand2 className="h-4 w-4" />
              {busy ? "Generating…" : "Generate my CV"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

