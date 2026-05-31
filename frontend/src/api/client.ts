import type {
  ChatMessage,
  ChatMode,
  ChatSummary,
  CvAnalysis,
  DashboardStats,
  LearnerProfile,
  User,
} from "../types";

const TOKEN_KEY = "career_aid_token";
const SETTINGS_KEY = "career_aid_settings";

// API Configuration
const API_TIMEOUT = 60000; // 60 seconds
const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error("Failed to store token:", e);
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  detail: string;
  requestId?: string;

  constructor(message: string, status: number, detail?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail || message;
    this.requestId = requestId;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const canRetry = method === "GET" || method === "HEAD";
  const attempts = canRetry ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await apiFetchOnce<T>(path, options);
    } catch (error) {
      const retryable =
        error instanceof ApiError && RETRYABLE_STATUS.has(error.status) && attempt < attempts - 1;
      if (!retryable) throw error;
      await sleep(400 * (attempt + 1));
    }
  }

  throw new ApiError("Request failed. Please try again.", 0);
}

async function apiFetchOnce<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>) || {},
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(path, { 
      ...options, 
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const requestId = res.headers.get("X-Request-Id");

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const err = await res.json();
        detail = err.detail || detail;
      } catch {
        /* ignore */
      }
      throw new ApiError(
        typeof detail === "string" ? detail : JSON.stringify(detail),
        res.status,
        detail,
        requestId || undefined
      );
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ApiError("Request timeout. Please try again.", 408);
      }
      if (error.message.includes("Failed to fetch")) {
        throw new ApiError("Cannot connect to Career-Aid Pro right now. Please try again shortly.", 0);
      }
      throw new ApiError(error.message, 0);
    }
    throw new ApiError("An unknown error occurred", 0);
  }
}

