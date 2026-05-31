import type { CvAnalysis } from "../types";

export type CareerGoal =
  | "Build my CV"
  | "Find a career path"
  | "Prepare for interviews"
  | "Explore my strengths"
  | "Improve wellbeing";

export type LearnerProfile =
  | "shs_student"
  | "shs_graduate_transition"
  | "university_workforce"
  | "general";

export const learnerProfileOptions: { value: LearnerProfile; label: string; detail: string }[] = [
  {
    value: "shs_student",
    label: "SHS student",
    detail: "Academic progress, subject choices, WASSCE readiness, and early career exploration.",
  },
  {
    value: "shs_graduate_transition",
    label: "SHS graduate preparing for university or work",
    detail: "University applications, TVET/work options, scholarships, CV, and transition planning.",
  },
  {
    value: "university_workforce",
    label: "University student preparing for work",
    detail: "Internships, portfolio, NSS, graduate jobs, interviews, and employability evidence.",
  },
  {
    value: "general",
    label: "Other learner or career explorer",
    detail: "A flexible guidance workspace with all core planning tools available.",
  },
];

export function normalizeLearnerProfile(value?: string | null): LearnerProfile {
  if (value === "shs_graduate_higher_ed" || value === "shs_graduate_workforce") {
    return "shs_graduate_transition";
  }
  if (value === "shs_student" || value === "shs_graduate_transition" || value === "university_workforce") {
    return value;
  }
  return "general";
}

export function learnerProfileLabel(value?: string | null): string {
  const normalized = normalizeLearnerProfile(value);
  return learnerProfileOptions.find((item) => item.value === normalized)?.label ?? "Career explorer";
}

export interface JourneyState {
  onboardingComplete: boolean;
  goals: CareerGoal[];
  preferredRole: string;
  educationLevel: string;
  learnerProfile: LearnerProfile;
  confidence: number;
  lastCvScore?: number;
  interviewSessions: number;
  helpfulVotes: number;
  childBadges: string[];
  taskProgress: Record<string, TaskProgress>;
}

const KEY = "career_aid_journey";

export type TaskStatus = "not_started" | "exploring" | "in_progress" | "completed";

export interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
  completionEvidence?: Record<string, unknown>;
}

export const defaultJourneyState: JourneyState = {
  onboardingComplete: false,
  goals: [],
  preferredRole: "",
  educationLevel: "",
  learnerProfile: "general",
  confidence: 3,
  interviewSessions: 0,
  helpfulVotes: 0,
  childBadges: [],
  taskProgress: {},
};

export function loadJourney(): JourneyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultJourneyState };
    return { ...defaultJourneyState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultJourneyState };
  }
}

export function saveJourney(next: JourneyState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("career-aid-journey-updated"));
  } catch (error) {
    console.error("Could not save journey progress", error);
  }
}

export function patchJourney(patch: Partial<JourneyState>): JourneyState {
  const next = { ...loadJourney(), ...patch };
  saveJourney(next);
  return next;
}

export function setTaskStatus(
  taskId: string,
  status: TaskStatus,
  completionEvidence?: Record<string, unknown>
): JourneyState {
  const current = loadJourney();
  const existing = current.taskProgress[taskId];
  const now = new Date().toISOString();
  return patchJourney({
    taskProgress: {
      ...current.taskProgress,
      [taskId]: {
        taskId,
        status,
        startedAt: existing?.startedAt ?? now,
        completedAt: status === "completed" ? now : existing?.completedAt,
        completionEvidence: status === "completed" ? completionEvidence : existing?.completionEvidence,
      },
    },
  });
}

export function completeTask(taskId: string, completionEvidence: Record<string, unknown>): JourneyState {
  return setTaskStatus(taskId, "completed", completionEvidence);
}

export function isTaskCompleted(state: JourneyState, taskId: string): boolean {
  return state.taskProgress[taskId]?.status === "completed";
}

