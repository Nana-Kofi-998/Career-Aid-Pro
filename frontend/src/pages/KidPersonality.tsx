import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { addChildBadge, completeTask, setTaskStatus } from "../utils/productJourney";

interface KidQuestion {
  id: string;
  text: string;
  emoji: string;
}

const KID_QUESTIONS: KidQuestion[] = [
  { id: "k1", text: "I love solving puzzles!", emoji: "🧩" },
  { id: "k2", text: "I like to draw or paint pictures", emoji: "🎨" },
  { id: "k3", text: "I enjoy telling stories to my friends", emoji: "📖" },
  { id: "k4", text: "I like building things with blocks or LEGO", emoji: "🧱" },
  { id: "k5", text: "I enjoy singing or making music", emoji: "🎵" },
  { id: "k6", text: "I like to help other kids when they're sad", emoji: "🤗" },
  { id: "k7", text: "I love exploring nature and finding bugs", emoji: "🐞" },
  { id: "k8", text: "I enjoy playing pretend games", emoji: "🤹" },
  { id: "k9", text: "I like asking 'why' about everything", emoji: "🤔" },
  { id: "k10", text: "I enjoy dancing or moving to music", emoji: "💃" },
  { id: "k11", text: "I like organizing toys or collections", emoji: "📦" },
  { id: "k12", text: "I enjoy making people laugh", emoji: "😄" },
  { id: "k13", text: "I like watching clouds and imagining shapes", emoji: "☁️" },
  { id: "k14", text: "I enjoy counting things I see", emoji: "🔢" },
  { id: "k15", text: "I like taking care of pets or plants", emoji: "🌱" },
  { id: "k16", text: "I enjoy making up silly words", emoji: "🗣️" },
  { id: "k17", text: "I like spotting patterns in pictures", emoji: "🔍" },
  { id: "k18", text: "I enjoy working in a team with friends", emoji: "👥" },
  { id: "k19", text: "I like imagining adventures in faraway places", emoji: "🚀" },
  { id: "k20", text: "I enjoy teaching others how to do things", emoji: "👩‍🏫" },
];

const RESPONSES = [
  { v: 1, label: "Not like me", emoji: "😕" },
  { v: 2, label: "A little like me", emoji: "🙂" },
  { v: 3, label: "Sort of like me", emoji: "😐" },
  { v: 4, label: "Mostly like me", emoji: "😊" },
  { v: 5, label: "Just like me!", emoji: "🤩" },
];

function pickKidQuestions(count: number) {
  const storageKey = "career_aid_kid_personality_seen";
  let used: string[] = [];
  try {
    used = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
  } catch {
    used = [];
  }
  let available = KID_QUESTIONS.filter((q) => !used.includes(q.id));
  if (available.length < count) {
    available = KID_QUESTIONS;
    used = [];
  }
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, count);
  try {
    localStorage.setItem(storageKey, JSON.stringify([...used, ...picked.map((q) => q.id)]));
  } catch {
    /* ignore local progress failures */
  }
  return picked;
}

