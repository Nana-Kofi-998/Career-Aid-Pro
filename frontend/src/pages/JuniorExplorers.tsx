import { motion } from "framer-motion";
import { Trophy, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useJuniorExplorers } from "../context/JuniorExplorersContext";
import { ExternalLink } from "lucide-react";
import { addChildBadge, loadJourney } from "../utils/productJourney";

const MENU_TILES = [
  { id: "quiz", label: "Quiz Arena", icon: "🏆", desc: "Test your knowledge!", color: "bg-gradient-to-br from-sky-500 to-blue-700" },
  { id: "math", label: "Math Room", icon: "🧮", desc: "Multiplication games", color: "bg-gradient-to-br from-blue-400 to-indigo-500" },
  { id: "word", label: "Word of Day", icon: "📚", desc: "Build vocabulary", color: "bg-gradient-to-br from-cyan-500 to-blue-600" },
  { id: "careers", label: "Career Explorer", icon: "🧭", desc: "Discover jobs!", color: "bg-gradient-to-br from-emerald-500 to-teal-700" },
  { id: "mission", label: "Mission Lab", icon: "🛠️", desc: "Try real-world tasks", color: "bg-gradient-to-br from-orange-500 to-rose-600" },
  { id: "goals", label: "Goal Quest", icon: "🎯", desc: "Build good habits", color: "bg-gradient-to-br from-fuchsia-500 to-purple-700" },
  { id: "coding", label: "Coding Game", icon: "💻", desc: "Learn to code!", color: "bg-gradient-to-br from-teal-500 to-sky-600" },
  { id: "learn", label: "Learning Videos", icon: "📺", desc: "Fun educational videos", color: "bg-gradient-to-br from-amber-500 to-blue-600" },
];

const CAREER_PATHS = [
  {
    area: "Helping People",
    roles: ["Teacher", "Nurse", "Counsellor", "Community helper"],
    strengths: ["kindness", "listening", "patience"],
    mission: "Ask someone what helps them learn or feel better, then write one thing you noticed.",
  },
  {
    area: "Building Things",
    roles: ["Engineer", "Architect", "Carpenter", "Robotics maker"],
    strengths: ["problem solving", "design", "careful testing"],
    mission: "Build a small object from safe materials and explain what you would improve.",
  },
  {
    area: "Creative Arts",
    roles: ["Designer", "Writer", "Musician", "Animator"],
    strengths: ["imagination", "storytelling", "expression"],
    mission: "Create a tiny poster, story, or tune that explains an idea.",
  },
  {
    area: "Technology",
    roles: ["Coder", "Game designer", "ICT support", "Data explorer"],
    strengths: ["logic", "patterns", "curiosity"],
    mission: "Find a pattern in your day and describe the steps like instructions.",
  },
];

const GOAL_OPTIONS = [
  "Read for 10 minutes",
  "Practice multiplication",
  "Help at home",
  "Draw or write an idea",
  "Ask one thoughtful question",
];

const MISSION_LABS = [
  {
    title: "Mini Engineer",
    skill: "Problem solving",
    steps: ["Pick a small problem at home or school", "Draw a simple solution", "Test one safe version with paper or blocks"],
    reflection: "What changed after you tested it?",
  },
  {
    title: "Kind Helper",
    skill: "Communication",
    steps: ["Ask someone what they need help with", "Listen without interrupting", "Write one kind action you can do today"],
    reflection: "What did you learn by listening first?",
  },
  {
    title: "Data Detective",
    skill: "Patterns",
    steps: ["Count one thing for five minutes", "Put your numbers in order", "Explain the pattern you found"],
    reflection: "What might happen if you counted for longer?",
  },
  {
    title: "Creative Builder",
    skill: "Design",
    steps: ["Choose a topic you like", "Make a poster or short story about it", "Ask someone what part was clearest"],
    reflection: "What would make your idea easier to understand?",
  },
];

type MissionLabItem = (typeof MISSION_LABS)[number];

