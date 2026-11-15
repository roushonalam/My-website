import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-sm space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 text-[#1E1B4B]">
              <Logo size={28} />
              <span className="text-base font-bold tracking-tight">EduGenius AI</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-600">
              Next-Gen Bilingual AI Learning Platform for Class 9–12, SSC/HSC, University, IELTS, and Job Preparation students.
            </p>
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
              <span>
                BYOK Privacy: Your Google AI Studio key stays strictly in your browser and is sent only to Google.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:gap-12">
            <div className="space-y-2.5">
              <h3 className="font-semibold text-[#1E1B4B]">Platform</h3>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <Link to="/study-hub" className="hover:text-[#4338CA]">
                    AI Study Hub
                  </Link>
                </li>
                <li>
                  <Link to="/quiz" className="hover:text-[#4338CA]">
                    Smart AI Quiz
                  </Link>
                </li>
                <li>
                  <Link to="/tutor" className="hover:text-[#4338CA]">
                    Live AI Tutor
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-semibold text-[#1E1B4B]">Configuration</h3>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <Link to="/settings" className="hover:text-[#4338CA]">
                    API Key &amp; Settings
                  </Link>
                </li>
                <li>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#4338CA]"
                  >
                    Google AI Studio
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Apex Edutech Labs Inc. · EduGenius AI MVP</p>
          <p>Static Client-Side Architecture · Powered by Google Gemini API</p>
        </div>
      </div>
    </footer>
  );
}
