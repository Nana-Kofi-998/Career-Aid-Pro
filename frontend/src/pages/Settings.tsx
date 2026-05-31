import { motion } from "framer-motion";
import {
  Database,
  Download,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Monitor,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { AppSettings, ChatMode, FontSize, ResponseLength, ThemeMode } from "../types";

import { defaultAppSettings } from "../utils/appSettings";

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm">
        <span className="font-medium text-white">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-slate-400">
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-emerald-500" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function SelectField<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="py-3">
      <label className="block text-sm">
        <span className="font-medium text-white">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-slate-400">
            {description}
          </span>
        )}
        <select
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1a1a2e]">
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ThemeChoice({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
}) {
  const options: { value: ThemeMode; label: string; icon: typeof Moon }[] = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="py-3">
      <p className="text-sm font-medium text-white">Theme</p>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        {options.map(({ value: optionValue, label, icon: Icon }) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              value === optionValue
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, settings, setSettings, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [local, setLocal] = useState<AppSettings>(settings);
  const [personality, setPersonality] = useState(user?.personality_summary || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const genderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (genderRef.current && !genderRef.current.contains(e.target as HTMLElement)) {
        setGenderOpen(false);
      }
    }
    if (genderOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [genderOpen]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  useEffect(() => {
    setPersonality(user?.personality_summary || "");
  }, [user]);

  const [profileFirst, setProfileFirst] = useState("");
  const [profileLast, setProfileLast] = useState("");
  const [profileAge, setProfileAge] = useState<number>(18);
  const [profileGender, setProfileGender] = useState("");

  useEffect(() => {
    if (user) {
      setProfileFirst(user.first_name || "");
      setProfileLast(user.last_name || "");
      setProfileAge(user.age || 18);
      setProfileGender(user.gender || "");
    }
  }, [user]);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await api.updateProfile({
        first_name: profileFirst.trim(),
        last_name: profileLast.trim(),
        age: profileAge,
        gender: profileGender.trim(),
      });
      setProfileMsg("Profile updated.");
      await refreshUser();
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (e) {
      setProfileMsg(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  function patch<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setLocal((s) => ({ ...s, [key]: value }));
  }

  function applySettings() {
    setSettings(local);
    setMsg("Settings saved successfully.");
    setTimeout(() => setMsg(""), 3000);
  }

  function resetToDefaults() {
    const reset = { ...defaultAppSettings };
    setLocal(reset);
    setSettings(reset);
    setMsg("Settings reset to defaults.");
    setTimeout(() => setMsg(""), 3000);
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(local, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "career-aid-pro-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Settings exported successfully.");
    setTimeout(() => setMsg(""), 3000);
  }

  async function savePersonality() {
    await api.updatePersonality(personality);
    setMsg("Personality summary saved.");
    setTimeout(() => setMsg(""), 3000);
  }

  async function clearHistory() {
    await api.clearChats();
    setMsg("All chats deleted.");
    setConfirmClear(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function deleteAccount() {
    await api.deleteAccount();
    logout();
    navigate("/login");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
          <SlidersHorizontal className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Customize your workspace and preferences</p>
        </div>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
        >
          {msg}
        </motion.div>
      )}

{/* Account Section */}
        <section
          className={`relative overflow-visible rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl ${
            genderOpen ? "z-50" : "z-10"
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <User className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>

         {profileMsg && (
           <p className={`text-sm mb-4 rounded-lg px-3 py-2 ${
             profileMsg.includes("Could not")
               ? "bg-red-500/10 text-red-400"
               : "bg-emerald-500/10 text-emerald-400"
           }`}>
             {profileMsg}
           </p>
         )}

         <div className="grid gap-4 sm:grid-cols-2">
           <div>
             <label className="mb-1 block text-xs text-slate-500">First name</label>
             <input
               className="mt-0.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
               value={profileFirst}
               onChange={(e) => setProfileFirst(e.target.value)}
             />
           </div>
           <div>
             <label className="mb-1 block text-xs text-slate-500">Last name</label>
             <input
               className="mt-0.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
               value={profileLast}
               onChange={(e) => setProfileLast(e.target.value)}
             />
           </div>
           <div>
             <label className="mb-1 block text-xs text-slate-500">Username</label>
             <p className="mt-0.5 font-medium text-slate-300">{user?.username}</p>
           </div>
           <div>
             <label className="mb-1 block text-xs text-slate-500">Age</label>
             <input
               type="number"
               min={14}
               max={120}
               className="mt-0.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
               value={profileAge}
               onChange={(e) => setProfileAge(parseInt(e.target.value || "18", 10))}
             />
           </div>
            <div className="relative z-20 overflow-visible sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Gender</label>
              <div ref={genderRef} className="relative mt-0.5 overflow-visible">
                <button
                  type="button"
                  onClick={() => setGenderOpen(!genderOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 hover:border-emerald-500/30"
                >
                  <span>{profileGender}</span>
                  <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${genderOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
{genderOpen && (
                   <div className="absolute left-0 right-0 top-full z-[999] mt-1 rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl ring-1 ring-black/50">
                     {["Prefer not to say", "Male", "Female", "Non-binary"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => { setProfileGender(g); setGenderOpen(false); }}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                          profileGender === g
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        {profileGender === g && (
                          <svg className="mr-2 h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        )}
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
         </div>

         <div className="mt-4 flex gap-3">
           <button
             type="button"
             onClick={saveProfile}
             disabled={savingProfile}
             className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
           >
             <Save className="h-4 w-4" />
             {savingProfile ? "Saving…" : "Save Changes"}
           </button>
           <Link
             to="/dashboard"
             className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
           >
             View Dashboard →
           </Link>
         </div>
       </section>

{/* Appearance Section */}
       <section className="relative z-0 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
         <div className="mb-6 flex items-center gap-3">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
             <Palette className="h-4 w-4 text-violet-400" />
           </div>
           <h2 className="text-lg font-semibold text-white">Appearance</h2>
         </div>
        
<div className="divide-y divide-white/5">
           <ThemeChoice
             value={local.themeMode}
             onChange={(v) => {
               const next = { ...local, themeMode: v, darkMode: v !== "light" };
               setLocal(next);
               setSettings(next);
             }}
           />
           <SelectField<FontSize>

             label="Text size"
             value={local.fontSize}
             options={[
               { value: "sm", label: "Small" },
               { value: "md", label: "Medium" },
               { value: "lg", label: "Large" },
             ]}
             onChange={(v) => patch("fontSize", v)}
           />
           <Toggle
             label="Compact chat layout"
             description="Tighter spacing between messages"
             checked={local.compactChat}
             onChange={(v) => patch("compactChat", v)}
           />
           <Toggle
             label="Reduce motion"
             description="Minimize animations across the app"
             checked={local.reducedMotion}
             onChange={(v) => patch("reducedMotion", v)}
           />
           <Toggle
             label="Start with sidebar collapsed"
             description="Hide the sidebar by default on desktop"
             checked={local.sidebarCollapsed}
             onChange={(v) => patch("sidebarCollapsed", v)}
           />
         </div>
      </section>

{/* Chat Preferences Section */}
       <section className="relative z-0 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
         <div className="mb-6 flex items-center gap-3">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
             <Moon className="h-4 w-4 text-cyan-400" />
           </div>
           <h2 className="text-lg font-semibold text-white">Chat Preferences</h2>
         </div>
        
        <div className="divide-y divide-white/5">
          <SelectField<ChatMode>
            label="Default chat mode"
            description="Used when you start a new conversation"
            value={local.defaultMode}
            options={[
              { value: "Career Coach", label: "Career Coach" },
              { value: "Mental Health", label: "Mental Wellness" },
              { value: "free", label: "Open Chat" },
            ]}
            onChange={(v) => patch("defaultMode", v)}
          />
          <SelectField<AppSettings["tone"]>
            label="AI tone"
            value={local.tone}
            options={[
              { value: "Friendly", label: "Friendly" },
              { value: "Professional", label: "Professional" },
              { value: "Casual", label: "Casual" },
            ]}
            onChange={(v) => patch("tone", v)}
          />
          <SelectField<ResponseLength>
            label="Response length"
            description="How detailed the AI replies should be"
            value={local.responseLength}
            options={[
              { value: "concise", label: "Concise (short)" },
              { value: "balanced", label: "Balanced" },
              { value: "detailed", label: "Detailed" },
            ]}
            onChange={(v) => patch("responseLength", v)}
          />
          <Toggle
            label="Web search (Open Chat)"
            description="Fetch live information for general questions"
            checked={local.webSearchEnabled}
            onChange={(v) => patch("webSearchEnabled", v)}
          />
          <Toggle
            label="Preview response mode"
            description="Use sample responses when the AI service is unavailable"
            checked={local.demoMode}
            onChange={(v) => patch("demoMode", v)}
          />
          <Toggle
            label="Use personality profile in chats"
            description="Include temperament assessment in AI context"
            checked={local.includePersonality}
            onChange={(v) => patch("includePersonality", v)}
          />
          <Toggle
            label="Show message timestamps"
            checked={local.showTimestamps}
            onChange={(v) => patch("showTimestamps", v)}
          />
          <Toggle
            label="Enter to send"
            description="Press Enter to send; Shift+Enter for new line"
            checked={local.enterToSend}
            onChange={(v) => patch("enterToSend", v)}
          />
        </div>

        <button
          type="button"
          onClick={applySettings}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
        >
          Save Preferences
        </button>
      </section>

{/* Personality Section */}
       <section className="relative z-0 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
         <div className="mb-6 flex items-center gap-3">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
             <Sparkles className="h-4 w-4 text-rose-400" />
           </div>
           <h2 className="text-lg font-semibold text-white">Temperament & Personality</h2>
         </div>
        
        <p className="text-sm text-slate-400 mb-4">
          Take the structured assessment so Career Coach and Mental Wellness can tailor advice to
          your style. You can also add free-form notes below.
        </p>
        
        <Link
          to="/personality"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-300 hover:-translate-y-0.5 mb-4"
        >
          Open Temperament Assessment
        </Link>

        <div className="mt-4">
          <label className="block text-sm font-medium text-white mb-2">
            Personal Notes
          </label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="Add optional notes for the AI..."
          />
          <button
            type="button"
            onClick={savePersonality}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Save Notes
          </button>
        </div>
      </section>

{/* Data & Backup Section */}
       <section className="relative z-0 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
         <div className="mb-6 flex items-center gap-3">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
             <Database className="h-4 w-4 text-cyan-400" />
           </div>
           <h2 className="text-lg font-semibold text-white">Data & Backup</h2>
         </div>
        
        <p className="text-sm text-slate-400 mb-4">
          Export your preferences. Chat history stays with your account.
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportSettings}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Settings
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      </section>

{/* Danger Zone */}
       <section className="relative z-0 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 backdrop-blur-xl">
         <div className="mb-6 flex items-center gap-3">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
             <Shield className="h-4 w-4 text-red-400" />
           </div>
           <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
         </div>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={confirmClear}
              onChange={(e) => setConfirmClear(e.target.checked)}
              className="h-4 w-4 rounded border-red-500/50 text-red-500 focus:ring-red-500/20"
            />
            <span className="text-sm text-slate-300">
              I understand this will delete all saved chats permanently
            </span>
          </label>
          
          <button
            type="button"
            disabled={!confirmClear}
            onClick={clearHistory}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
          >
            Clear Chat History
          </button>

          {deleteStep === 0 ? (
            <button
              type="button"
              onClick={() => setDeleteStep(1)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Delete my account...
            </button>
          ) : (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm text-red-300 mb-3">
                This action is permanent and cannot be undone. All your data will be deleted.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={deleteAccount}
                  className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-colors"
                >
                  Confirm Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
