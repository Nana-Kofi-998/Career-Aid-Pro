import { ChevronDown } from "lucide-react";
import { useState } from "react";
import PublicPageShell from "../components/PublicPageShell";

const faqs: { q: string; a: string }[] = [
  {
    q: "What is Career-Aid Pro?",
    a: "Career-Aid Pro is a hosted AI platform for career coaching, CV tools, mental wellness chat, and personality-based personalization. It is developed as an academic project by Nana Kofi Asiamah (GIMPA, BSc ICT) and is still evolving toward a full production release.",
  },
  {
    q: "How is my account information handled?",
    a: "Career-Aid Pro uses protected account access to keep each user's chats, CV scores, and personalization data tied to their profile. Users should avoid sharing sensitive personal information unless it is needed for the task.",
  },
  {
    q: "Do I need to install an AI model?",
    a: "No. The application is presented as a hosted service, so users interact with the AI features through the web app without installing a separate model runtime.",
  },
  {
    q: "How do I upload my CV?",
    a: "Open Chat, select Career Coach, then expand CV tools. Upload a PDF or DOCX (recommended), drag and drop, or paste your CV text. The platform extracts text, scores it, and lets the coach reference your document in answers.",
  },
  {
    q: "What is CV Tools?",
    a: "CV Tools is where you can analyze your existing CV for strengths and improvements (CV Analyzer) or build a new CV using guided answers (CV Builder).",
  },
  {
    q: "What is the temperament assessment?",
    a: "A 20-question Likert-style questionnaire that estimates work-style traits and a temperament label. Results are saved to your profile so Career Coach and Mental Wellness can tailor tone and advice. You can retake it anytime.",
  },
  {
    q: "Is Mental Wellness medical advice?",
    a: "No. It offers general emotional support and coping ideas, not diagnosis or treatment. For serious or urgent mental health concerns, contact a qualified professional or crisis line such as Befrienders Ghana (233-233-555-292).",
  },
  {
    q: "How are users under 13 protected?",
    a: "When a profile age is under 13, the app switches to a child-friendly interface with simpler navigation, safer prompt wording, stronger contrast, and learning-focused activities. It should avoid collecting unnecessary personal details and should encourage a parent, guardian, or teacher for sensitive questions or real-world decisions.",
  },
  {
    q: "What safety protocol does Mental Wellness follow?",
    a: "Mental Wellness is supportive only. If a user mentions self-harm, abuse, immediate danger, or serious distress, the response should prioritize safety: stop ordinary coaching, encourage contacting a trusted adult or qualified professional immediately, and share crisis support such as Befrienders Ghana (233-233-555-292).",
  },
  {
    q: "Which devices are supported?",
    a: "The web app works on phones, tablets, and desktops. Use a modern browser (Chrome, Edge, Safari, Firefox). On mobile, use the bottom navigation bar; in chat, tap the menu icon to open your conversation list.",
  },
  {
    q: "The platform says it is still in development — what does that mean?",
    a: "Features may change, bugs may appear, and some AI responses may be imperfect. The project is primarily for academic demonstration while being improved for real-world use. Feedback during testing is welcome.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-700 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-white"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="border-t border-white/10 px-4 py-3 text-sm text-slate-300">
          {a}
        </p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <PublicPageShell title="Frequently asked questions">
      <p className="text-slate-300">
        Quick answers about using Career-Aid Pro. For account or technical issues, check Settings
        or contact your course supervisor for the academic deployment.
      </p>
      <div className="space-y-2">
        {faqs.map((item) => (
          <FaqItem key={item.q} {...item} />
        ))}
      </div>
    </PublicPageShell>
  );
}
