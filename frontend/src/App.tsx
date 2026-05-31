import { Navigate, Route, Routes } from "react-router-dom";
import ChatShell from "./components/chat/ChatShell";
import KidLayout from "./components/KidLayout";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import ChatPage from "./pages/Chat";
import CvBuilderPage from "./pages/CvBuilder";
import CvToolsPage from "./pages/CvTools";
import DashboardPage from "./pages/Dashboard";

import KidPersonalityPage from "./pages/KidPersonality";
import LoginPage from "./pages/Login";
import PersonalityPage from "./pages/Personality";
import RegisterPage from "./pages/Register";
import SettingsPage from "./pages/Settings";

import AboutPage from "./pages/About";
import FaqPage from "./pages/Faq";
import CareerPathPage from "./pages/CareerPath";
import GuidanceHubPage from "./pages/GuidanceHub";
import InterviewPrepPage from "./pages/InterviewPrep";
import OnboardingPage from "./pages/Onboarding";
import { useRouteTitle } from "./hooks";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-emerald-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  const isKid = user?.age ? user.age < 13 : false;
  useRouteTitle();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route
        path="/chat/*"
        element={
          <ProtectedRoute>
            <ChatShell isKid={isKid} />
          </ProtectedRoute>
        }
      >
        <Route index element={<ChatPage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute>
            {isKid ? <KidLayout /> : <Layout />}
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        {isKid ? (
          <Route path="/personality" element={<KidPersonalityPage />} />
        ) : (
          <Route path="/personality" element={<PersonalityPage />} />
        )}
        <Route path="/settings" element={<SettingsPage />} />
        {!isKid && (
          <>
            <Route path="/cv-tools" element={<CvToolsPage />} />
            <Route path="/cv-tools/cv-analyzer" element={<CvToolsPage />} />
            <Route path="/cv-tools/cv-builder" element={<CvToolsPage />} />
            <Route path="/guidance" element={<GuidanceHubPage />} />
            <Route path="/career-path" element={<CareerPathPage />} />
            <Route path="/interview-prep" element={<InterviewPrepPage />} />

            {/* Back-compat route */}
            <Route path="/cv-builder" element={<CvBuilderPage />} />
          </>
        )}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />

        <Route path="/history" element={<Navigate to="/chat" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
