import { motion } from "framer-motion";
import { ArrowRight, Brain, Briefcase, FileText, RefreshCw, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { completeTask, setTaskStatus } from "../utils/productJourney";

interface Question {
  id: string;
  text: string;
}

interface ProfileData {
  temperament: string;
  classical_temperament?: string;
  classical_temperament_description?: string;
  scores: Record<string, number>;
  summary?: string;
  career_notes?: string;
  wellness_notes?: string;
  cv_insights?: string[];
  work_style?: string;
  learning_style?: string;
  motivators?: string[];
  growth_areas?: string[];
  coach_instructions?: string;
}

const LIKERT = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
];

function traitLabel(key: string) {
  return key.replace(/_/g, " ");
}

function topTraits(scores: Record<string, number>, count = 3) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => traitLabel(key));
}

function growthTraits(scores: Record<string, number>, count = 2) {
  return Object.entries(scores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, count)
    .map(([key]) => traitLabel(key));
}

function cleanNote(value?: string) {
  return (value || "")
    .replace(/^Career coaching:\s*/i, "")
    .replace(/^Mental wellness:\s*/i, "")
    .replace(/^Coach instructions:\s*/i, "")
    .trim();
}

function readableOverview(profile: ProfileData) {
  const summary = profile.summary || "";
  const looksRaw = /TRAIT SCORES|TEMPERAMENT:|GROWTH AREAS:/i.test(summary);
  if (summary && !looksRaw) return summary;

  const strengths = topTraits(profile.scores ?? {});
  const growth = growthTraits(profile.scores ?? {});
  const strengthText = strengths.length ? strengths.join(", ") : "your strongest traits";
  const growthText = growth.length ? growth.join(" and ") : "a few growth areas";

  return `You show the profile of a ${profile.temperament}: someone whose strongest signals are ${strengthText}. This suggests you may do well with clear goals, practical milestones, and work that lets you turn focus into visible progress. Your growth plan should give attention to ${growthText}, using small experiments, reflection, and supportive feedback rather than pressure.`;
}

