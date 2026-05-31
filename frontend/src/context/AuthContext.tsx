import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, loadSettings, saveSettings, setToken } from "../api/client";
import type { AppSettings, LearnerProfile, User } from "../types";
import { applyAppSettings, mergeAppSettings, watchSystemTheme } from "../utils/appSettings";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    learner_profile: LearnerProfile;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettingsState] = useState<AppSettings>(() =>
    mergeAppSettings(loadSettings() as Partial<AppSettings> | null)
  );

  const setSettings = useCallback((s: AppSettings) => {
    setSettingsState(s);
    saveSettings(s);
    applyAppSettings(s);
  }, []);

  useEffect(() => {
    applyAppSettings(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.dataset.kidMode = user?.age && user.age < 13 ? "true" : "false";
  }, [user]);

  useEffect(() => {
    if (settings.themeMode !== "system") return;
    return watchSystemTheme(() => applyAppSettings(settings));
  }, [settings]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await api.me();
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshUser();
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (payload: {
      username: string;
      password: string;
      first_name: string;
      last_name: string;
      age: number;
      gender: string;
      learner_profile: LearnerProfile;
    }) => {
      const res = await api.register(payload);
      setToken(res.access_token);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      settings,
      setSettings,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, settings, setSettings, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
