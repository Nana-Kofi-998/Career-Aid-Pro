import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface QuizQuestion {
  id: string;
  subject: "Science" | "English" | "Physics" | "ICT";
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  score: number;
  completed: boolean;
}

interface WordOfDay {
  word: string;
  partOfSpeech: string;
  meaning: string;
  exampleSentence: string;
}

interface JuniorExplorersContextValue {
  currentTier: 1 | 2;
  quizState: QuizState;
  wordOfDay: WordOfDay;
  selectQuizAnswer: (answer: number) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
}

const JuniorExplorersContext = createContext<JuniorExplorersContextValue | null>(null);

const TIER_1_VOCAB: WordOfDay[] = [
  { word: "Glimmer", partOfSpeech: "noun", meaning: "A faint or wavering light", exampleSentence: "In the cave, I saw a glimmer of sunlight ahead." },
  { word: "Leap", partOfSpeech: "verb", meaning: "To jump or spring a long way", exampleSentence: "The frog can leap across the pond in one big jump." },
  { word: "Cheerful", partOfSpeech: "adjective", meaning: "Noticeably happy and optimistic", exampleSentence: "She has a cheerful smile that brightens everyone's day." },
  { word: "Giggle", partOfSpeech: "verb", meaning: "To laugh lightly and repeatedly", exampleSentence: "The children giggle when they play their favorite game." },
  { word: "Meadow", partOfSpeech: "noun", meaning: "A field of grassland", exampleSentence: "We had a picnic in the sunny meadow full of wildflowers." },
  { word: "Whisper", partOfSpeech: "verb", meaning: "To speak very softly", exampleSentence: "Please whisper so you don't wake the baby." },
  { word: "Sparkle", partOfSpeech: "verb", meaning: "To shine brightly with flashes of light", exampleSentence: "The stars sparkle in the night sky." },
  { word: "Cloud", partOfSpeech: "noun", meaning: "A visible mass of water droplets suspended in the air", exampleSentence: "Fluffy white clouds float across the blue sky." },
];

const TIER_2_VOCAB: WordOfDay[] = [
  { word: "Precipitation", partOfSpeech: "noun", meaning: "Water that falls from the atmosphere as rain, snow, sleet, or hail", exampleSentence: "The precipitation collected in the measuring gauge overnight." },
  { word: "Flourish", partOfSpeech: "verb", meaning: "To grow or develop successfully", exampleSentence: "The garden plants flourish with regular watering and sunlight." },
  { word: "Conspicuous", partOfSpeech: "adjective", meaning: "Easily seen or noticed", exampleSentence: "The bright red car was conspicuous in the parking lot." },
  { word: "Hypothesis", partOfSpeech: "noun", meaning: "A proposed explanation based on limited evidence", exampleSentence: "My hypothesis was proven correct after the experiment." },
  { word: "Velocity", partOfSpeech: "noun", meaning: "Speed in a given direction", exampleSentence: "The velocity of the moving car increased down the hill." },
  { word: "Algorithm", partOfSpeech: "noun", meaning: "A step-by-step procedure for solving a problem", exampleSentence: "The search engine uses an algorithm to find relevant results." },
];

const TIER_1_QUIZ: QuizQuestion[] = [
  { id: "s1", subject: "Science", question: "What do plants need to grow?", options: ["Water, sunlight, and soil", "Only water", "Only sunlight", "Only soil"], correctAnswer: 0 },
  { id: "s2", subject: "Science", question: "Which animal is a mammal?", options: ["Shark", "Eagle", "Dolphin", "Snake"], correctAnswer: 2 },
  { id: "s3", subject: "Science", question: "What do we drink when we're thirsty?", options: ["Water", "Juice", "Milk", "All of these"], correctAnswer: 3 },
  { id: "s4", subject: "Science", question: "Which season comes after summer?", options: ["Winter", "Spring", "Fall", "Winter again"], correctAnswer: 2 },
  { id: "e1", subject: "English", question: "Which word rhymes with 'cat'?", options: ["Dog", "Hat", "Bird", "Fish"], correctAnswer: 1 },
  { id: "e2", subject: "English", question: "What is the opposite of 'hot'?", options: ["Cold", "Warm", "Cool", "Wet"], correctAnswer: 0 },
  { id: "e3", subject: "English", question: "Which is a fruit?", options: ["Carrot", "Apple", "Bread", "Rice"], correctAnswer: 1 },
  { id: "p1", subject: "Physics", question: "What falls faster: a feather or a rock?", options: ["They fall at the same speed", "The feather", "The rock", "Neither falls"], correctAnswer: 0 },
  { id: "p2", subject: "Physics", question: "What do you need to see in the dark?", options: ["Glasses", "Flashlight", "Umbrella", "Shoes"], correctAnswer: 1 },
  { id: "ict1", subject: "ICT", question: "What does a computer use to remember things?", options: ["Memory", "Teeth", "Feet", "Ears"], correctAnswer: 0 },
  { id: "ict2", subject: "ICT", question: "What do we use to write on a computer?", options: ["Keyboard", "Spoon", "Brush", "Stick"], correctAnswer: 0 },
  { id: "ict3", subject: "ICT", question: "What shows pictures on a computer?", options: ["Monitor", "Chair", "Table", "Window"], correctAnswer: 0 },
];

