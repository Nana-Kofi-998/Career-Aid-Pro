import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  GraduationCap,
  Heart,
  MessageCircle,
  Mic,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { JuniorExplorersProvider } from "../context/JuniorExplorersContext";
import type { ChatMode, ChatSummary, DashboardStats } from "../types";
import { modeLabel } from "../utils/format";
import { completeTask, isTaskCompleted, journeyCompletion, loadJourney, type JourneyState } from "../utils/productJourney";
import { learnerProfileLabel, normalizeLearnerProfile } from "../utils/productJourney";
import JuniorExplorersPage from "./JuniorExplorers";

const modes: {
  mode: ChatMode;
  label: string;
  icon: typeof Briefcase;
  gradient: string;
  glowColor: string;
  desc: string;
}[] = [
  {
    mode: "Career Coach",
    label: "Career Coach",
    icon: Briefcase,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    glowColor: "rgba(16, 185, 129, 0.15)",
    desc: "CV scoring, Jobberman tips & interview prep",
  },
  {
    mode: "Mental Health",
    label: "Mental Wellness",
    icon: Heart,
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    glowColor: "rgba(244, 63, 94, 0.15)",
    desc: "Support tuned to your temperament profile",
  },
  {
    mode: "free",
    label: "Open Chat",
    icon: MessageCircle,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    glowColor: "rgba(139, 92, 246, 0.15)",
    desc: "General Q&A with optional live web search",
  },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = { 
  hidden: { opacity: 0, y: 30, scale: 0.95 }, 
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } } 
};

const careerActionPlan = [
  {
    title: "SHS Guidance",
    detail: "Connect interests, strengths, subjects, and SHS tracks to future university and career options.",
    to: "/chat?mode=Career%20Coach&prompt=Help%20me%20choose%20SHS%20subjects%20based%20on%20my%20interests",
    icon: BookOpen,
  },
  {
    title: "After SHS",
    detail: "Compare university, TVET, national service preparation, entrepreneurship, and entry-level work routes.",
    to: "/career-path",
    icon: GraduationCap,
  },
  {
    title: "Scholarships",
    detail: "Build a checklist for grades, essays, references, deadlines, documents, and interview preparation.",
    to: "/chat?mode=Career%20Coach&prompt=Help%20me%20create%20a%20scholarship%20readiness%20plan",
    icon: Award,
  },
  {
    title: "Work Readiness",
    detail: "Improve CVs, practise interviews, and plan applications when employment becomes the right next step.",
    to: "/chat?mode=Career%20Coach",
    icon: Briefcase,
  },
];

