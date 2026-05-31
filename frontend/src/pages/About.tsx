import PublicPageShell from "../components/PublicPageShell";

export default function AboutPage() {
  return (
    <PublicPageShell title="About Career-Aid Pro">
      <section className="space-y-4">
        <p>
          <strong>Career-Aid Pro</strong> is an AI-assisted career and wellness platform designed
          to help students and young professionals explore careers, improve their CVs, and access
          supportive guidance — with a focus on the Ghanaian context.
        </p>
        <p>
          The platform is presented as a hosted AI service with protected account access. Features
          include Career Coach chat, Mental Wellness support, CV upload and scoring, a step-by-step
          CV Builder, and a temperament assessment that personalizes AI responses.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Developer</h2>
        <p>
          Career-Aid Pro is developed by <strong>Nana Kofi Asiamah</strong>, a Level 400 student at
          the <strong>Ghana Institute of Management and Public Administration (GIMPA)</strong>,
          pursuing a <strong>BSc in Information and Communications Technology (ICT)</strong>.
        </p>
        <p>
          This project is currently built for <strong>academic purposes</strong> as part of his
          studies. It remains in active development: features, design, and reliability are being
          improved with the goal of making it a practical, real-world tool for career support in
          Ghana and beyond.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Vision</h2>
        <p>
          Many students have limited access to career counselors. Career-Aid Pro aims to bridge
          that gap with private, on-demand coaching — combining structured tools (CV analysis,
          builder, temperament insights) with conversational AI that understands Ghanaian pathways
          such as WASSCE, universities, and job platforms like Jobberman Ghana.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Safety and ethics</h2>
        <p>
          Career-Aid Pro adapts the interface for users under 13 with simpler navigation,
          age-appropriate prompts, clearer language, and stronger visual contrast. The child mode
          avoids adult career pressure and keeps the experience focused on exploration, learning,
          and safe curiosity.
        </p>
        <p>
          The platform should not ask children for unnecessary personal details. Young users are
          encouraged to involve a parent, guardian, or teacher when a topic is sensitive, confusing,
          or connected to real-world decisions.
        </p>
        <p>
          Mental Wellness chat is designed for supportive conversation only. It does not diagnose,
          treat, prescribe, or replace a qualified counselor, doctor, guardian, or emergency
          service. When a user describes serious distress, self-harm, abuse, or immediate danger,
          the expected protocol is to stop normal coaching, encourage the user to contact a trusted
          adult or qualified professional immediately, and point them to appropriate crisis support.
        </p>
      </section>

      <section className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-4 text-sm text-amber-100">
        <p className="font-semibold">Development notice</p>
        <p className="mt-1">
          The platform is not yet a finished commercial product. Mental Wellness responses are
          supportive only and are not a substitute for professional medical or crisis care. If you
          are in crisis, please contact qualified services such as Befrienders Ghana.
        </p>
      </section>
    </PublicPageShell>
  );
}