const TIER_1_MULTIPLICATION = [
  { num: 11, example: "For 34 × 11: Add the neighbor (4 + 3 = 7), write between: 374", steps: ["Write the first digit: 3", "Add right neighbor: 4 + 3 = 7", "Write last digit: 4", "Answer: 374"] },
  { num: 11, example: "For 56 × 11: Add the neighbor (6 + 5 = 11), write 1 carry 1", steps: ["Write first digit plus carry: 5 + 1 = 6", "Add right neighbor: 6 + 5 = 11, write 1", "Write last digit: 6", "Answer: 616"] },
  { num: 11, example: "For 23 × 11: Add the neighbor (3 + 2 = 5)", steps: ["Write first digit: 2", "Add right neighbor: 3 + 2 = 5", "Write last digit: 3", "Answer: 253"] },
  { num: 11, example: "For 45 × 11: Add the neighbor (5 + 4 = 9)", steps: ["Write first digit: 4", "Add right neighbor: 5 + 4 = 9", "Write last digit: 5", "Answer: 495"] },
  { num: 11, example: "For 67 × 11: Add the neighbor (7 + 6 = 13)", steps: ["Write first digit plus carry: 6 + 1 = 7", "Add right neighbor: 7 + 6 = 13, write 3", "Write last digit: 7", "Answer: 737"] },
];

const TIER_2_MULTIPLICATION = [
  { num: 11, example: "34 × 11:", steps: ["First digit: 3", "Middle: 4 + 3 = 7", "Last digit: 4", "Result: 374"] },
  { num: 11, example: "56 × 11:", steps: ["First: 5", "Middle: 6 + 5 = 11 (write 1, carry 1)", "Last: 6", "Result: 616"] },
  { num: 12, example: "12 × 7:", steps: ["Multiply by 10: 70", "Multiply by 2: 14", "Add: 70 + 14 = 84"] },
  { num: 12, example: "12 × 15:", steps: ["Multiply by 10: 150", "Multiply by 2: 30", "Add: 150 + 30 = 180"] },
  { num: 12, example: "12 × 24:", steps: ["Multiply by 10: 240", "Multiply by 2: 48", "Add: 240 + 48 = 288"] },
];

function WordOfDayCard() {
  const { wordOfDay } = useJuniorExplorers();
  const [learned, setLearned] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-100 p-3 text-3xl dark:bg-cyan-950/60">📚</div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Word of the Day</h3>
          <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>Build your vocabulary!</p>
        </div>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
        <p className="text-3xl font-bold" style={{ color: "var(--kid-text-primary)" }}>{wordOfDay.word}</p>
        <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>({wordOfDay.partOfSpeech})</p>
        <p className="mt-2 text-lg" style={{ color: "var(--kid-text-primary)" }}>{wordOfDay.meaning}</p>
        <p className="mt-2 italic" style={{ color: "var(--kid-text-secondary)" }}>"{wordOfDay.exampleSentence}"</p>
      </div>
      <button
        type="button"
        disabled={learned}
        onClick={() => {
          addChildBadge("Word Builder", {
            completedWordReview: true,
            word: wordOfDay.word,
          });
          setLearned(true);
        }}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {learned ? "Word learned" : "I learned this word"}
      </button>
    </motion.div>
  );
}

