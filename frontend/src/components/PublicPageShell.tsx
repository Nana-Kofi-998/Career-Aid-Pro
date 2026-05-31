import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import type { ReactNode } from "react";
import { PublicFooter } from "./MobileNav";
import { useAuth } from "../context/AuthContext";

export default function PublicPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen px-4 py-6 pb-10 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to={user ? "/dashboard" : "/login"} className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2 text-white shadow-glow-sm">
              <Brain className="h-6 w-6" />
            </div>
            <span className="font-bold text-white">Career-Aid Pro</span>
          </Link>
          <div className="flex gap-2 text-sm">
            {user ? (
              <Link to="/dashboard" className="btn-accent !px-4 !py-2 text-xs">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !px-4 !py-2 text-xs">
                  Sign in
                </Link>
                <Link to="/register" className="btn-accent !px-4 !py-2 text-xs">
                  Register
                </Link>
              </>
            )}
          </div>
        </header>

        <article className="glass-panel p-6 sm:p-10">
          <p className="label-caps mb-2 text-emerald-400">Learn more</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h1>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-300">
            {children}
          </div>
        </article>

        <PublicFooter />
      </div>
    </div>
  );
}
