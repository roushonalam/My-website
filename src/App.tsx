import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ToastProvider } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { QuizPage } from './pages/QuizPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudyHubPage } from './pages/StudyHubPage';
import { TutorPage } from './pages/TutorPage';

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E1B4B]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/study-hub" element={<StudyHubPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/tutor" element={<TutorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </ToastProvider>
  );
}