const segmentGuidance: Record<string, { title: string; detail: string; to: string; icon: typeof BookOpen }[]> = {
  shs_student: [
    {
      title: "Academic Trajectory",
      detail: "Store SHS grades by semester and predict university admission and scholarship readiness.",
      to: "/guidance",
      icon: BookOpen,
    },
    {
      title: "Subject to Career Map",
      detail: "Connect SHS subjects and tracks to university programmes and realistic career routes.",
      to: "/career-path",
      icon: Compass,
    },
    {
      title: "Counsellor Questions",
      detail: "Get direct guidance first, then identify the school-specific facts to confirm later.",
      to: "/guidance",
      icon: MessageCircle,
    },
  ],
  shs_graduate_transition: [
    {
      title: "Application Planner",
      detail: "Prepare result slips, statements, deadlines, recommendations, and scholarship evidence.",
      to: "/guidance",
      icon: Award,
    },
    {
      title: "University or Work Route",
      detail: "Compare university, TVET, apprenticeship, employment, and self-employment options.",
      to: "/career-path",
      icon: GraduationCap,
    },
    {
      title: "Starter CV",
      detail: "Turn school activities, volunteering, projects, and leadership into employability evidence.",
      to: "/cv-tools/cv-builder",
      icon: FileText,
    },
  ],
  university_workforce: [
    {
      title: "Internship and NSS Plan",
      detail: "Map coursework, projects, internships, NSS, and portfolio evidence toward target roles.",
      to: "/guidance",
      icon: Briefcase,
    },
    {
      title: "Graduate CV",
      detail: "Improve your CV with projects, leadership, technical tools, and measurable outcomes.",
      to: "/cv-tools/cv-builder",
      icon: FileText,
    },
    {
      title: "Interview Practice",
      detail: "Practise STAR answers for internships, scholarships, NSS placements, and graduate jobs.",
      to: "/interview-prep",
      icon: Mic,
    },
  ],
  general: careerActionPlan.slice(0, 3),
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Age-based routing for AAD system - redirect kids to Junior Explorers
  if (user && user.age < 13) {
    return (
      <JuniorExplorersProvider age={user.age}>
        <JuniorExplorersContent />
      </JuniorExplorersProvider>
    );
  }

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentChats, setRecentChats] = useState<ChatSummary[]>([]);
  const [hasPersonality, setHasPersonality] = useState<boolean | null>(null);
  const [temperament, setTemperament] = useState("");
  const [mounted, setMounted] = useState(false);
  const [journey, setJourney] = useState<JourneyState>(() => loadJourney());

  useEffect(() => {
    setMounted(true);
    setJourney(loadJourney());
    api.dashboard().then(setStats).catch(console.error);
    api.listChats().then((c) => setRecentChats(c.slice(0, 4))).catch(console.error);
    api.personalityProfile().then((r) => {
      setHasPersonality(r.has_profile);
      if (r.has_profile) {
        completeTask("personality_test", {
          profileGenerated: true,
          profileSaved: true,
          restoredFromSavedProfile: true,
        });
        setJourney(loadJourney());
      }
      const p = r.profile as { temperament?: string } | null;
      if (p?.temperament) setTemperament(p.temperament);
    });
  }, []);

  const firstName = user?.first_name || user?.username || "there";
  const learnerProfile = normalizeLearnerProfile(
    journey.learnerProfile !== "general" ? journey.learnerProfile : user?.learner_profile
  );
  const segmentCards = segmentGuidance[learnerProfile] ?? segmentGuidance.general;
  const today = new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const activity = useMemo(() => {
    const rows: { icon: typeof MessageCircle; title: string; meta: string; time: string }[] = [];
    if (recentChats[0]) {
      rows.push({
        icon: MessageCircle,
        title: recentChats[0].title || modeLabel(recentChats[0].mode),
        meta: modeLabel(recentChats[0].mode),
        time: "Latest thread",
      });
    }
    if ((stats?.cv_scores ?? 0) > 0) {
      rows.push({
        icon: FileText,
        title: "CV analysis saved",
        meta: `${stats?.cv_scores} score${stats?.cv_scores === 1 ? "" : "s"} on record`,
        time: "Career Coach",
      });
    }
    if (hasPersonality && temperament) {
      rows.push({
        icon: Sparkles,
        title: `Temperament: ${temperament}`,
        meta: "Personalization active",
        time: "Profile",
      });
    }
    if (rows.length < 3) {
      rows.push({
        icon: Briefcase,
        title: "Explore Ghana job boards",
        meta: "Ask Career Coach about Jobberman & LinkedIn",
        time: "Suggested",
      });
    }
    return rows.slice(0, 4);
  }, [recentChats, stats, hasPersonality, temperament]);

  const engagementPct = Math.min(
    100,
    Math.round(((stats?.total_chats ?? 0) * 18 + (stats?.cv_scores ?? 0) * 12) / 2) || 24
  );
  const journeyPct = journeyCompletion(journey, !!hasPersonality, stats?.cv_scores ?? 0);
  const nextSteps = [
    {
      done: isTaskCompleted(journey, "goals_set") && journey.onboardingComplete,
      label: "Set goals",
      to: "/onboarding",
    },
    {
      done: isTaskCompleted(journey, "personality_test") && !!hasPersonality,
      label: "Complete personality",
      to: "/personality",
    },
    {
      done: isTaskCompleted(journey, "cv_analysis") && ((stats?.cv_scores ?? 0) > 0 || typeof journey.lastCvScore === "number"),
      label: "Analyze CV",
      to: "/cv-tools/cv-analyzer",
    },
    {
      done: isTaskCompleted(journey, "interview_practice") && journey.interviewSessions > 0,
      label: "Practice interview",
      to: "/interview-prep",
    },
  ];

  if (!mounted) return null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl pb-8 space-y-6"
    >
      {/* Hero Section */}
      <motion.section variants={item} className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-900/40 via-slate-900/40 to-violet-900/40 backdrop-blur-xl p-8 md:p-12">
        {/* Animated background orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 backdrop-blur-sm">
              <Calendar className="h-4 w-4" />
              {today}
            </span>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm backdrop-blur-sm ${stats?.ai_service_online ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
              <span className={`w-2 h-2 rounded-full ${stats?.ai_service_online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-300'}`} />
              {stats?.ai_service_online ? 'AI Service Ready' : 'AI Service Updating'}
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 backdrop-blur-sm">
              🔒 Secure Access
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-sm font-semibold text-cyan-300 backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              {learnerProfileLabel(learnerProfile)}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome back, <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mb-8 leading-relaxed">
            Your Guidance Department workspace for academic progress, university preparation, career readiness, and wellbeing.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link 
              to="/guidance" 
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              Open Guidance Hub
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link 
              to="/onboarding" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5"
            >
              Guided Setup
            </Link>
          </div>

          {/* Stats Preview */}
          <div className="mt-10 flex flex-wrap gap-6">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Conversations</p>
                <p className="text-lg font-bold text-white">{stats?.total_chats ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <FileText className="h-5 w-5 text-violet-400" />
              <div>
                <p className="text-xs text-slate-400">CV Analyses</p>
                <p className="text-lg font-bold text-white">{stats?.cv_scores ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={item} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-300">Career journey</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{journeyPct}% complete</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your tools now connect into one path: goals, personality, CV, interview practice, and career direction.
              </p>
            </div>
            <Link
              to="/guidance"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              <Compass className="h-4 w-4" />
              Open Guidance Hub
            </Link>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${journeyPct}%` }} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {nextSteps.map((step) => (
              <Link
                key={step.label}
                to={step.to}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition hover:bg-white/10"
              >
                <CheckCircle2 className={`mb-2 h-4 w-4 ${step.done ? "text-emerald-400" : "text-slate-500"}`} />
                <p className="font-semibold text-white">{step.label}</p>
                <p className="mt-1 text-xs text-slate-500">{step.done ? "Done" : "Next step"}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-300">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Interview readiness</h2>
              <p className="text-sm text-slate-400">{journey.interviewSessions} practice session{journey.interviewSessions === 1 ? "" : "s"} recorded</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Use STAR feedback to improve clarity, confidence, evidence, and role relevance before a real interview.
          </p>
          <Link
            to="/interview-prep"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Start mock interview
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section variants={item} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-300">Why Career-Aid Pro</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Your education and career guidance plan</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Built for SHS students, SHS graduates, and university students who need practical support when counsellor access is limited.
            </p>
          </div>
          <Link
            to="/career-path"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
          >
            Open path view
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {segmentCards.map((step) => (
            <Link
              key={step.title}
              to={step.to}
              className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30 hover:bg-white/10"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-sm font-bold text-cyan-200">
                <step.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Engagement Score */}
        <motion.section variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Workspace Health</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{engagementPct}%</span>
                <span className="text-sm text-emerald-400">engagement</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Based on chats & CV activity</p>
            </div>
            <div className="relative">
              <svg viewBox="0 0 100 100" className="w-24 h-24">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="url(#engagementGradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeDasharray={`${engagementPct * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="engagementGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Conversations */}
        <motion.section variants={item} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 group hover:border-emerald-500/30 transition-colors duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">+3 this week</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats?.total_chats ?? 0}</p>
          <p className="text-sm text-slate-400">Conversations</p>
        </motion.section>

        {/* CV Analyses */}
        <motion.section variants={item} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 group hover:border-violet-500/30 transition-colors duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <FileText className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full">On record</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats?.cv_scores ?? 0}</p>
          <p className="text-sm text-slate-400">CV Analyses</p>
        </motion.section>

        {/* AI Status */}
        <motion.section variants={item} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 group hover:border-cyan-500/30 transition-colors duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-xl bg-cyan-500/10">
              <Zap className={`h-5 w-5 ${stats?.ai_service_online ? 'text-cyan-400' : 'text-slate-500'}`} />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${stats?.ai_service_online ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 bg-slate-500/10'}`}>
              {stats?.ai_service_online ? 'Live' : 'Updating'}
            </span>
          </div>
          <p className="text-lg font-bold text-white mb-1">{stats?.ai_service_online ? 'Ready' : 'Updating'}</p>
          <p className="text-sm text-slate-400">AI Engine</p>
        </motion.section>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <motion.section variants={item} className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <p className="text-sm text-slate-400">Your latest updates and interactions</p>
            </div>
            <Link to="/chat" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {activity.map((a, i) => (
              <motion.div 
                key={a.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-200 cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-colors">
                  <a.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{a.title}</p>
                  <p className="text-sm text-slate-400">{a.meta}</p>
                </div>
                <span className="text-xs text-slate-500 px-3 py-1 rounded-full bg-white/5">{a.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section variants={item} className="space-y-4">
          {/* Temperament Card */}
          {hasPersonality === false && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6">
              <Sparkles className="h-8 w-8 text-white/80 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Unlock Personalization</h3>
              <p className="text-sm text-emerald-100/80 mb-4">
                Complete the temperament assessment to get personalized career and wellness guidance.
              </p>
              <Link
                to="/personality"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
              >
                Start Assessment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {hasPersonality && temperament && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-slate-400">Temperament</span>
              </div>
              <p className="text-2xl font-bold text-white mb-4">{temperament}</p>
              <Link to="/personality" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                View full profile →
              </Link>
            </div>
          )}

          {/* CV Builder Card */}
            <Link 
              to="/cv-tools/cv-builder" 
              className="group block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
              <h3 className="font-bold text-white">CV Builder</h3>
                <p className="text-sm text-slate-400">AI-powered CV creation</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
          </Link>
        </motion.section>
      </div>

      {/* Mode Selector */}
      <motion.section variants={item} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Choose Your Mode</h2>
          <p className="text-sm text-slate-400">Select a coaching mode to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map(({ mode, label, icon: Icon, gradient, glowColor, desc }) => (
            <button
              key={mode}
              type="button"
              onClick={() => navigate(`/chat?mode=${encodeURIComponent(mode)}`)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-6 text-left hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${gradient})`,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px ${glowColor}`
              }}
            >
              <div className="relative z-10">
                <div className="inline-flex p-3 rounded-xl bg-white/10 backdrop-blur-sm mb-4 group-hover:bg-white/20 transition-colors">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{label}</h3>
                <p className="text-sm text-slate-300">{desc}</p>
              </div>
              
              {/* Hover glow effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ 
                  background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)`
                }}
              />
            </button>
          ))}
        </div>
      </motion.section>

      {/* Recent Chats */}
      <motion.section variants={item} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Chats</h2>
            <p className="text-sm text-slate-400">Continue where you left off</p>
          </div>
          <Link to="/chat" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            View all →
          </Link>
        </div>

        {recentChats.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No conversations yet</p>
            <p className="text-sm text-slate-500 mt-1">Start your first session above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentChats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/chat?id=${c.id}`)}
                className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-200 text-left"
              >
                <div className="p-2 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{c.title || "Untitled chat"}</p>
                  <p className="text-sm text-slate-400">{modeLabel(c.mode)}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

function JuniorExplorersContent() {
  const [activeTile, setActiveTile] = useState<string | null>(null);
  return <JuniorExplorersPage activeTile={activeTile} setActiveTile={setActiveTile} />;
}
