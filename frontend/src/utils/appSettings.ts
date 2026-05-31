import type { AppSettings } from "../types";

export const defaultAppSettings: AppSettings = {
  webSearchEnabled: true,
  demoMode: false,
  tone: "Friendly",
  fontSize: "md",
  compactChat: false,
  reducedMotion: false,
  responseLength: "balanced",
  defaultMode: "Career Coach",
  showTimestamps: false,
  enterToSend: true,
  includePersonality: true,
  sidebarCollapsed: false,
  darkMode: true,
  themeMode: "dark",
};

export function mergeAppSettings(partial: Partial<AppSettings> | null): AppSettings {
  if (!partial) return { ...defaultAppSettings };
  const merged = { ...defaultAppSettings, ...partial };
  if (!partial.themeMode) {
    merged.themeMode = partial.darkMode === false ? "light" : "dark";
  }
  merged.darkMode = merged.themeMode === "dark";
  return merged;
}

export function applyAppSettings(settings: AppSettings) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const activeTheme = settings.themeMode === "system"
    ? (prefersDark ? "dark" : "light")
    : settings.themeMode;

  if (activeTheme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.dataset.theme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.dataset.theme = "light";
  }

  root.dataset.fontSize = settings.fontSize;
  root.dataset.compact = settings.compactChat ? "true" : "false";
  root.dataset.themeMode = settings.themeMode;
  root.classList.toggle("reduce-motion", settings.reducedMotion);
}


export function watchSystemTheme(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onChange();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