async function apiBlobFetch(
  path: string,
  options: RequestInit = {}
): Promise<{ blob: Blob; filename: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>) || {},
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return {
    blob: await res.blob(),
    filename: match?.[1] || "career-aid-file",
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  login(username: string, password: string) {
    return apiFetch<{ access_token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  register(payload: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    learner_profile: LearnerProfile;
  }) {
    return apiFetch<{ access_token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  me() {
    return apiFetch<User>("/api/users/me");
  },

  dashboard() {
    return apiFetch<DashboardStats>("/api/users/dashboard");
  },

  listChats() {
    return apiFetch<ChatSummary[]>("/api/chats");
  },

  getChat(id: number) {
    return apiFetch<{ id: number; mode: string; title: string | null; history: ChatMessage[] }>(
      `/api/chats/${id}`
    );
  },

  createChat(mode: ChatMode, title = "New chat") {
    return apiFetch<{ id: number; mode: string; history: ChatMessage[] }>("/api/chats", {
      method: "POST",
      body: JSON.stringify({ mode, title }),
    });
  },

  clearChats() {
    return apiFetch<{ ok: boolean }>("/api/chats", { method: "DELETE" });
  },

  deleteChat(id: number) {
    return apiFetch<{ ok: boolean }>(`/api/chats/${id}`, { method: "DELETE" });
  },

  personalityQuestions(params?: {
    randomize?: boolean;
    count?: number;
    seed?: number | null;
  }) {
    const qs = new URLSearchParams();
    if (params) {
      if (params.randomize !== false) qs.set("randomize", "true");
      if (params.count) qs.set("count", String(params.count));
      if (params.seed !== undefined && params.seed !== null)
        qs.set("seed", String(params.seed));
    }
    const url = "/api/personality/questions" + (qs.toString() ? `?${qs}` : "");
    return apiFetch<{ questions: { id: string; text: string }[]; seed: number }>(
      url
    );
  },

  personalityProfile() {
    return apiFetch<{ has_profile: boolean; profile: Record<string, unknown> | null }>(
      "/api/personality/profile"
    );
  },

  submitPersonality(answers: Record<string, number>, seed: number) {
    return apiFetch<{ ok: boolean; profile: Record<string, unknown> }>(
      "/api/personality/submit",
      { method: "POST", body: JSON.stringify({ answers, seed }) }
    );
  },

  submitKidPersonality(answers: Record<string, number>) {
    return apiFetch<{ ok: boolean; profile: string }>(
      "/api/personality/kid-submit",
      { method: "POST", body: JSON.stringify({ answers }) }
    );
  },

  updatePersonality(summary: string) {
    return apiFetch<{ ok: boolean }>("/api/users/me/personality", {
      method: "PATCH",
      body: JSON.stringify({ personality_summary: summary }),
    });
  },

  updateProfile(payload: {
    first_name?: string;
    last_name?: string;
    age?: number;
    gender?: string;
    learner_profile?: LearnerProfile;
  }) {
    return apiFetch<{ ok: boolean; user: User }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteAccount() {
    return apiFetch<{ ok: boolean }>("/api/users/me", { method: "DELETE" });
  },

  scoreCv(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<{ analysis: CvAnalysis }>("/api/cv/score", {
      method: "POST",
      body: fd,
    });
  },

  extractCv(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<{ text: string; filename: string }>("/api/cv/extract", {
      method: "POST",
      body: fd,
    });
  },

  processCv(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<{ text: string; filename: string; analysis: CvAnalysis }>(
      "/api/cv/process",
      { method: "POST", body: fd }
    );
  },

  scoreCvText(text: string) {
    return apiFetch<{ analysis: CvAnalysis }>("/api/cv/score-text", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  generateCv(payload: Record<string, unknown>) {
    return apiFetch<{ html: string; ai_note: string | null; used_ai: boolean }>(
      "/api/cv-builder/generate",
      { method: "POST", body: JSON.stringify(payload) }
    );
  },

  analyzeCv(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<{ text: string; filename: string; analysis: CvAnalysis; feedback_report: string | null }>(
      "/api/cv-analyzer/analyze",
      { method: "POST", body: fd }
    );
  },


  health() {
  return apiFetch<{ status: string; ai_service_online: boolean }>("/api/health");
  },

  async generateChatFile(payload: {
    type: "word" | "pdf" | "image";
    text?: string;
    prompt?: string;
    title?: string;
  }) {
    const body =
      payload.type === "image"
        ? { prompt: payload.prompt || payload.text || "", title: payload.title || "Generated Chat Image" }
        : { text: payload.text || "", title: payload.title || "Career Aid Chat Response" };
    const { blob, filename } = await apiBlobFetch(`/api/artifacts/${payload.type}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    downloadBlob(blob, filename);
  },
};

export interface StreamChatOptions {
  message: string;
  mode: ChatMode;
  history: ChatMessage[];
  docContext?: string;
  chatId?: number | null;
  tone?: string;
  webSearchEnabled?: boolean;
  demoMode?: boolean;
  responseLength?: string;
  includePersonality?: boolean;
  file?: { base64: string; mimeType: string; name: string } | null;
  onToken: (text: string) => void;
  onDone: (payload: {
    content: string;
    history: ChatMessage[];
    chat_id: number | null;
  }) => void;
  onError: (err: Error) => void;
}

export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes for chat

  try {
    const res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: opts.message,
        mode: opts.mode,
        history: opts.history,
        doc_context: opts.docContext || "",
        chat_id: opts.chatId ?? null,
        tone: opts.tone || "Friendly",
        web_search_enabled: opts.webSearchEnabled ?? true,
        demo_mode: opts.demoMode ?? false,
        response_length: opts.responseLength || "balanced",
        use_personality: opts.includePersonality ?? true,
        file: opts.file,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok || !res.body) {
      let detail = `Chat failed (${res.status})`;
      try {
        const err = await res.json();
        if (err?.detail) detail = String(err.detail);
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";
    let receivedDone = false;

    const processBlock = (block: string) => {
      const lines = block.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        if (event === "token") {
          const text = parsed.text || "";
          accumulated += text;
          opts.onToken(text);
        }
        if (event === "done") {
          receivedDone = true;
          opts.onDone(parsed);
        }
        if (event === "error") {
          opts.onError(new Error(parsed.detail || "Chat stream failed."));
        }
      } catch (e) {
        opts.onError(e instanceof Error ? e : new Error(String(e)));
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const block of parts) {
        processBlock(block);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      processBlock(buffer);
    }

    if (!receivedDone && accumulated.trim()) {
      const fallbackHistory: ChatMessage[] = [
        ...opts.history,
        { role: "user", content: opts.message },
        { role: "ai", content: accumulated.trim() },
      ];
      opts.onDone({
        content: accumulated.trim(),
        history: fallbackHistory,
        chat_id: opts.chatId ?? null,
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout. Please try again.");
      }
      throw error;
    }
    throw new Error("An unknown error occurred");
  }
}

export function loadSettings(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function saveSettings(settings: object) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}