const TIER_2_QUIZ: QuizQuestion[] = [
  { id: "s1", subject: "Science", question: "What is the process called when plants make their own food?", options: ["Respiration", "Photosynthesis", "Evaporation", "Condensation"], correctAnswer: 1 },
  { id: "s2", subject: "Science", question: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correctAnswer: 2 },
  { id: "s3", subject: "Science", question: "What do we call water that falls from clouds?", options: ["Rain", "Snow", "Wind", "Sunshine"], correctAnswer: 0 },
  { id: "e1", subject: "English", question: "Choose the correct past tense: 'I ___ to school yesterday.'", options: ["go", "goes", "went", "going"], correctAnswer: 2 },
  { id: "e2", subject: "English", question: "What is a synonym for 'rapid'?", options: ["Slow", "Quick", "Tiny", "Sleepy"], correctAnswer: 1 },
  { id: "e3", subject: "English", question: "Which is a verb?", options: ["Happy", "Run", "Beautiful", "Blue"], correctAnswer: 1 },
  { id: "p1", subject: "Physics", question: "What force pulls objects toward the Earth?", options: ["Magnetism", "Gravity", "Friction", "Electricity"], correctAnswer: 1 },
  { id: "p2", subject: "Physics", question: "What makes a ball bounce?", options: ["Air", "Gravity", "Force", "Wind"], correctAnswer: 2 },
  { id: "ict1", subject: "ICT", question: "What does CPU stand for?", options: ["Computer Processing Unit", "Central Process Unit", "Central Processing Unit", "Computer Power Unit"], correctAnswer: 2 },
  { id: "ict2", subject: "ICT", question: "Which device is used to click on icons?", options: ["Keyboard", "Mouse", "Monitor", "Printer"], correctAnswer: 1 },
  { id: "ict3", subject: "ICT", question: "What do we call sending messages on a computer?", options: ["Email", "Mail", "Letter", "Package"], correctAnswer: 0 },
];

function getWordOfDay(tier: 1 | 2): WordOfDay {
  const vocabList = tier === 1 ? TIER_1_VOCAB : TIER_2_VOCAB;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return vocabList[dayOfYear % vocabList.length];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickUnseenQuestions(
  pool: QuizQuestion[],
  count: number,
  storageKey: string
): QuizQuestion[] {
  let used: string[] = [];
  try {
    used = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
  } catch {
    used = [];
  }

  const usedSet = new Set(used);
  let available = pool.filter((q) => !usedSet.has(q.id));
  if (available.length < count) {
    available = pool;
    used = [];
  }
  const picked = shuffleArray(available).slice(0, Math.min(count, available.length));
  try {
    localStorage.setItem(storageKey, JSON.stringify([...used, ...picked.map((q) => q.id)]));
  } catch {
    /* local progress can fail silently */
  }
  return picked;
}

export function JuniorExplorersProvider({ 
  children, 
  age 
}: { 
  children: ReactNode; 
  age: number;
}) {
  const currentTier: 1 | 2 = age <= 8 ? 1 : 2;
  const [wordOfDay] = useState(() => getWordOfDay(currentTier));
  const [quizState, setQuizState] = useState<QuizState>(() => {
    const pool = currentTier === 1 ? TIER_1_QUIZ : TIER_2_QUIZ;
    const questions = pickUnseenQuestions(pool, 10, `career_aid_kid_quiz_seen_t${currentTier}`);
    return {
      questions,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      score: 0,
      completed: false,
    };
  });

  const selectQuizAnswer = useCallback((answer: number) => {
    setQuizState(prev => {
      if (prev.selectedAnswer !== null) return prev;
      const question = prev.questions[prev.currentQuestionIndex];
      const isCorrect = answer === question.correctAnswer;
      return {
        ...prev,
        selectedAnswer: answer,
        score: prev.score + (isCorrect ? 1 : 0),
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setQuizState(prev => {
      if (prev.currentQuestionIndex >= prev.questions.length - 1) {
        return { ...prev, completed: true };
      }
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswer: null,
      };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    const pool = currentTier === 1 ? TIER_1_QUIZ : TIER_2_QUIZ;
    const questions = pickUnseenQuestions(pool, 10, `career_aid_kid_quiz_seen_t${currentTier}`);
    setQuizState({
      questions,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      score: 0,
      completed: false,
    });
  }, [currentTier]);

  const value = useMemo<JuniorExplorersContextValue>(() => ({
    currentTier,
    quizState,
    wordOfDay,
    selectQuizAnswer,
    nextQuestion,
    resetQuiz,
  }), [currentTier, quizState, wordOfDay, selectQuizAnswer, nextQuestion, resetQuiz]);

  return <JuniorExplorersContext.Provider value={value}>{children}</JuniorExplorersContext.Provider>;
}

export function useJuniorExplorers() {
  const ctx = useContext(JuniorExplorersContext);
  if (!ctx) throw new Error("useJuniorExplorers must be used within JuniorExplorersProvider");
  return ctx;
}