export default function PersonalityPage() {
  const { refreshUser } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSeed, setQuestionSeed] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retaking, setRetaking] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);

  useEffect(() => {
    // Retrieve 20 randomly shuffled questions; the back-end generates the
    // seed so the same order is reproducible if we ever need it.
    api.personalityQuestions({ randomize: true }).then((r) => {
      setQuestions(r.questions);
      setQuestionSeed(r.seed);
    });
    api.personalityProfile().then((r) => {
      setHasProfile(r.has_profile);
      if (r.profile) {
        setProfile(r.profile as unknown as ProfileData);
        completeTask("personality_test", {
          profileGenerated: true,
          profileSaved: true,
          restoredFromSavedProfile: true,
        });
      }
    });
  }, []);

  const current = questions[step];
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;

  async function submit() {
    const answeredQuestions = questions.filter((q) => answers[q.id] !== undefined).length;
    if (answeredQuestions !== questions.length) {
      setError(`Please answer all ${questions.length} questions before generating your profile.`);
      return;
    }
    setBusy(true);
    setError("");
    setTaskStatus("personality_test", "in_progress");
    try {
      const res = await api.submitPersonality(answers, questionSeed);
      setProfile(res.profile as unknown as ProfileData);
      setHasProfile(true);
      setRetaking(false);
      setStep(questions.length);
      completeTask("personality_test", {
        answeredQuestions,
        requiredQuestions: questions.length,
        allAnswersValid: true,
        profileGenerated: true,
        profileSaved: true,
      });
      await refreshUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!current) return;
    if (answers[current.id] === undefined) {
      setError("Please select a response");
      return;
    }
    setError("");
    if (step < questions.length - 1) setStep(step + 1);
    else submit();
  }

  function startRetake() {
    setConfirmRetake(false);
    setRetaking(true);
    setStep(0);
    setAnswers({});
    setError("");
    setTaskStatus("personality_test", "in_progress", {
      retakeStarted: true,
      previousProfileKeptUntilReplacement: true,
    });
    api.personalityQuestions({ randomize: true }).then((r) => {
      setQuestions(r.questions);
      setQuestionSeed(r.seed);
    });
  }

  const profileReady = hasProfile && profile && !retaking;

  if (profileReady) {
    const traitEntries = Object.entries(profile.scores ?? {});
    const motivators = profile.motivators ?? ["Mastery", "Growth", "Practical progress"];
    const growthAreas = profile.growth_areas ?? [
      "Keep building confidence through small completed actions.",
      "Use evidence and examples when presenting your strengths.",
    ];

    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Your temperament
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{profile.temperament}</h1>
          {profile.classical_temperament && (
            <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Classical temperament
              </p>
              <p className="mt-1 text-lg font-bold text-white">{profile.classical_temperament}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                You lean {profile.classical_temperament}: {profile.classical_temperament_description || "one of the four classic temperament styles."}
              </p>
            </div>
          )}
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {readableOverview(profile)}
          </p>
        </motion.div>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="glass-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <Brain className="h-5 w-5 text-violet-400" />
              <h2 className="font-semibold text-white">Work and learning style</h2>
            </div>
            <div className="space-y-4 text-sm leading-6 text-slate-300">
              <p><span className="font-semibold text-white">Work style:</span> {profile.work_style || cleanNote(profile.career_notes) || "You tend to do best when guidance is practical, structured, and connected to real goals."}</p>
              <p><span className="font-semibold text-white">Learning style:</span> {profile.learning_style || "You learn best when ideas are broken into clear steps with examples and room to practice."}</p>
              <p><span className="font-semibold text-white">Coach personalization:</span> {cleanNote(profile.coach_instructions) || cleanNote(profile.wellness_notes) || "Use encouraging, specific feedback with practical next steps."}</p>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <Target className="h-5 w-5 text-emerald-400" />
              <h2 className="font-semibold text-white">Motivators and growth plan</h2>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {motivators.map((item) => (
                <span key={item} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">{item}</span>
              ))}
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              {growthAreas.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {traitEntries.length > 0 && (
          <section className="glass-panel p-6">
            <h2 className="mb-4 font-semibold text-white">Trait overview</h2>
            <div className="space-y-3">
              {traitEntries.map(([key, val]) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize text-slate-400">
                      {traitLabel(key)}
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{Math.round(val)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500/100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.cv_insights && profile.cv_insights.length > 0 && (
          <section className="glass-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileText className="h-4 w-4 text-emerald-400" />
              </div>
                  <h2 className="text-lg font-semibold text-white">CV & career insights</h2>
            </div>
            <ul className="space-y-3">
              {profile.cv_insights.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-cyan-400" />
            <h2 className="font-semibold text-white">Career fit</h2>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            {cleanNote(profile.career_notes) ||
              "Use this profile to compare roles by environment, daily tasks, collaboration level, and the type of problems you enjoy solving."}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/chat"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white"
          >
            Start chatting
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setConfirmRetake(true)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Retake Test
          </button>
        </div>

        {confirmRetake && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-w-md rounded-2xl border border-white/10 bg-[#0d0d12] p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-white">Retake personality test?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Your current profile will stay active until you finish the new test. The new profile only replaces it after all questions are answered and saved.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmRetake(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={startRetake}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Yes, retake
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Temperament assessment</h1>
        <p className="mt-1 text-slate-400">
           20 quick questions — no right answers. Results personalize Career Coach and Mental Wellness.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Question {Math.min(step + 1, questions.length)} of {questions.length}
        </p>
      </div>

      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6"
        >
          <p className="text-lg font-medium text-white">{current.text}</p>
          <div className="mt-6 space-y-2">
            {LIKERT.map(({ v, label }) => (
               <button
                 key={v}
                 type="button"
                 onClick={() => setAnswers((a) => ({ ...a, [current.id]: v }))}
                 className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                   answers[current.id] === v
                     ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-800 dark:text-emerald-200"
                     : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                 }`}
               >
                {label}
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={next}
              className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white"
            >
              {step === questions.length - 1 ? (busy ? "Building profile…" : "Generate profile") : "Next"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
