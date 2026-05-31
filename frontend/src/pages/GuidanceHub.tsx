import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Hammer,
  LineChart,
  Map,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  completeTask,
  learnerProfileLabel,
  loadJourney,
  normalizeLearnerProfile,
  type LearnerProfile,
} from "../utils/productJourney";

type SubjectGrade = { name: string; score: number };
type SemesterRecord = { id: string; label: string; subjects: SubjectGrade[] };
type SkillKey = "communication" | "digital" | "entrepreneurship" | "technical";
type VocationalAnswer = Record<string, SkillKey>;

const STORAGE_KEY = "career_aid_guidance_hub";

const defaultSubjects: SubjectGrade[] = [
  { name: "Core Mathematics", score: 65 },
  { name: "English Language", score: 70 },
  { name: "Integrated Science", score: 60 },
  { name: "Social Studies", score: 68 },
];

const defaultAcademicHistory: SemesterRecord[] = [
  { id: "shs1-sem1", label: "SHS 1 - Semester 1", subjects: defaultSubjects },
];

const stagePlans: Record<LearnerProfile, { headline: string; focus: string; pathSteps: string[]; applicationItems: string[] }> = {
  shs_student: {
    headline: "SHS academic and subject guidance",
    focus: "Protect grades, choose subjects wisely, prepare for WASSCE, and connect school strengths to future programmes.",
    pathSteps: ["Confirm strongest subjects", "Compare SHS tracks and university entry requirements", "Create a WASSCE improvement routine", "Plan backup options with Career-Aid guidance"],
    applicationItems: ["Result slips or report cards", "Target programmes list", "Subject requirement notes", "School-specific details to verify"],
  },
  shs_graduate_transition: {
    headline: "SHS graduate transition planning",
    focus: "Prepare for university, TVET, employment, apprenticeship, or self-employment with a clear next-step plan.",
    pathSteps: ["Shortlist university/work routes", "Check fees, deadlines, and entry requirements", "Prepare CV and personal statement", "Plan scholarship and interview readiness"],
    applicationItems: ["WASSCE results", "Personal statement", "Recommendation contact", "Application deadlines", "CV or activity record"],
  },
  university_workforce: {
    headline: "University to workforce readiness",
    focus: "Turn coursework, projects, NSS, internships, and leadership into employability evidence.",
    pathSteps: ["Pick target roles or industries", "Build portfolio evidence", "Apply for internships/NSS leads", "Practise interviews and workplace communication"],
    applicationItems: ["Updated CV", "Portfolio/project links", "Transcript or academic record", "Internship/NSS shortlist", "LinkedIn/profile checklist"],
  },
  general: {
    headline: "Personal guidance plan",
    focus: "Use the core guidance tools to clarify goals, improve readiness, and prepare for education or work transitions.",
    pathSteps: ["Clarify current stage", "Choose a target route", "Prepare documents", "Practise the next conversation or interview"],
    applicationItems: ["Current education record", "CV or activity list", "Target opportunity list", "Deadline checklist"],
  },
};

const skillLabels: Record<SkillKey, string> = {
  communication: "Communication",
  digital: "Digital literacy",
  entrepreneurship: "Entrepreneurship",
  technical: "Technical/practical skill",
};

