export type ChatMode = "Career Coach" | "Mental Health" | "free";
export type LearnerProfile =
  | "shs_student"
  | "shs_graduate_transition"
  | "university_workforce"
  | "general";

export interface User {
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  learner_profile: LearnerProfile;
  personality_summary: string;
}

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  ts?: string;
  file?: {
    mimeType: string;
    name?: string;
    size?: number;
    extractedChars?: number;
    hasExtractedText?: boolean;
    base64?: string;
  };
  file_text?: string;
}

export interface ChatSummary {
  id: number;
  mode: string;
  title: string | null;
  updated_at: string | null;
  message_count: number;
  preview: string;
}

export interface DashboardStats {
  total_chats: number;
  cv_scores: number;
  last_login: string | null;
  ai_service_online: boolean;
}

export interface CvAnalysis {
  total_score: number;
  breakdown: Record<string, number>;
  feedback: string[];
  word_count: number;
}

export type FontSize = "sm" | "md" | "lg";
export type ResponseLength = "concise" | "balanced" | "detailed";
export type ThemeMode = "dark" | "light" | "system";

export interface AppSettings {
  webSearchEnabled: boolean;
  demoMode: boolean;
  tone: "Friendly" | "Professional" | "Casual";
  fontSize: FontSize;
  compactChat: boolean;
  reducedMotion: boolean;
  responseLength: ResponseLength;
  defaultMode: ChatMode;
  showTimestamps: boolean;
  enterToSend: boolean;
  includePersonality: boolean;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  themeMode: ThemeMode;
}
