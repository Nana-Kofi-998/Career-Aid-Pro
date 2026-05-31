import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, LogIn, User } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";

import { useEffect } from "react";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Automatically navigate to dashboard once user state is loaded/authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password);
      // Let the useEffect handle the navigation safely
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your career journey.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
            <User className="h-3.5 w-3.5 text-emerald-400" />
            Username
          </label>
          <input
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Password
          </label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end mt-1">
            <Link to="/forgot-password" className="text-xs font-semibold text-emerald-300 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        {error && (
          <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        )}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={busy}
          type="submit"
          className="btn-accent w-full disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {busy ? "Signing in…" : "Sign in"}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        New here?{" "}
        <Link to="/register" className="font-semibold text-emerald-300 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