const vocationalScenarios: {
  id: string;
  prompt: string;
  options: { key: SkillKey; text: string; evidence: string }[];
}[] = [
  {
    id: "broken_process",
    prompt: "A school club or small business has a slow, confusing process. What would you naturally do first?",
    options: [
      { key: "communication", text: "Interview people involved and explain the problem clearly.", evidence: "Stakeholder communication" },
      { key: "digital", text: "Create a simple spreadsheet or digital form to track what is happening.", evidence: "Digital workflow thinking" },
      { key: "entrepreneurship", text: "Estimate the cost of the delay and suggest a better way to serve customers.", evidence: "Business opportunity thinking" },
      { key: "technical", text: "Inspect the physical steps or tools and fix the part that slows people down.", evidence: "Hands-on problem solving" },
    ],
  },
  {
    id: "limited_resources",
    prompt: "You have limited money and one week to complete a practical project. What is your strongest contribution?",
    options: [
      { key: "communication", text: "Coordinate the team, assign roles, and keep everyone updated.", evidence: "Team coordination" },
      { key: "digital", text: "Research online, design the plan, and prepare a clear digital presentation.", evidence: "Research and presentation tools" },
      { key: "entrepreneurship", text: "Find cheaper suppliers, negotiate, and keep the project within budget.", evidence: "Resource and cost judgement" },
      { key: "technical", text: "Build, repair, test, or assemble the actual product or prototype.", evidence: "Making and testing" },
    ],
  },
  {
    id: "customer_need",
    prompt: "A group of students need a service that does not exist in your school or community. What do you do?",
    options: [
      { key: "communication", text: "Run a short survey and present the need to school leaders or partners.", evidence: "Needs assessment" },
      { key: "digital", text: "Set up a simple online sign-up, poster, or information page.", evidence: "Digital service setup" },
      { key: "entrepreneurship", text: "Design a small service, price it fairly, and test whether people will pay.", evidence: "Market testing" },
      { key: "technical", text: "Create or adapt the practical tools needed to deliver the service.", evidence: "Practical implementation" },
    ],
  },
  {
    id: "accuracy_pressure",
    prompt: "A deadline is close and mistakes could cause embarrassment. Which task would you prefer?",
    options: [
      { key: "communication", text: "Check that instructions are clear and everyone understands their part.", evidence: "Clarity under pressure" },
      { key: "digital", text: "Use a checklist, spreadsheet, or template to reduce mistakes.", evidence: "Digital accuracy systems" },
      { key: "entrepreneurship", text: "Decide what matters most and focus effort where it protects value.", evidence: "Prioritization" },
      { key: "technical", text: "Test the equipment, materials, or final product before submission.", evidence: "Quality control" },
    ],
  },
  {
    id: "learning_preference",
    prompt: "When learning a new vocational skill, which proof would you most enjoy producing?",
    options: [
      { key: "communication", text: "A short explanation, training guide, or demonstration for others.", evidence: "Teaching and explanation" },
      { key: "digital", text: "A digital portfolio, spreadsheet, website, design, or edited media sample.", evidence: "Digital portfolio evidence" },
      { key: "entrepreneurship", text: "A mini business plan showing customer, cost, price, and promotion.", evidence: "Business planning" },
      { key: "technical", text: "A repaired item, model, design sample, farm/garden task, or practical build.", evidence: "Trade/practical output" },
    ],
  },
];

function loadGuidanceState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("missing");
    const parsed = JSON.parse(raw) as {
      subjects?: { name: string; score: number; target?: number }[];
      academicHistory?: SemesterRecord[];
      applicationChecks?: boolean[];
      vocationalAnswers?: VocationalAnswer;
    };
    return {
      academicHistory:
        parsed.academicHistory?.length
          ? parsed.academicHistory
          : parsed.subjects?.length
            ? [{ id: "imported-current", label: "Current semester", subjects: parsed.subjects.map(({ name, score }) => ({ name, score })) }]
            : defaultAcademicHistory,
      applicationChecks: parsed.applicationChecks?.length ? parsed.applicationChecks : [],
      vocationalAnswers: parsed.vocationalAnswers ?? {},
    };
  } catch {
    return {
      academicHistory: defaultAcademicHistory,
      applicationChecks: [],
      vocationalAnswers: {},
    };
  }
}

function saveGuidanceState(state: ReturnType<typeof loadGuidanceState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save guidance state", error);
  }
}