export default function KidPersonalityPage() {
  const { refreshUser } = useAuth();
  const [questions, setQuestions] = useState<KidQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retaking, setRetaking] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);

  useEffect(() => {
    setQuestions(pickKidQuestions(10));
    api.personalityProfile().then((r) => {
      if (!r.has_profile || !r.profile) return;
      const raw = r.profile as Record<string, unknown>;
      const stored =
        typeof raw.summary === "string" && raw.summary.startsWith("KidProfile:")
          ? raw.summary
          : typeof raw.temperament === "string" && raw.temperament !== "Custom"
            ? raw.temperament
            : "";
      const kidProfile = stored.replace("KidProfile:", "");
      if (kidProfile) {
        setProfile(kidProfile);
        setHasProfile(true);
      }
    }).catch(() => undefined);
  }, []);

  const current = questions[step];
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;

  async function submit() {
    const answeredQuestions = questions.filter((q) => answers[q.id] !== undefined).length;
    if (answeredQuestions !== questions.length) {
      setError(`Please answer all ${questions.length} questions first.`);
      return;
    }
    setBusy(true);
    setError("");
    setTaskStatus("kid_personality_test", "in_progress");
    try {
      const res = await api.submitKidPersonality(answers);
      setProfile(res.profile);
      setHasProfile(true);
      setRetaking(false);
      setStep(questions.length);
      completeTask("kid_personality_test", {
        answeredQuestions,
        requiredQuestions: questions.length,
        allAnswersValid: true,
        profileGenerated: true,
        profileSaved: true,
      });
      addChildBadge("Personality Finder", {
        completedAssessment: true,
        answeredQuestions,
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
      setError("Please pick an answer!");
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
    setTaskStatus("kid_personality_test", "in_progress", {
      retakeStarted: true,
      previousProfileKeptUntilReplacement: true,
    });
    setQuestions(pickKidQuestions(10));
  }

  if (hasProfile && profile && !retaking) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border p-8 text-center"
          style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-3xl">
            🎉
          </div>
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--kid-text-secondary)" }}>
            Your Learning Style
          </p>
          <h1 className="mt-2 text-3xl font-bold" style={{ color: "var(--kid-text-primary)" }}>{profile}</h1>
          <p className="mt-4" style={{ color: "var(--kid-text-secondary)" }}>
            Your AI helper will use this to make learning more fun for you!
          </p>
        </motion.div>

        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="flex-1 rounded-xl bg-blue-600 py-3 text-center font-semibold text-white"
          >
            Back to Games
          </Link>
          <button
            onClick={() => setConfirmRetake(true)}
            className="rounded-xl border px-4 py-3 font-semibold"
            style={{ borderColor: "var(--kid-border)", color: "var(--kid-text-primary)" }}
          >
            Retake
          </button>
        </div>
        {confirmRetake && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-sm rounded-3xl border p-6 shadow-2xl" style={{ background: "var(--kid-bg-card)", borderColor: "var(--kid-border)" }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Retake the test?</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--kid-text-secondary)" }}>
                Your current learning style stays saved until you finish the new test.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmRetake(false)} className="rounded-xl border px-4 py-2 font-semibold" style={{ borderColor: "var(--kid-border)", color: "var(--kid-text-primary)" }}>
                  Cancel
                </button>
                <button type="button" onClick={startRetake} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">
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
        <h1 className="text-2xl font-bold" style={{ color: "var(--kid-text-primary)" }}>
          <Sparkles className="inline h-6 w-6 text-sky-500" /> How Do You Learn Best?
        </h1>
        <p className="mt-1" style={{ color: "var(--kid-text-secondary)" }}>
          Pick how much each sentence sounds like you!
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--kid-text-secondary)" }}>
          Question {Math.min(step + 1, questions.length)} of {questions.length}
        </p>
      </div>

      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl border p-6 shadow-lg"
          style={{ background: "var(--kid-bg-card)", borderColor: "var(--kid-border)" }}
        >
          <div className="mb-4 text-center">
            <span className="text-5xl">{current.emoji}</span>
          </div>
          <p className="text-center text-lg font-medium" style={{ color: "var(--kid-text-primary)" }}>
            {current.text}
          </p>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {RESPONSES.map(({ v, label, emoji }) => (
              <button
                key={v}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [current.id]: v }))}
                className={`flex flex-col items-center rounded-xl p-2 text-xs transition ${
                  answers[current.id] === v
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/70 dark:text-blue-50"
                    : "bg-slate-50 text-slate-600 hover:bg-blue-50 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-blue-950/70"
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="mt-1">{label}</span>
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={next}
              className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white"
            >
              {step === questions.length - 1 ? (busy ? "Saving…" : "See Results!") : "Next"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
