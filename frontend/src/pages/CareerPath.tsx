import { motion } from "framer-motion";
import { ArrowRight, Award, BookOpen, Briefcase, CheckCircle2, ClipboardList, Compass, GraduationCap, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { careerRecommendations, completeTask, loadJourney } from "../utils/productJourney";

function parseTemperament(summary: string) {
  try {
    const parsed = JSON.parse(summary);
    return parsed.temperament || parsed.profile || "";
  } catch {
    return summary.replace("KidProfile:", "");
  }
}

const guidanceTracks = [
  {
    title: "SHS Subject and Track Guidance",
    audience: "Senior High School students",
    icon: BookOpen,
    points: [
      "Connect interests and strengths to General Arts, Business, Science, Visual Arts, TVET, or technical paths.",
      "Get direct guidance, then identify the school-specific details that may need confirmation.",
      "Understand how subject choices affect university programmes and future work options.",
    ],
  },
  {
    title: "After SHS Transition",
    audience: "SHS graduates",
    icon: GraduationCap,
    points: [
      "Compare university, TVET, apprenticeship, entrepreneurship, NSS preparation, and entry-level work.",
      "Build a practical timeline for applications, documents, references, and fees.",
      "Create a starter CV even without formal work experience.",
    ],
  },
  {
    title: "Scholarship Readiness",
    audience: "SHS graduates and university students",
    icon: Award,
    points: [
      "Track scholarship deadlines, essays, transcripts, recommendation letters, and interview preparation.",
      "Turn school activities, volunteering, leadership, and projects into strong evidence.",
      "Use Career Coach to draft and refine personal statements.",
    ],
  },
  {
    title: "University to Work",
    audience: "University students",
    icon: Briefcase,
    points: [
      "Plan internships, NSS, portfolios, research projects, and industry networking.",
      "Translate coursework and group projects into CV-ready achievements.",
      "Practise interviews for internships, graduate roles, and scholarships.",
    ],
  },
];

const pathwayOptions = [
  {
    id: "shs",
    label: "I am in SHS",
    recommendation: "Focus on subject fit, grade improvement, and early programme awareness.",
    actions: ["List your strongest subjects", "Compare at least two SHS tracks", "Confirm school-specific entry requirements"],
  },
  {
    id: "graduate",
    label: "I completed SHS",
    recommendation: "Build a transition plan across university, TVET, apprenticeship, entrepreneurship, or work.",
    actions: ["Gather WASSCE/results documents", "Shortlist three programmes or routes", "Create a deadline and fee checklist"],
  },
  {
    id: "university",
    label: "I am in university",
    recommendation: "Turn coursework, projects, volunteering, and internships into evidence for future opportunities.",
    actions: ["Choose one portfolio project", "Find one internship/NSS path", "Update your CV with academic projects"],
  },
  {
    id: "work",
    label: "I am ready for work",
    recommendation: "Move into CV targeting, interview practice, and job-search routines.",
    actions: ["Analyze your CV", "Practise three interview answers", "Create a weekly application tracker"],
  },
];

const scholarshipItems = [
  "Current transcript or result slip",
  "Personal statement draft",
  "Recommendation letter request",
  "Leadership, volunteering, or project evidence",
  "Valid ID and contact details",
  "Deadline and eligibility notes",
];

const guidanceReviewQuestions = [
  "Which subjects or courses best match my strengths and goals?",
  "What entry requirements should I protect myself against missing?",
  "What backup pathway should I prepare if my first choice does not work?",
  "Which scholarships, bursaries, or school-based opportunities should I track?",
  "What should I do in the next 30 days to become more ready?",
];

const shsInterests = [
  "Helping people",
  "Technology",
  "Business",
  "Science and health",
  "Creative arts",
  "Building or fixing things",
  "Public speaking",
  "Numbers and analysis",
];

const shsSubjects = [
  "Mathematics",
  "English",
  "Integrated Science",
  "Social Studies",
  "ICT",
  "Economics",
  "Business Management",
  "Biology",
  "Chemistry",
  "Physics",
  "Visual Arts",
  "Technical Drawing",
];

const shsTracks = [
  {
    name: "General Science",
    matches: ["Science and health", "Technology", "Numbers and analysis", "Mathematics", "Integrated Science", "Biology", "Chemistry", "Physics"],
    programmes: ["Medicine", "Nursing", "Engineering", "Computer Science", "Laboratory Technology"],
    watch: "Protect strong grades in Maths, Science, and English because many competitive programmes screen heavily on them.",
  },
  {
    name: "Business",
    matches: ["Business", "Numbers and analysis", "Public speaking", "Mathematics", "Economics", "Business Management", "English"],
    programmes: ["Accounting", "Banking and Finance", "Marketing", "Business Administration", "Procurement"],
    watch: "Build confidence with Maths, communication, spreadsheets, and basic entrepreneurship evidence.",
  },
  {
    name: "General Arts",
    matches: ["Helping people", "Public speaking", "Creative arts", "English", "Social Studies"],
    programmes: ["Law", "Education", "Communication Studies", "Political Science", "Psychology"],
    watch: "Strengthen reading, writing, public speaking, and evidence of leadership or service.",
  },
  {
    name: "Visual Arts",
    matches: ["Creative arts", "Building or fixing things", "Visual Arts", "English"],
    programmes: ["Graphic Design", "Architecture pathways", "Animation", "Fashion", "Industrial Art"],
    watch: "Start a portfolio early with drawings, designs, process notes, and finished pieces.",
  },
  {
    name: "TVET / Technical",
    matches: ["Building or fixing things", "Technology", "Technical Drawing", "ICT", "Mathematics"],
    programmes: ["Electricals", "Construction", "Automotive", "ICT", "Applied Engineering"],
    watch: "Collect practical project evidence and ask about certification, apprenticeship, and progression routes.",
  },
];

export default function CareerPathPage() {
  const { user } = useAuth();
  const journey = loadJourney();
  const temperament = parseTemperament(user?.personality_summary || "");
  const roles = careerRecommendations(journey, temperament);
  const [selectedPathway, setSelectedPathway] = useState(pathwayOptions[0].id);
  const [scholarshipChecks, setScholarshipChecks] = useState<boolean[]>(
    () => scholarshipItems.map(() => false)
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Technology"]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Mathematics", "ICT"]);
  const [studentConcern, setStudentConcern] = useState("");
  const activePathway = pathwayOptions.find((item) => item.id === selectedPathway) ?? pathwayOptions[0];
  const scholarshipPct = Math.round((scholarshipChecks.filter(Boolean).length / scholarshipItems.length) * 100);
  const shsMatches = useMemo(() => {
    const selected = new Set([...selectedInterests, ...selectedSubjects]);
    return shsTracks
      .map((track) => ({
        ...track,
        score: track.matches.reduce((total, item) => total + (selected.has(item) ? 1 : 0), 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [selectedInterests, selectedSubjects]);
  const guidanceNote = useMemo(() => {
    const concern = studentConcern.trim() || "I need guidance on my next education or career step.";
    return [
      `Main concern: ${concern}`,
      `Current stage: ${activePathway.label}`,
      `Suggested focus: ${activePathway.recommendation}`,
      "Guidance points Career-Aid Pro should answer:",
      ...guidanceReviewQuestions.map((question, index) => `${index + 1}. ${question}`),
      "School-specific details to confirm later: exact subjects offered, current admission cut-offs, fees, deadlines, and available clubs/internships.",
    ].join("\n");
  }, [activePathway.label, activePathway.recommendation, studentConcern]);

  function toggleScholarshipItem(index: number) {
    setScholarshipChecks((current) => {
      const next = current.map((checked, i) => (i === index ? !checked : checked));
      if (next.every(Boolean)) {
        completeTask("scholarship_readiness", {
          checklistCompleted: true,
          itemCount: scholarshipItems.length,
        });
      }
      return next;
    });
  }

  function savePathway() {
    completeTask("education_pathway_plan", {
      selectedStage: activePathway.label,
      recommendation: activePathway.recommendation,
    });
  }

  function toggleChoice(value: string, selected: string[], setSelected: (next: string[]) => void) {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    setSelected(next);
    completeTask("shs_track_matcher_used", {
      selectedInterests: shsInterests.includes(value),
      hasSelections: next.length > 0,
    });
  }

  const topShsMatch = shsMatches[0];
  const shsCoachPrompt = `I am exploring SHS subject and track choices. My interests are: ${selectedInterests.join(", ") || "not selected"}. My strong subjects are: ${selectedSubjects.join(", ") || "not selected"}. My top suggested track is ${topShsMatch?.name || "not clear"}. Act as my Guidance and Counselling department: compare this track with two realistic alternatives, explain likely university, TVET, apprenticeship, employment, and self-employment pathways, recommend the best next steps, and list only the school-specific details I may need to confirm later. Give the guidance directly instead of redirecting me elsewhere as the main advice.`;
  const pathwayCoachPrompt = `Help me build a realistic education and career pathway plan. My current stage is: ${activePathway.label}. Suggested focus: ${activePathway.recommendation}. Turn this into a 30-day action plan with documents to prepare, people to speak with, and backup options.`;
  const scholarshipCoachPrompt = `Help me create a scholarship readiness plan. Completed items: ${scholarshipItems.filter((_, index) => scholarshipChecks[index]).join(", ") || "none yet"}. Missing items: ${scholarshipItems.filter((_, index) => !scholarshipChecks[index]).join(", ") || "none"}. Give me a practical checklist, personal statement outline, and interview preparation steps.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-6 pb-10"
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Compass className="h-4 w-4" />
              Career path finder
            </div>
            <h1 className="text-3xl font-bold text-white">Recommended directions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Guidance for SHS students, SHS graduates, university students, and job seekers. Use these tracks as starting points, then refine with the Career Coach.
            </p>
          </div>
          <Link
            to="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Open Career Coach
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-cyan-400/15 p-3 text-cyan-200">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">High-impact SHS tool</p>
            <h2 className="mt-1 text-lg font-semibold text-white">SHS subject and track matcher</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Select interests and strong subjects to generate practical SHS track options, likely tertiary pathways, and school-specific details to verify.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-white">Interests</p>
            <div className="flex flex-wrap gap-2">
              {shsInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleChoice(interest, selectedInterests, setSelectedInterests)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedInterests.includes(interest)
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : "border-white/10 bg-slate-950/30 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-white">Strong subjects</p>
            <div className="flex flex-wrap gap-2">
              {shsSubjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleChoice(subject, selectedSubjects, setSelectedSubjects)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedSubjects.includes(subject)
                      ? "border-emerald-300 bg-emerald-300 text-slate-950"
                      : "border-white/10 bg-slate-950/30 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {shsMatches.map((track, index) => (
            <article key={track.name} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-white">{track.name}</h3>
                <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-bold text-slate-950">
                  Match {index + 1}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cyan-200">Can lead to</p>
              <p className="mt-1 text-sm leading-6 text-slate-200">{track.programmes.join(", ")}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-200">Discuss this risk</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{track.watch}</p>
            </article>
          ))}
        </div>

        <Link
          to={`/chat?mode=Career%20Coach&prompt=${encodeURIComponent(shsCoachPrompt)}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
        >
          Discuss these SHS options with Career Coach
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Education pathway planner</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Pick the learner stage that fits you now and get a practical next-step plan.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {pathwayOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPathway(option.id)}
                className={`rounded-xl border p-3 text-left text-sm font-semibold transition ${
                  selectedPathway === option.id
                    ? "border-cyan-400 bg-cyan-500/15 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold text-white">{activePathway.recommendation}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {activePathway.actions.map((action) => (
                <li key={action} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={savePathway}
              className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Save pathway plan
            </button>
            <Link
              to={`/chat?mode=Career%20Coach&prompt=${encodeURIComponent(pathwayCoachPrompt)}`}
              className="ml-2 mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/10"
            >
              Build 30-day plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-300">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Scholarship readiness checklist</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Prepare the documents and evidence most scholarship applications ask for.
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${scholarshipPct}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-amber-200">{scholarshipPct}% ready</p>
          <div className="mt-4 space-y-2">
            {scholarshipItems.map((item, index) => (
              <label key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={scholarshipChecks[index]}
                  onChange={() => toggleScholarshipItem(index)}
                  className="h-4 w-4 accent-amber-500"
                />
                {item}
              </label>
            ))}
          </div>
          <Link
            to={`/chat?mode=Career%20Coach&prompt=${encodeURIComponent(scholarshipCoachPrompt)}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-200"
          >
            Turn checklist into a scholarship plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-500/10 p-3 text-violet-300">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Guidance session builder</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Use Career-Aid Pro as your first guidance office, then prepare any school-specific details that need confirmation.
            </p>
          </div>
        </div>
        <label className="mt-4 block text-sm font-semibold text-white">
          What do you need help deciding?
          <textarea
            value={studentConcern}
            onChange={(event) => setStudentConcern(event.target.value)}
            className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
            placeholder="Example: I completed SHS and I am choosing between computer science, nursing, and applying for scholarships."
          />
        </label>
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-300">Counsellor-ready note</p>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{guidanceNote}</pre>
        </div>
        <Link
          to={`/chat?mode=Career%20Coach&prompt=${encodeURIComponent(`Use this guidance note to advise me directly as Career-Aid Pro's Guidance and Counselling department. Give me a decision plan, the evidence or documents I should prepare, and a short list of school-specific details to confirm later.\n\n${guidanceNote}`)}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-violet-200"
        >
          Get direct guidance
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-xl font-bold text-white">Education and transition pathways</h2>
          <p className="mt-1 text-sm text-slate-400">
            Designed for learners who may not yet be applying for full-time work.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        {guidanceTracks.map(({ title, audience, icon: Icon, points }) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{audience}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-xl font-bold text-white">Career role suggestions</h2>
          <p className="mt-1 text-sm text-slate-400">
            Useful when you are choosing a programme, building experience, preparing for NSS, or applying for work.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <article key={role} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{role}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  A practical path to explore with your current profile. Ask the coach for a Ghana-focused roadmap, entry requirements, and CV keywords.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <GraduationCap className="mb-2 h-4 w-4 text-cyan-300" />
                <p className="font-semibold text-white">Skills</p>
                <p className="mt-1 text-xs text-slate-400">Build role-specific proof through projects or short courses.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <BookOpen className="mb-2 h-4 w-4 text-violet-300" />
                <p className="font-semibold text-white">Evidence</p>
                <p className="mt-1 text-xs text-slate-400">Add examples, numbers, tools, and outcomes to your CV.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <MapPin className="mb-2 h-4 w-4 text-amber-300" />
                <p className="font-semibold text-white">Local search</p>
                <p className="mt-1 text-xs text-slate-400">Check LinkedIn, Jobberman, company pages, and university/NSS channels.</p>
              </div>
            </div>
          </article>
        ))}
        </div>
      </section>
    </motion.div>
  );
}
