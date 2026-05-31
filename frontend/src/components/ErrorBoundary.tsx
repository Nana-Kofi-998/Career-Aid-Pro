import React from "react";
import { RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Application error boundary caught an error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Career-Aid Pro protected your session from a crash. Refresh the workspace to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </section>
      </main>
    );
  }
}
