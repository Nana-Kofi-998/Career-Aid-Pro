import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import AuthShell from "../components/AuthShell";

type RecoveryStep = "request" | "verify" | "reset" | "success";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<RecoveryStep>("request");
  
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receivedToken, setReceivedToken] = useState("");

  // Auto-detect token in URL parameter (e.g. ?token=xxx)
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setStep("reset");
    }
  }, [searchParams]);

  // Phase 1: Request Password Reset
  async function onRequestSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/auth/recovery/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Could not request password reset.");
      }

      if (data.reset_token) {
        setReceivedToken(data.reset_token);
        setToken(data.reset_token);
      }
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  // Phase 2: Save New Password
  async function onResetSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/auth/recovery/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Could not reset password.");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "input-field text-sm";

  return (
    <AnimatePresence mode="wait">
      {step === "request" && (
        <motion.div
          key="request"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
        >
          <AuthShell
            title="Recover Password"
            subtitle="Enter your username below. We'll generate a secure reset link to restore access to your hosted workspace."
          >
            <form onSubmit={onRequestSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-emerald-400" />
                  Username
                </label>
                <input
                  className={inputClass}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-100">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.99 }}
                disabled={busy}
                type="submit"
                className="btn-accent w-full disabled:opacity-60"
              >
                {busy ? "Requesting reset..." : "Generate Reset Link"}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign in
              </Link>
            </p>
          </AuthShell>
        </motion.div>
      )}

      {step === "verify" && (
        <motion.div
          key="verify"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
        >
          <AuthShell
            title="Reset Link Generated"
            subtitle="A secure recovery token has been successfully generated for your account."
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300">
                <ShieldAlert className="mb-2 h-5 w-5 text-emerald-400" />
                <p className="font-semibold text-white">Cloud Workspace Preview Mode:</p>
                <p className="mt-1 leading-5 text-xs text-slate-400">
                  Because this hosted environment does not run an active SMTP email server, we have printed your secure reset link directly below for easy presentation testing:
                </p>
                
                {receivedToken && (
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 font-mono text-[11px] text-emerald-400 break-all select-all">
                    https://career-aid-pro.onrender.com/forgot-password?token={receivedToken}
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-100">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => setStep("reset")}
                className="btn-accent w-full"
              >
                Reset Password Now
              </button>

              <p className="text-center text-sm text-slate-400">
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Request a new token
                </button>
              </p>
            </div>
          </AuthShell>
        </motion.div>
      )}

      {step === "reset" && (
        <motion.div
          key="reset"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
        >
          <AuthShell
            title="Set New Password"
            subtitle="Please enter a secure password that is at least 8 characters long."
          >
            <form onSubmit={onResetSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                  Reset Token
                </label>
                <input
                  className={inputClass}
                  placeholder="Recovery token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-100">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.99 }}
                disabled={busy}
                type="submit"
                className="btn-accent w-full disabled:opacity-60"
              >
                {busy ? "Saving new password..." : "Reset Password"}
              </motion.button>
            </form>
          </AuthShell>
        </motion.div>
      )}

      {step === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AuthShell
            title="Password Updated"
            subtitle="Your password has been successfully reset! You can now log in using your new credentials."
          >
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-bounce mb-4" />
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="btn-accent w-full"
              >
                Sign in Now
              </button>
            </div>
          </AuthShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
