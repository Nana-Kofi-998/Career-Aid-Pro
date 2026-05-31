import { motion } from "framer-motion";
import { ArrowRight, Check, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { CareerGoal, JourneyState, LearnerProfile } from "../utils/productJourney";
import {
  completeTask,
  defaultJourneyState,
  learnerProfileOptions,
  loadJourney,
  normalizeLearnerProfile,
  saveJourney,
} from "../utils/productJourney";

const adultGoals: CareerGoal[] = [
  "Build my CV",
  "Find a career path",
  "Prepare for interviews",
  "Explore my strengths",
  "Improve wellbeing",
];

const childGoals: CareerGoal[] = [
  "Explore my strengths",
  "Find a career path",
  "Improve wellbeing",
];

const goalsByProfile: Record<LearnerProfile, CareerGoal[]> = {
  shs_student: ["Find a career path", "Explore my strengths", "Improve wellbeing"],
  shs_graduate_transition: ["Find a career path", "Build my CV", "Prepare for interviews", "Explore my strengths"],
  university_workforce: ["Build my CV", "Prepare for interviews", "Find a career path", "Explore my strengths"],
  general: adultGoals,
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isKid = user?.age ? user.age < 13 : false;
  const [state, setState] = useState<JourneyState>(() => loadJourney());
  const selectedProfile = normalizeLearnerProfile(
    state.learnerProfile !== "general" ? state.learnerProfile : user?.learner_profile
  );
  const goals = isKid ? childGoals : goalsByProfile[selectedProfile];

  useEffect(() => {
    const current = loadJourney();
    const profile = normalizeLearnerProfile(
      current.learnerProfile !== "general" ? current.learnerProfile : user?.learner_profile
    );
    setState({ ...current, learnerProfile: profile });
  }, [user?.learner_profile]);

  function toggleGoal(goal: CareerGoal) {
    setState((current) => {
      const hasGoal = current.goals.includes(goal);
      return {
        ...current,
        goals: hasGoal ? current.goals.filter((g) => g !== goal) : [...current.goals, goal],
      };
    });
  }

  async function finish() {
    const validGoals = state.goals.length > 0;
    const hasDetails = state.preferredRole.trim().length >= 2 && state.educationLevel.trim().length >= 2;
    if (!validGoals || !hasDetails) return;
    const nextState = { ...defaultJourneyState, ...state, learnerProfile: selectedProfile, onboardingComplete: true };
    saveJourney(nextState);
    if (user?.learner_profile !== selectedProfile) {
      try {
        await api.updateProfile({ learner_profile: selectedProfile });
      } catch (error) {
        console.error("Could not sync learner profile", error);
      }
    }
    completeTask("goals_set", {
      selectedGoals: state.goals,
      goalCount: state.goals.length,
      preferredRole: state.preferredRole.trim(),
      educationLevel: state.educationLevel.trim(),
      learnerProfile: selectedProfile,
      userConfirmed: true,
    });
    completeTask("onboarding", {
      selectedGoals: state.goals,
      learnerProfile: selectedProfile,
      requiredFieldsComplete: true,
      userConfirmed: true,
    });
    navigate("/dashboard");
  }

  const canFinish =
    state.goals.length > 0 &&
    state.preferredRole.trim().length >= 2 &&
    state.educationLevel.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-6 pb-10"
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Compass className="h-4 w-4" />
              Guided setup
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {isKid ? "Set up your explorer space" : "Build your career journey"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              {isKid
                ? "Choose what you want to explore first. The app will keep activities shorter, clearer, and safer for young learners."
                : "Choose your current stage and goals so Career-Aid Pro can act like a practical Guidance Department for academics, university preparation, and work readiness."}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <ShieldCheck className="mb-2 h-5 w-5 text-emerald-400" />
            Your preferences help personalize your hosted account experience.
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Your goals</h2>
          <div className="mt-4 grid gap-3">
            {goals.map((goal) => {
              const active = state.goals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                    active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <span>{isKid ? goal.replace("Find a career path", "Discover jobs") : goal}</span>
                  {active && <Check className="h-4 w-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">{isKid ? "Explorer details" : "Guidance details"}</h2>
          {!isKid && (
            <label className="mt-4 block text-sm">
              <span className="font-medium text-slate-300">Current status</span>
              <select
                value={selectedProfile}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    learnerProfile: e.target.value as LearnerProfile,
                    goals: s.goals.filter((goal) =>
                      goalsByProfile[e.target.value as LearnerProfile].includes(goal)
                    ),
                  }))
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
              >
                {learnerProfileOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {learnerProfileOptions.find((option) => option.value === selectedProfile)?.detail}
              </p>
            </label>
          )}
          <label className="mt-4 block text-sm">
            <span className="font-medium text-slate-300">
              {isKid ? "A job you are curious about" : selectedProfile === "shs_student" ? "Programme, subject, or career you are considering" : "Target programme, route, role, or business idea"}
            </span>
            <input
              value={state.preferredRole}
              onChange={(e) => setState((s) => ({ ...s, preferredRole: e.target.value }))}
              placeholder={isKid ? "Doctor, pilot, designer..." : selectedProfile === "shs_student" ? "Science, Business, nursing, law..." : "Computer science, accounting, fashion business, teacher..."}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="font-medium text-slate-300">{isKid ? "School stage" : "Your class, programme, or transition stage"}</span>
            <input
              value={state.educationLevel}
              onChange={(e) => setState((s) => ({ ...s, educationLevel: e.target.value }))}
              placeholder={isKid ? "Primary, JHS..." : selectedProfile === "shs_student" ? "SHS 1 General Arts, SHS 3 Science..." : "Completed SHS, Level 200, final year..."}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="font-medium text-slate-300">Confidence today: {state.confidence}/5</span>
            <input
              type="range"
              min={1}
              max={5}
              value={state.confidence}
              onChange={(e) => setState((s) => ({ ...s, confidence: Number(e.target.value) }))}
              className="mt-3 w-full accent-emerald-500"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={finish}
          disabled={!canFinish}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Start my journey
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
