import { motion } from "framer-motion";
import { CheckCircle2, Mic, RotateCcw, Send, Star } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { loadJourney, recordInterviewSession, setTaskStatus } from "../utils/productJourney";

const baseQuestions = [
  "Tell me about yourself and why this role interests you.",
  "Describe a time you solved a difficult problem.",
  "What achievement are you most proud of?",
  "How do you handle feedback or pressure?",
  "Why should we choose you for this opportunity?",
];

function scoreAnswer(answer: string) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasSituation = /when|while|during|at|in my|there was/i.test(answer);
  const hasAction = /i did|i used|i created|i led|i helped|i improved|i managed|i built|i organized/i.test(answer);
  const hasResult = /result|therefore|so|which led|improved|increased|reduced|learned|achieved/i.test(answer);
  const hasMetric = /\d|percent|%|more|less|weekly|monthly/i.test(answer);
  const total = [words >= 45, hasSituation, hasAction, hasResult, hasMetric].filter(Boolean).length;
  return {
    total,
    words,
    feedback: [
      words >= 45 ? "Enough detail for a first draft." : "Add more detail so the answer feels specific.",
      hasSituation ? "Clear context is present." : "Start with a brief situation or background.",
      hasAction ? "Your own action is visible." : "Make your personal action clearer.",
      hasResult ? "You mention a result or lesson." : "End with a result, impact, or what you learned.",
      hasMetric ? "Good use of measurable evidence." : "Add a number, scale, frequency, or concrete outcome if possible.",
    ],
  };
}

export default function InterviewPrepPage() {
  const journey = loadJourney();
  const questions = useMemo(() => {
    const role = journey.preferredRole || "this role";
    return [
      `Why are you interested in ${role}?`,
      ...baseQuestions,
      `What skill would help you succeed as ${role}?`,
    ];
  }, [journey.preferredRole]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(null);
  const [reviewedAnswers, setReviewedAnswers] = useState<Record<number, ReturnType<typeof scoreAnswer>>>({});
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const completedCount = Object.keys(reviewedAnswers).length;
  const requiredReviews = 3;

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = scoreAnswer(answer);
    setResult(next);
    const updated = { ...reviewedAnswers, [index]: next };
    setReviewedAnswers(updated);
    if (Object.keys(updated).length >= requiredReviews && !sessionRecorded) {
      recordInterviewSession();
      setSessionRecorded(true);
    } else {
      setTaskStatus("interview_practice", "in_progress", {
        reviewedAnswers: Object.keys(updated).length,
        requiredReviewedAnswers: requiredReviews,
      });
    }
  }

  function nextQuestion() {
    setIndex((i) => (i + 1) % questions.length);
    setAnswer("");
    setResult(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-6 pb-10"
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
          <Mic className="h-4 w-4" />
          Mock interview
        </div>
        <h1 className="text-3xl font-bold text-white">Practice with STAR feedback</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Complete at least {requiredReviews} reviewed answers before this counts as interview progress. Opening the page or reviewing one answer is treated as practice, not completion.
        </p>
        <div className="mt-4 h-2 max-w-md overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500" style={{ width: `${Math.min(100, (completedCount / requiredReviews) * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">{Math.min(completedCount, requiredReviews)} of {requiredReviews} reviewed answers completed</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Question {index + 1} of {questions.length}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{questions[index]}</h2>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={9}
            placeholder="Use the STAR method: situation, task, action, result..."
            className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!answer.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Review answer
            </button>
            <button
              type="button"
              onClick={nextQuestion}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Next question
            </button>
          </div>
        </form>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Feedback</h2>
            {result && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <Star className="h-3.5 w-3.5" />
                {result.total}/5
              </span>
            )}
          </div>
          {result ? (
            <div className="mt-4 space-y-3">
              {result.feedback.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p>{item}</p>
                </div>
              ))}
              <div className="rounded-xl bg-cyan-500/10 p-3 text-sm text-cyan-200">
                Strong answer formula: context, your action, measurable outcome, lesson learned.
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Your review will appear here. Aim for a concise story with evidence, not a memorized speech.
            </p>
          )}
        </aside>
      </section>
    </motion.div>
  );
}