export function addChildBadge(badge: string, completionEvidence: Record<string, unknown>): JourneyState {
  const current = loadJourney();
  if (current.childBadges.includes(badge)) return current;
  patchJourney({ childBadges: [...current.childBadges, badge] });
  return completeTask(`child_badge_${badge.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, {
    badge,
    awardedAfterCompletion: true,
    ...completionEvidence,
  });
}

export function recordCvScore(score: number) {
  patchJourney({ lastCvScore: score });
  completeTask("cv_analysis", {
    uploadedFile: true,
    analysisGenerated: true,
    score,
  });
}

export function recordInterviewSession() {
  const current = loadJourney();
  patchJourney({ interviewSessions: current.interviewSessions + 1 });
  completeTask("interview_practice", {
    requiredReviewedAnswers: 3,
    reviewedAnswers: 3,
    feedbackGenerated: true,
  });
}

export function journeyCompletion(state: JourneyState, hasPersonality: boolean, cvScores: number): number {
  const checks = [
    isTaskCompleted(state, "onboarding") && state.onboardingComplete && state.goals.length > 0,
    isTaskCompleted(state, "goals_set") && state.goals.length > 0,
    isTaskCompleted(state, "personality_test") && hasPersonality,
    isTaskCompleted(state, "cv_analysis") && (cvScores > 0 || typeof state.lastCvScore === "number"),
    isTaskCompleted(state, "interview_practice") && state.interviewSessions > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function explainCvScore(analysis: CvAnalysis) {
  const items = Object.entries(analysis.breakdown).map(([section, score]) => {
    const maxBySection: Record<string, number> = {
      "Contact Information": 10,
      Education: 15,
      "Work Experience": 25,
      Skills: 20,
      Formatting: 15,
      "Professional Links": 10,
      "Action Verbs": 5,
    };
    const max = maxBySection[section] ?? Math.max(score, 10);
    const pct = max ? score / max : 0;
    const status = pct >= 0.8 ? "Strong" : pct >= 0.5 ? "Developing" : "Needs work";
    const adviceBySection: Record<string, string> = {
      "Contact Information": "Include a clear email, phone number, LinkedIn, and location near the top of the CV.",
      Education: "Name the institution, qualification, dates, relevant coursework, and strong academic achievements.",
      "Work Experience": "Turn duties into measurable outcomes using numbers, scope, tools, and impact.",
      Skills: "Group technical and soft skills, then make sure the strongest ones also appear in your experience section.",
      Formatting: "Keep sections easy to scan, avoid long paragraphs, and keep the CV focused on the target role.",
      "Professional Links": "Add LinkedIn, portfolio, GitHub, or project links when they support the role.",
      "Action Verbs": "Start bullets with verbs such as developed, improved, led, designed, supported, or analyzed.",
    };
    return {
      section,
      score,
      max,
      status,
      advice: adviceBySection[section] ?? "Add clearer evidence and make this section easier to assess.",
    };
  });

  const priorities = [...items]
    .sort((a, b) => a.score / a.max - b.score / b.max)
    .slice(0, 3);

  return { items, priorities };
}

export function careerRecommendations(state: JourneyState, temperament?: string) {
  const text = `${state.goals.join(" ")} ${state.preferredRole} ${temperament ?? ""}`.toLowerCase();
  const analytical = /data|tech|software|analyst|research|careful|thinker|ict|engineer/.test(text);
  const people = /support|health|teacher|coach|communication|wellbeing|creative explorer|curious/.test(text);
  const business = /business|finance|account|marketing|sales|manager|cv|interview/.test(text);

  if (analytical) {
    return [
      "Data Analyst",
      "Software Tester",
      "ICT Support Specialist",
      "Research Assistant",
    ];
  }
  if (people) {
    return [
      "Guidance Support Assistant",
      "Teacher/Tutor",
      "Customer Success Associate",
      "Community Outreach Officer",
    ];
  }
  if (business) {
    return [
      "Administrative Assistant",
      "Marketing Associate",
      "Accounting Assistant",
      "Operations Coordinator",
    ];
  }
  return [
    "Career Explorer",
    "Project Assistant",
    "Junior Analyst",
    "Operations Support",
  ];
}
