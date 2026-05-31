import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { learnerProfileOptions } from "../utils/productJourney";
import type { LearnerProfile } from "../types";

import { useEffect } from "react";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm: "",
    first_name: "",
    last_name: "",
    age: 18,
    gender: "Prefer not to say",
    learner_profile: "shs_student" as LearnerProfile,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Automatically navigate to onboarding once registration succeeds and user state is loaded
  useEffect(() => {
    if (user) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        age: form.age,
        gender: form.gender,
        learner_profile: form.learner_profile,
      });
      // Let the useEffect handle the navigation safely
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setBusy(false);
    }
  }

  const inputClass = "input-field text-sm";

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Career-Aid Pro and access your personalized hosted workspace."
    >
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Username
          </label>
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            First name
          </label>
          <input
            className={inputClass}
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Last name
          </label>
          <input
            className={inputClass}
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Age
          </label>
          <input
            type="number"
            min={5}
            max={120}
            className={inputClass}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
            required
          />
        </motion.div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Gender
          </label>
          <select
            className={inputClass}
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          >
            {["Prefer not to say", "Female", "Male", "Non-binary"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Which best describes you now?
          </label>
          <select
            className={inputClass}
            value={form.learner_profile}
            onChange={(e) => setForm((f) => ({ ...f, learner_profile: e.target.value as LearnerProfile }))}
          >
            {learnerProfileOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            This helps us show the right Guidance Department tools first.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Password
          </label>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Confirm password
          </label>
          <input
            type="password"
            className={inputClass}
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            required
          />
        </div>
        {error && (
          <p className="sm:col-span-2 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}
        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={busy}
          type="submit"
          className="btn-accent sm:col-span-2 w-full disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {busy ? "Creating account…" : "Create account"}
        </motion.button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-emerald-300 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
