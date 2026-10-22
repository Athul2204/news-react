import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ArticlePage from './pages/ArticlePage';
import SavedPage from './pages/SavedPage';
import SourcesPage from './pages/SourcesPage';
import ResearchPage from './pages/ResearchPage';
import SettingsPage from './pages/SettingsPage';
import InsightsPage from './pages/InsightsPage';
import { GuestOnly, RequireAuth } from './auth/AuthContext';

/* Each route change starts at the top of the page, like a normal page load */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public pages (signed-in readers are sent to the dashboard) */}
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Signed-in pages, with navbar, sidebar and footer */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