function averageScore(subjects: SubjectGrade[]): number {
  if (!subjects.length) return 0;
  return Math.round(subjects.reduce((sum, row) => sum + row.score, 0) / subjects.length);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export default function GuidanceHubPage() {
  const { user } = useAuth();
  const journey = loadJourney();
  const profile = normalizeLearnerProfile(
    journey.learnerProfile !== "general" ? journey.learnerProfile : user?.learner_profile
  );
  const plan = stagePlans[profile];
  const initial = useMemo(() => loadGuidanceState(), []);
  const [academicHistory, setAcademicHistory] = useState<SemesterRecord[]>(initial.academicHistory);
  const [checks, setChecks] = useState<boolean[]>(
    initial.applicationChecks.length === plan.applicationItems.length
      ? initial.applicationChecks
      : plan.applicationItems.map(() => false)
  );
  const [vocationalAnswers, setVocationalAnswers] = useState<VocationalAnswer>(initial.vocationalAnswers);

  const currentSemester = academicHistory[academicHistory.length - 1] ?? defaultAcademicHistory[0];
  const previousSemester = academicHistory.length > 1 ? academicHistory[academicHistory.length - 2] : null;
  const currentAverage = averageScore(currentSemester.subjects);
  const previousAverage = previousSemester ? averageScore(previousSemester.subjects) : currentAverage;
  const semesterTrend = currentAverage - previousAverage;
  const longTrend = academicHistory.length > 1
    ? Math.round((currentAverage - averageScore(academicHistory[0].subjects)) / (academicHistory.length - 1))
    : 0;
  const predictedAverage = clampScore(Math.round(currentAverage + longTrend));
  const coreSubjects = currentSemester.subjects.filter((row) =>
    /math|english|science|social/i.test(row.name)
  );
  const coreMinimum = coreSubjects.length
    ? Math.min(...coreSubjects.map((row) => row.score))
    : Math.min(...currentSemester.subjects.map((row) => row.score));
  const weakSubjects = currentSemester.subjects.filter((row) => row.score < 60);
  const universityReadiness =
    predictedAverage >= 80 && coreMinimum >= 70
      ? "Strong university admission standing"
      : predictedAverage >= 70 && coreMinimum >= 60
        ? "Likely admission standing for many programmes"
        : predictedAverage >= 60
          ? "Developing standing; improve weak subjects and protect core passes"
          : "At-risk standing; urgent academic support is needed";
  const scholarshipReadiness =
    predictedAverage >= 85 && coreMinimum >= 75
      ? "Highly competitive for merit-based scholarships"
      : predictedAverage >= 75 && coreMinimum >= 65
        ? "Possible scholarship candidate with strong documents and activities"
        : predictedAverage >= 65
          ? "Limited scholarship competitiveness; target bursaries and improve grades"
          : "Not yet competitive for most scholarships";
  const trajectoryLabel =
    semesterTrend >= 5 ? "Improving" : semesterTrend <= -5 ? "Declining" : "Stable";
  const applicationPct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const vocationalScores = useMemo(() => {
    const scores: Record<SkillKey, number> = { communication: 0, digital: 0, entrepreneurship: 0, technical: 0 };
    Object.values(vocationalAnswers).forEach((key) => {
      scores[key] += 1;
    });
    return scores;
  }, [vocationalAnswers]);
  const completedVocational = Object.keys(vocationalAnswers).length;
  const strongestSkill = (Object.entries(vocationalScores) as [SkillKey, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
  const vocationalPct = Math.round((completedVocational / vocationalScenarios.length) * 100);
  const vocationalRecommendation =
    strongestSkill === "communication"
      ? "Consider people-facing routes such as teaching support, customer service, guidance support, community work, sales, or team leadership."
      : strongestSkill === "digital"
        ? "Consider digital and ICT routes such as data entry, design, coding basics, office technology, digital marketing, or media production."
        : strongestSkill === "entrepreneurship"
          ? "Consider enterprise routes such as small business, sales, procurement, marketing, operations, or self-employment."
          : "Consider practical or TVET routes such as engineering support, electricals, construction, fashion, agriculture, repair, or applied technical work.";

  function persistAcademicHistory(nextHistory: SemesterRecord[]) {
    setAcademicHistory(nextHistory);
    const latest = nextHistory[nextHistory.length - 1] ?? defaultAcademicHistory[0];
    const latestAverage = averageScore(latest.subjects);
    saveGuidanceState({ academicHistory: nextHistory, applicationChecks: checks, vocationalAnswers });
    completeTask("academic_progress_tracker", {
      method: "semester_history_prediction",
      semestersStored: nextHistory.length,
      subjectsInLatestSemester: latest.subjects.length,
      currentAverage: latestAverage,
      learnerProfile: profile,
    });
  }

  function updateSemesterLabel(semesterIndex: number, label: string) {
    persistAcademicHistory(
      academicHistory.map((semester, index) =>
        index === semesterIndex ? { ...semester, label } : semester
      )
    );
  }

  function updateSubject(semesterIndex: number, subjectIndex: number, field: keyof SubjectGrade, value: string) {
    persistAcademicHistory(
      academicHistory.map((semester, index) =>
        index === semesterIndex
          ? {
              ...semester,
              subjects: semester.subjects.map((subject, innerIndex) =>
                innerIndex === subjectIndex
                  ? { ...subject, [field]: field === "name" ? value : clampScore(Number(value) || 0) }
                  : subject
              ),
            }
          : semester
      )
    );
  }

  function addSubject(semesterIndex: number) {
    persistAcademicHistory(
      academicHistory.map((semester, index) =>
        index === semesterIndex
          ? { ...semester, subjects: [...semester.subjects, { name: "New subject", score: 0 }] }
          : semester
      )
    );
  }

  function addSemester() {
    const lastSubjects = currentSemester.subjects.map((subject) => ({ ...subject }));
    const nextSemester: SemesterRecord = {
      id: `semester-${Date.now()}`,
      label: `Semester ${academicHistory.length + 1}`,
      subjects: lastSubjects.length ? lastSubjects : defaultSubjects,
    };
    persistAcademicHistory([...academicHistory, nextSemester]);
  }

  function toggleCheck(index: number) {
    const next = checks.map((checked, i) => (i === index ? !checked : checked));
    setChecks(next);
    saveGuidanceState({ academicHistory, applicationChecks: next, vocationalAnswers });
    if (next.every(Boolean)) {
      completeTask("application_readiness", {
        completedItems: next.length,
        learnerProfile: profile,
      });
    }
  }

  function answerVocationalScenario(id: string, key: SkillKey) {
    const next = { ...vocationalAnswers, [id]: key };
    const nextScores: Record<SkillKey, number> = { communication: 0, digital: 0, entrepreneurship: 0, technical: 0 };
    Object.values(next).forEach((scoreKey) => {
      nextScores[scoreKey] += 1;
    });
    const nextStrongest = (Object.entries(nextScores) as [SkillKey, number][]).sort((a, b) => b[1] - a[1])[0][0];
    setVocationalAnswers(next);
    saveGuidanceState({ academicHistory, applicationChecks: checks, vocationalAnswers: next });
    if (Object.keys(next).length === vocationalScenarios.length) {
      completeTask("vocational_skill_assessment", {
        method: "scored_scenario_assessment",
        scenariosCompleted: vocationalScenarios.length,
        scoreBreakdown: nextScores,
        strongestSkill: skillLabels[nextStrongest],
        learnerProfile: profile,
      });
    }
  }

  function savePathPlan() {
    completeTask("career_path_mapping", {
      learnerProfile: profile,
      pathSteps: plan.pathSteps,
      userSaved: true,
    });
  }

  const coachPrompt = `Build a Guidance Department action plan for me. My current status is ${learnerProfileLabel(profile)}. Focus: ${plan.focus}. Current academic average: ${currentAverage}%. Predicted next average: ${predictedAverage}%. Academic trajectory: ${trajectoryLabel}. University readiness: ${universityReadiness}. Scholarship outlook: ${scholarshipReadiness}. Weak subjects: ${weakSubjects.map((subject) => `${subject.name} ${subject.score}%`).join(", ") || "none below 60%"}. Vocational scenario score: ${skillLabels[strongestSkill]} is currently strongest with ${vocationalScores[strongestSkill]} of ${vocationalScenarios.length} indicators completed. Application readiness: ${applicationPct}%. Give me a practical 30-day plan for academics, applications, career preparation, and wellbeing.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-6 pb-10"
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <GraduationCap className="h-4 w-4" />
              {learnerProfileLabel(profile)}
            </div>
            <h1 className="text-3xl font-bold text-white">{plan.headline}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{plan.focus}</p>
          </div>
          <Link
            to={`/chat?mode=Career%20Coach&prompt=${encodeURIComponent(coachPrompt)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Generate my 30-day plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Academic trajectory and opportunity predictor</h2>
              <p className="text-sm leading-6 text-slate-400">
                Store SHS subject grades semester by semester, then estimate university readiness,
                scholarship competitiveness, and priority subjects.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {academicHistory.map((semester, semesterIndex) => (
              <div key={semester.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <input
                    value={semester.label}
                    onChange={(event) => updateSemesterLabel(semesterIndex, event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none"
                    aria-label="Semester label"
                  />
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    Average {averageScore(semester.subjects)}%
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  {semester.subjects.map((row, subjectIndex) => (
                    <div key={`${semester.id}-${subjectIndex}`} className="grid gap-2 sm:grid-cols-[1fr_92px]">
                      <input
                        value={row.name}
                        onChange={(event) => updateSubject(semesterIndex, subjectIndex, "name", event.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-950/25 px-3 py-2 text-sm text-white outline-none"
                        aria-label="Subject name"
                      />
                      <input
                        type="number"
                        value={row.score}
                        onChange={(event) => updateSubject(semesterIndex, subjectIndex, "score", event.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-950/25 px-3 py-2 text-sm text-white outline-none"
                        aria-label="Subject score"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSubject(semesterIndex)}
                  className="mt-3 rounded-lg border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/10"
                >
                  Add subject
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSemester}
            className="mt-3 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            Add next semester
          </button>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Trajectory</p>
              <p className="mt-1 font-bold text-white">{trajectoryLabel}</p>
              <p className="mt-1 text-xs leading-5">
                Current average {currentAverage}%. Predicted next average {predictedAverage}%.
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">University admission</p>
              <p className="mt-1 font-bold text-white">{universityReadiness}</p>
              <p className="mt-1 text-xs leading-5">Core subject floor: {coreMinimum}%.</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Scholarship outlook</p>
              <p className="mt-1 font-bold text-white">{scholarshipReadiness}</p>
              <p className="mt-1 text-xs leading-5">Merit awards usually need strong grades plus leadership evidence.</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 p-3 text-rose-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">Priority subjects</p>
              <p className="mt-1 font-bold text-white">
                {weakSubjects.length ? weakSubjects.map((subject) => subject.name).join(", ") : "No subject below 60%"}
              </p>
              <p className="mt-1 text-xs leading-5">Use this to focus tutorials, study groups, and teacher feedback.</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Application readiness</h2>
              <p className="text-sm leading-6 text-slate-400">
                Prepare documents for university, scholarship, internship, NSS, work, or TVET routes.
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${applicationPct}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-amber-200">{applicationPct}% ready</p>
          <div className="mt-4 space-y-2">
            {plan.applicationItems.map((item, index) => (
              <label key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={checks[index]}
                  onChange={() => toggleCheck(index)}
                  className="h-4 w-4 accent-amber-500"
                />
                {item}
              </label>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Career path mapping</h2>
              <p className="text-sm leading-6 text-slate-400">
                Convert your current stage into a clear academic, university, employment, or self-employment route.
              </p>
            </div>
          </div>
          <ol className="mt-4 space-y-3">
            {plan.pathSteps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-300 text-xs font-bold text-slate-950">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={savePathPlan}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-300/40 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/10"
          >
            <Save className="h-4 w-4" />
            Save path map
          </button>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
              <Hammer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Vocational skill assessment</h2>
              <p className="text-sm leading-6 text-slate-400">
                Answer work-like scenarios. Scores come from choices and completion, not self-rating.
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${vocationalPct}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-emerald-200">
            {completedVocational} of {vocationalScenarios.length} scenarios completed
          </p>
          <div className="mt-4 space-y-4">
            {vocationalScenarios.map((scenario, index) => (
              <div key={scenario.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Scenario {index + 1}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{scenario.prompt}</p>
                <div className="mt-3 grid gap-2">
                  {scenario.options.map((option) => {
                    const active = vocationalAnswers[scenario.id] === option.key;
                    return (
                      <button
                        key={`${scenario.id}-${option.key}`}
                        type="button"
                        onClick={() => answerVocationalScenario(scenario.id, option.key)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs leading-5 transition ${
                          active
                            ? "border-emerald-300 bg-emerald-300 text-slate-950"
                            : "border-white/10 bg-slate-950/25 text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        <span className="font-bold">{skillLabels[option.key]}:</span> {option.text}
                        <span className="mt-1 block opacity-80">Evidence: {option.evidence}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-100">
            Current strongest evidence: <span className="font-bold">{skillLabels[strongestSkill]}</span>{" "}
            ({vocationalScores[strongestSkill]} scenario{vocationalScores[strongestSkill] === 1 ? "" : "s"}).{" "}
            {completedVocational === vocationalScenarios.length
              ? vocationalRecommendation
              : "Complete all scenarios before treating this as an assessment result."}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Recommended next tools</h2>
              <p className="text-sm leading-6 text-slate-400">
                The interface adapts from your current status, but all major tools stay available when you need them.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/career-path" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">
              Career paths <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/cv-tools/cv-builder" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950">
              CV tools <BriefcaseBusiness className="h-4 w-4" />
            </Link>
            <Link to="/interview-prep" className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">
              Interview prep <CheckCircle2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