function MathRoom() {
  const { currentTier } = useJuniorExplorers();
  const [activeTab, setActiveTab] = useState<"neighbor" | "trachtenberg">(
    currentTier === 1 ? "neighbor" : "trachtenberg"
  );
  const [trachInput, setTrachInput] = useState("");
  const [trachResult, setTrachResult] = useState<string | null>(null);
  const [showTrachSteps, setShowTrachSteps] = useState(false);

  const trachtenbergSteps = [
    "✨ Adding 2: Add left digit, then add right neighbor to get each digit",
    "✨ Adding 3: Double middle, add neighbors - carry to next column",
    "✨ Adding 4: Double both neighbors, add current digit",
    "✨ Adding 5: Add 10, then subtract half the neighbor (round down)",
  ];

  const multiplyBy11 = (num: number): string => {
    return String(num * 11);
  };

  const handleTrachCalculate = () => {
    const num = parseInt(trachInput);
    if (isNaN(num)) return;
    
    const result = multiplyBy11(num);
    setTrachResult(`${num} × 11 = ${result}`);
    setShowTrachSteps(true);
    addChildBadge("Math Solver", {
      completedCalculation: true,
      method: "multiply_by_11",
      input: num,
    });
  };

  const examples = currentTier === 1 ? TIER_1_MULTIPLICATION : TIER_2_MULTIPLICATION;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-100 p-3 text-3xl dark:bg-blue-950/60">🧮</div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Math Room</h3>
          <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>
            {currentTier === 1 ? "The Neighbor Game for ×11" : "Trachtenberg Speed Math"}
          </p>
        </div>
      </div>

      {currentTier === 1 ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
            <p className="mb-2 font-bold" style={{ color: "var(--kid-text-primary)" }}>🎮 The Neighbor Game</p>
            <p style={{ color: "var(--kid-text-secondary)" }}>
              Story: Imagine numbers holding hands! The right number helps the left number.
            </p>
          </div>
          {examples.map((ex, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
              <p className="font-bold" style={{ color: "var(--kid-text-primary)" }}>{ex.example}</p>
              <ol className="mt-2 list-decimal list-inside space-y-1" style={{ color: "var(--kid-text-secondary)" }}>
                {ex.steps.map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("trachtenberg")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "trachtenberg" ? "bg-blue-600 text-white" : "border border-sky-200 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
              }`}
            >
              🎯 Trachtenberg Method
            </button>
            <button
              onClick={() => setActiveTab("neighbor")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "neighbor" ? "bg-blue-600 text-white" : "border border-sky-200 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
              }`}
            >
              ×11 Tricks
            </button>
          </div>

          {activeTab === "trachtenberg" && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
                <p className="font-bold" style={{ color: "var(--kid-text-primary)" }}>✨ What is Trachtenberg?</p>
                <p className="mt-1 text-sm" style={{ color: "var(--kid-text-secondary)" }}>
                  A system for super-fast mental math invented by Jakob Trachtenberg while in prison!
                </p>
              </div>

              <div className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
                <p className="mb-2 font-bold" style={{ color: "var(--kid-text-primary)" }}>🎯 Quick Multiply by 11</p>
                <p className="mb-2 text-sm" style={{ color: "var(--kid-text-secondary)" }}>
                  Rule: Put the sum of adjacent digits between them!
                </p>
                <div className="mb-3">
                  <input
                    type="number"
                    value={trachInput}
                    onChange={(e) => setTrachInput(e.target.value)}
                    placeholder="Enter a number (e.g., 34)"
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-center text-lg text-slate-950"
                  />
                </div>
                <button
                  onClick={handleTrachCalculate}
                  className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white"
                >
                  Calculate!
                </button>
                {showTrachSteps && trachResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-lg bg-blue-100 p-3 dark:bg-blue-950/70"
                  >
                    <p className="font-bold text-blue-950 dark:text-blue-100">{trachResult}</p>
                    <p className="mt-1 text-xs text-blue-800 dark:text-blue-100">
                      Method: Add each pair of neighboring digits!
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
                <p className="mb-2 font-bold" style={{ color: "var(--kid-text-primary)" }}>📚 Trachtenberg Shortcuts</p>
                <ul className="space-y-1 text-sm" style={{ color: "var(--kid-text-secondary)" }}>
                  {trachtenbergSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "neighbor" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
                <p className="font-bold" style={{ color: "var(--kid-text-primary)" }}>🔢 Multiply by 11 - Advanced</p>
                <p className="mt-1" style={{ color: "var(--kid-text-secondary)" }}>For numbers with carries:</p>
              </div>
              {examples.map((ex, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
                  <p className="font-bold" style={{ color: "var(--kid-text-primary)" }}>{ex.example}</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1" style={{ color: "var(--kid-text-secondary)" }}>
                    {ex.steps.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function QuizArena() {
  const { quizState, selectQuizAnswer, nextQuestion, resetQuiz } = useJuniorExplorers();
  const q = quizState.questions[quizState.currentQuestionIndex];

  useEffect(() => {
    if (!quizState.completed) return;
    addChildBadge("Quiz Finisher", {
      completedQuiz: true,
      score: quizState.score,
      questionCount: quizState.questions.length,
    });
  }, [quizState.completed, quizState.questions.length, quizState.score]);

  if (quizState.completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border p-8 text-center shadow-lg"
        style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
      >
        <Trophy className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h2 className="text-3xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Great Job!</h2>
        <p className="mt-2 text-xl" style={{ color: "var(--kid-text-secondary)" }}>
          You scored {quizState.score} out of {quizState.questions.length}!
        </p>
        <button
          onClick={resetQuiz}
          className="mt-4 rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Play Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-100 p-3 text-3xl dark:bg-sky-950/60">🏆</div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Quiz Arena</h3>
            <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>{q.subject} • Question {quizState.currentQuestionIndex + 1}/{quizState.questions.length}</p>
          </div>
        </div>
        <div className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
          Score: {quizState.score}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--kid-text-primary)" }}>{q.question}</p>
        <div className="mt-4 grid gap-2">
          {q.options.map((opt, i) => {
            const isSelected = quizState.selectedAnswer === i;
            const isCorrect = i === q.correctAnswer;
            const showResult = quizState.selectedAnswer !== null;
            return (
<button
                 key={i}
                 onClick={() => selectQuizAnswer(i)}
                 disabled={quizState.selectedAnswer !== null}
                 className={`rounded-xl border-2 px-4 py-2 text-left transition-all ${
                   showResult
                     ? isCorrect
                       ? "border-green-500 bg-green-100 text-green-900"
                       : isSelected
                       ? "border-red-500 bg-red-100 text-red-900"
                       : "border-slate-200 text-slate-700"
                     : isSelected
                     ? "border-blue-500 bg-blue-100 text-blue-900"
                     : "border-slate-200 text-slate-700 hover:border-blue-300"
                 }`}
               >
                 {opt}
               </button>
            );
          })}
        </div>
        {quizState.selectedAnswer !== null && (
          <button
            onClick={nextQuestion}
            className="mt-4 rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
          >
            {quizState.currentQuestionIndex < quizState.questions.length - 1 ? "Next Question" : "See Results"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CodingGame() {
  const { currentTier } = useJuniorExplorers();
  const [activeGame, setActiveGame] = useState<"sequence" | "turtle" | "loops">("sequence");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [turtleCommands, setTurtleCommands] = useState<string[]>([]);
  const [turtleOutput, setTurtleOutput] = useState<string[]>([]);
  const [debugHint, setDebugHint] = useState(false);

  useEffect(() => {
    if (activeGame === "sequence") {
      const newSequence = Array.from({ length: currentTier === 1 ? 3 : 4 }, () => Math.floor(Math.random() * 4));
      setSequence(newSequence);
      setPlayerSequence([]);
    }
  }, [activeGame, currentTier]);

  useEffect(() => {
    if (playerSequence.length > 0 && 
        playerSequence.length <= sequence.length &&
        JSON.stringify(playerSequence) === JSON.stringify(sequence.slice(0, playerSequence.length))) {
      if (playerSequence.length === sequence.length) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } else if (playerSequence.length > 0) {
      setTimeout(() => setPlayerSequence([]), 500);
    }
  }, [playerSequence, sequence]);

  const handleSequenceClick = (num: number) => {
    setPlayerSequence([...playerSequence, num]);
  };

  const runTurtleCode = () => {
    const output: string[] = [];
    turtleCommands.forEach((cmd, i) => {
      output.push(`Step ${i + 1}: ${cmd}`);
    });
    setTurtleOutput(output);
  };

  const directionEmojis = ["↑", "→", "↓", "←"];
  const directionColors = ["bg-sky-500", "bg-blue-600", "bg-cyan-600", "bg-amber-500"];

  if (currentTier === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border p-6 shadow-lg"
        style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-teal-100 p-3 text-3xl dark:bg-teal-950/60">💻</div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Coding Games</h3>
            <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>Learn to code with fun games!</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveGame("sequence")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${activeGame === "sequence" ? "bg-blue-600 text-white" : "bg-white/50 text-blue-800"}`}
            >
              🎮 Sequence Game
            </button>
            <button
              onClick={() => setActiveGame("turtle")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${activeGame === "turtle" ? "bg-blue-600 text-white" : "bg-white/50 text-blue-800"}`}
            >
              🐢 Turtle Art
            </button>
          </div>

          {activeGame === "sequence" && (
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="mb-3 text-center font-bold text-blue-900">
                Watch the pattern and repeat it!
              </p>
              <div className="mb-3 flex justify-center gap-2">
                {sequence.map((dir, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.3 }}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${directionColors[dir]} text-white`}
                  >
                    {directionEmojis[dir]}
                  </motion.div>
                ))}
              </div>
              <p className="mb-2 text-center text-sm text-blue-700">Your turn - tap the arrows!</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((dir) => (
                  <motion.button
                    key={dir}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSequenceClick(dir)}
                    className={`rounded-xl ${directionColors[dir]} p-3 text-2xl text-white shadow-md`}
                  >
                    {directionEmojis[dir]}
                  </motion.button>
                ))}
              </div>
              {showSuccess && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-center font-bold text-green-600"
                >
                  🎉 Great job! You matched the pattern!
                </motion.p>
              )}
            </div>
          )}

          {activeGame === "turtle" && (
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="mb-3 font-bold text-blue-900">🐢 Turtle Art Maker</p>
              <p className="mb-2 text-sm text-blue-800">
                Drag commands to draw a square:
              </p>
              <div className="mb-3 rounded-lg bg-blue-50 p-2 dark:bg-blue-950/40">
                <div className="flex flex-wrap gap-2">
                  {["Forward", "Right", "Left", "Clear"].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => {
                        if (cmd === "Clear") {
                          setTurtleCommands([]);
                          setTurtleOutput([]);
                        } else {
                          setTurtleCommands([...turtleCommands, cmd]);
                        }
                      }}
                      className={`rounded px-3 py-1 text-xs font-medium ${
                        cmd === "Clear" ? "bg-amber-200 text-amber-900" : "bg-blue-100 text-blue-900"
                      }`}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-2 min-h-[60px] rounded-lg bg-blue-50 p-2 dark:bg-blue-950/40">
                {turtleCommands.length > 0 ? (
                  <div className="flex items-center gap-1 text-sm">
                    {turtleCommands.map((cmd, i) => (
                      <span key={i} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-900 dark:bg-blue-950/70 dark:text-blue-100">
                        {cmd}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-blue-700">Add commands above</p>
                )}
              </div>
              <button
                onClick={runTurtleCode}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white"
              >
                Run Turtle!
              </button>
              {turtleOutput.length > 0 && (
                <div className="mt-2 rounded bg-blue-50 p-2 dark:bg-blue-950/40">
                  {turtleOutput.map((line, i) => (
                    <p key={i} className="text-xs text-blue-800 dark:text-blue-100">{line}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-teal-100 p-3 text-3xl dark:bg-teal-950/60">💻</div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Coding Games</h3>
          <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>Advanced programming challenges</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white/70 p-4">
          <p className="font-bold text-blue-900 dark:text-blue-100">🔁 Loop Challenge</p>
          <p className="mt-2 text-blue-800 dark:text-blue-100">
            Make the turtle draw patterns using loops!
          </p>
          <div className="mt-3">
            <label className="block text-xs font-medium text-blue-700 dark:text-blue-200">
              Repeat how many times?
            </label>
            <input
              type="number"
              min="1"
              max="10"
              defaultValue="4"
              className="mt-1 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm dark:border-blue-800"
              onChange={(e) => {
                const reps = parseInt(e.target.value) || 1;
                setTurtleCommands(Array(reps).fill("Move Forward"));
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 p-4">
          <p className="font-bold text-blue-900 dark:text-blue-100">🐞 Debug Quest</p>
          <p className="mt-2 text-blue-800 dark:text-blue-100">
            Find the bug in this code:
          </p>
          <pre className="mt-2 rounded bg-blue-50 p-2 text-xs dark:bg-blue-950/50 dark:text-blue-100">
            <code>
              {`for i in range(5):
    print("Hello")
  print("Done")`}
            </code>
          </pre>
          <button
            onClick={() => setDebugHint(true)}
            className="mt-2 rounded-lg bg-amber-200 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-100"
          >
            Need a hint?
          </button>
          {debugHint && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              Hint: Check the indentation before the final print line.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LearningVideos() {
  const featuredVideos = [
    { id: "k5etrWdIY6o", title: "Points, Lines, & Planes", channel: "Math Antics" },
    { id: "W6Ar0ls6tVA", title: "Speed and Velocity", channel: "Khan Academy" },
    { id: "Qd6nLM2QlWw", title: "Exploring Our Solar System", channel: "FreeSchool" },
    { id: "cnlL-7wp7MQ", title: "Why Personality Tests Work", channel: "SciShow Kids" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-3 text-3xl dark:bg-amber-950/40">📺</div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Learning Videos</h3>
          <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>Fun educational content</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">🎥 Featured Videos</h4>
          <div className="grid gap-3">
            {featuredVideos.map((video, i) => (
              <div key={i} className="rounded-2xl bg-white/70 p-3">
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                    title={video.title}
                    className="h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                <p className="mt-2 font-bold text-blue-900 dark:text-blue-100">{video.title}</p>
                <p className="text-sm text-blue-700 dark:text-blue-200">{video.channel}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">🚀 Learning Platforms</h4>
          <div className="grid grid-cols-2 gap-2">
            <a href="https://www.scishowkids.com" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              SciShow Kids
            </a>
            <a href="https://www.crashcoursekids.com" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              Crash Course Kids
            </a>
            <a href="https://www.freeschool.com" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              FreeSchool
            </a>
            <a href="https://www.learnbright.org" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              LearnBright
            </a>
            <a href="https://www.khanacademy.org" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              Khan Academy
            </a>
            <a href="https://www.mathantics.com" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              Math Antics
            </a>
            <a href="https://www.abcya.com" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              ABCya!
            </a>
            <a href="https://www.scratch.mit.edu" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              Scratch
            </a>
            <a href="https://pbskids.org" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 rounded-xl bg-white/70 p-3 text-sm font-medium text-blue-800 hover:bg-white/90 dark:text-blue-100">
              <ExternalLink className="h-4 w-4" />
              PBS Kids
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CareerExplorer() {
  const [selected, setSelected] = useState(CAREER_PATHS[0]);
  const [savedRole, setSavedRole] = useState("");
  const completed = !!savedRole;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-3 text-3xl dark:bg-emerald-950/50">🧭</div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Career Explorer</h3>
          <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>Pick an interest and discover jobs that match it.</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {CAREER_PATHS.map((path) => (
          <button
            key={path.area}
            type="button"
            onClick={() => {
              setSelected(path);
              setSavedRole("");
            }}
            className={`rounded-2xl border p-3 text-left text-sm font-bold transition ${
              selected.area === path.area
                ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                : "border-slate-200 bg-white/70 text-blue-900 hover:bg-white"
            }`}
          >
            {path.area}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-white/70 p-4">
        <h4 className="font-bold text-blue-900">{selected.area}</h4>
        <p className="mt-2 text-sm text-blue-800">Jobs to explore:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setSavedRole(role);
                addChildBadge("Career Explorer", {
                  selectedInterest: selected.area,
                  savedRole: role,
                  completedCareerChoice: true,
                });
              }}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                savedRole === role ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-blue-800">
          Strengths: {selected.strengths.join(", ")}
        </p>
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          Mission: {selected.mission}
        </div>
      </div>

      {completed && (
        <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-800">
          Saved: {savedRole}. You earned the Career Explorer badge.
        </p>
      )}
    </motion.div>
  );
}

function MissionPicker({
  selected,
  onSelect,
}: {
  selected: MissionLabItem;
  onSelect: (mission: MissionLabItem) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {MISSION_LABS.map((mission) => (
        <button
          key={mission.title}
          type="button"
          onClick={() => onSelect(mission)}
          className={`rounded-2xl border p-3 text-left text-sm font-bold transition ${
            selected.title === mission.title
              ? "border-orange-500 bg-orange-100 text-slate-950 dark:border-orange-300 dark:bg-orange-200 dark:text-slate-950"
              : "border-sky-800/70 bg-slate-950/35 text-slate-100 hover:border-orange-300 hover:bg-slate-900 dark:text-slate-100"
          }`}
        >
          <span className="block">{mission.title}</span>
          <span className="mt-1 block text-xs font-semibold opacity-90">{mission.skill}</span>
        </button>
      ))}
    </div>
  );
}

function MissionChecklist({
  mission,
  checks,
  onToggle,
}: {
  mission: MissionLabItem;
  checks: boolean[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {mission.steps.map((step, index) => (
        <label
          key={step}
          className="flex items-center gap-3 rounded-xl border border-orange-300/30 bg-slate-950/45 p-3 text-sm font-bold text-slate-100 dark:text-slate-100"
        >
          <input
            type="checkbox"
            checked={checks[index]}
            onChange={() => onToggle(index)}
            className="h-5 w-5 accent-orange-600"
          />
          {step}
        </label>
      ))}
    </div>
  );
}

function MissionLab() {
  const [selected, setSelected] = useState<MissionLabItem>(MISSION_LABS[0]);
  const [checks, setChecks] = useState<boolean[]>(() => selected.steps.map(() => false));
  const [reflection, setReflection] = useState("");
  const complete = checks.every(Boolean) && reflection.trim().length >= 8;

  function selectMission(mission: MissionLabItem) {
    setSelected(mission);
    setChecks(mission.steps.map(() => false));
    setReflection("");
  }

  function toggleStep(index: number) {
    setChecks((current) => current.map((checked, i) => (i === index ? !checked : checked)));
  }

  useEffect(() => {
    if (!complete) return;
    addChildBadge("Mission Lab", {
      completedMission: true,
      mission: selected.title,
      skill: selected.skill,
    });
  }, [complete, selected.skill, selected.title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-orange-100 p-3 text-3xl dark:bg-orange-950/50">🛠️</div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Mission Lab</h3>
          <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>Turn learning into a safe real-world mini project.</p>
        </div>
      </div>

      <MissionPicker selected={selected} onSelect={selectMission} />

      <div className="mt-4 rounded-2xl p-4" style={{ background: "var(--kid-bg-card)" }}>
        <h4 className="font-bold" style={{ color: "var(--kid-text-primary)" }}>{selected.title}</h4>
        <p className="mt-1 text-sm" style={{ color: "var(--kid-text-secondary)" }}>Skill badge: {selected.skill}</p>
        <MissionChecklist mission={selected} checks={checks} onToggle={toggleStep} />
        <label className="mt-4 block text-sm font-bold" style={{ color: "var(--kid-text-primary)" }}>
          {selected.reflection}
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="mt-2 min-h-20 w-full rounded-xl border border-orange-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-300"
            placeholder="Write one sentence about what you noticed."
          />
        </label>
      </div>

      {complete && (
        <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-900 dark:bg-green-950/50 dark:text-green-100">
          Mission complete. You earned the Mission Lab badge.
        </p>
      )}
    </motion.div>
  );
}

function GoalQuest() {
  const [selectedGoal, setSelectedGoal] = useState(GOAL_OPTIONS[0]);
  const [customGoal, setCustomGoal] = useState("");
  const [checks, setChecks] = useState([false, false, false]);
  const goal = customGoal.trim() || selectedGoal;
  const doneCount = checks.filter(Boolean).length;

  useEffect(() => {
    if (doneCount !== 3) return;
    addChildBadge("Goal Quest", {
      completedGoalPlan: true,
      goal,
      completedSteps: doneCount,
    });
  }, [doneCount, goal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-6 shadow-lg"
      style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-purple-100 p-3 text-3xl dark:bg-purple-950/50">🎯</div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kid-text-primary)" }}>Goal Quest</h3>
          <p className="text-sm" style={{ color: "var(--kid-text-secondary)" }}>Choose one small goal and finish three steps.</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {GOAL_OPTIONS.map((goalOption) => (
          <button
            key={goalOption}
            type="button"
            onClick={() => {
              setSelectedGoal(goalOption);
              setCustomGoal("");
              setChecks([false, false, false]);
            }}
            className={`rounded-2xl border p-3 text-left text-sm font-bold transition ${
              selectedGoal === goalOption && !customGoal
                ? "border-purple-500 bg-purple-100 text-purple-900"
                : "border-slate-200 bg-white/70 text-blue-900 hover:bg-white"
            }`}
          >
            {goalOption}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-bold text-blue-900">
        Or write your own goal
        <input
          value={customGoal}
          onChange={(e) => {
            setCustomGoal(e.target.value);
            setChecks([false, false, false]);
          }}
          className="mt-2 w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
          placeholder="Example: Learn five new words"
        />
      </label>

      <div className="mt-4 rounded-2xl bg-white/70 p-4">
        <p className="font-bold text-blue-900">Goal: {goal}</p>
        <div className="mt-3 space-y-2">
          {["Start it", "Practise it", "Tell what you learned"].map((step, index) => (
            <label key={step} className="flex items-center gap-3 rounded-xl bg-purple-50 p-3 text-sm font-bold text-purple-900">
              <input
                type="checkbox"
                checked={checks[index]}
                onChange={() =>
                  setChecks((current) =>
                    current.map((checked, i) => (i === index ? !checked : checked))
                  )
                }
                className="h-5 w-5 accent-purple-600"
              />
              {step}
            </label>
          ))}
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-purple-100">
          <div className="h-full rounded-full bg-purple-600" style={{ width: `${(doneCount / 3) * 100}%` }} />
        </div>
      </div>

      {doneCount === 3 && (
        <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-800">
          Quest complete. You earned the Goal Quest badge.
        </p>
      )}
    </motion.div>
  );
}

interface JuniorExplorersPageProps {
  activeTile: string | null;
  setActiveTile: (tile: string | null) => void;
}

export default function JuniorExplorersPage({ activeTile, setActiveTile }: JuniorExplorersPageProps) {
  const [badges, setBadges] = useState<string[]>(() => loadJourney().childBadges);

  useEffect(() => {
    const refreshBadges = () => setBadges(loadJourney().childBadges);
    window.addEventListener("career-aid-journey-updated", refreshBadges);
    return () => window.removeEventListener("career-aid-journey-updated", refreshBadges);
  }, []);

  function openTile(tileId: string) {
    setActiveTile(tileId);
    setBadges(loadJourney().childBadges);
  }

  return (
    <div className="min-h-screen p-4" style={{ background: "linear-gradient(135deg, var(--kid-bg-primary), var(--kid-bg-secondary), var(--kid-bg-tertiary))" }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold" style={{ color: "var(--kid-text-primary)" }}>
            <span className="text-sky-500">Junior</span> <span className="text-blue-600 dark:text-blue-300">Explorers</span>
          </h1>
          <p className="mt-2 text-lg" style={{ color: "var(--kid-text-secondary)" }}>Learning adventures for curious minds!</p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border p-4 shadow-lg" style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--kid-text-secondary)" }}>Explorer progress</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-sky-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                style={{ width: `${Math.min(100, (badges.length / MENU_TILES.length) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm" style={{ color: "var(--kid-text-primary)" }}>
              {badges.length} of {MENU_TILES.length} adventure badges earned.
            </p>
          </div>
          <div className="rounded-3xl border p-4 shadow-lg" style={{ background: "var(--kid-gradient-card)", borderColor: "var(--kid-border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--kid-text-secondary)" }}>Safe helper rule</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--kid-text-primary)" }}>
              Ask a trusted adult before sharing personal details, opening outside links, or making big decisions.
            </p>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {badges.slice(0, 6).map((badge) => (
              <span key={badge} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm">
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MENU_TILES.map((tile) => (
            <motion.button
              key={tile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openTile(tile.id)}
              className={`${tile.color} rounded-2xl p-4 text-white shadow-lg transition-transform hover:shadow-xl`}
            >
              <div className="text-4xl">{tile.icon}</div>
              <p className="mt-2 text-base font-bold">{tile.label}</p>
              <p className="text-xs opacity-90">{tile.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTile === "word" && <WordOfDayCard />}
          {activeTile === "math" && <MathRoom />}
          {activeTile === "quiz" && <QuizArena />}
          {activeTile === "careers" && <CareerExplorer />}
          {activeTile === "mission" && <MissionLab />}
          {activeTile === "goals" && <GoalQuest />}
          {activeTile === "coding" && <CodingGame />}
          {activeTile === "learn" && <LearningVideos />}
          
          {!activeTile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Sparkles className="mx-auto h-12 w-12 text-sky-400" />
              <p className="mt-4 text-xl text-slate-600">Pick an adventure above to get started!</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
