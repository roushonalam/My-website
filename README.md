# EduGenius AI — Next-Gen AI Learning Platform

**Client Project:** Apex Edutech Labs Inc. (Doc-ID `#PRJ-EDU-2026-V1`)  
**Type:** Static Client-Side Bilingual EdTech Web Application (Bengali + English)  
**AI Engine:** Google Gemini API via `@google/genai` (Bring Your Own Key — BYOK)

---

## Overview

EduGenius AI is a live, bilingual (Bengali + English) AI learning platform built for Class 9–12 students, SSC/HSC candidates, university & admission learners, IELTS/job seekers, and educators.

It operates as a 100% static single-page application (`HashRouter`) with zero backend servers storing user credentials—students supply their own Google AI Studio API key directly in the browser.

---

## Key Features

1. **Landing & Quick Ask (`/`)**
   - Bilingual hero with an interactive question box that routes directly into the AI Tutor and auto-sends.
   - Quick-start sample prompts, platform feature cards, audience showcase, and clearly labeled **Demo figures** benchmark strip.
2. **AI Study Hub (`/study-hub`)**
   - Subject (`Science`, `Mathematics`, `English`, `General Knowledge`, `Programming`) & academic level (`Beginner`, `SSC`, `HSC`, `University`, `Job Preparation`) selectors.
   - Formats: `Short Summary`, `Detailed Explanation`, and `Flashcard Points`.
   - Output language: `Bengali`, `English`, or `Both`.
   - Strict `responseSchema` + `Zod` validation producing 6 structured Markdown cards (`Simple Explanation`, `Concept Definition`, `Real-world Analogy`, `Practical Examples`, `Important Points`, `Summary`) with Copy, `.md`, and `.txt` export.
3. **Smart AI Quiz (`/quiz`)**
   - Generates 5 or 10 MCQs by Subject, Chapter/Topic, and Difficulty (`Easy`, `Medium`, `Hard`) with automatic JSON retry + Zod validation.
   - Correct answers and explanations remain strictly hidden until after submission.
   - Live score, color + icon + text feedback, detailed explanations, final accuracy summary, per-question review, and `Retry Quiz (Same Set)` / `New Quiz`.
4. **Live AI Tutor (`/tutor`)**
   - Persistent multi-turn chat (`localStorage`, trimmed context window) with bilingual system mentorship, Markdown & table rendering, and inline error retry.
   - Quick Bengali chips including `পড়ার রুটিন তৈরি করো`, which generates a structured 7-day weekly study routine table.
5. **Settings & BYOK Key Management (`/settings`)**
   - Browser-only API key storage (`sessionStorage` by default, optional `localStorage` via *Remember on this device*).
   - Real `Test API Connection` diagnostic, live model discovery (`Flash (fast)` / `Pro (high quality)`), and temperature slider (`0.2` Accurate to `0.7` Creative).

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Routing:** `react-router-dom` (`HashRouter` for static hosting compatibility)
- **AI SDK:** `@google/genai` (called directly from the browser using `x-goog-api-key` headers)
- **Validation & Rendering:** `zod`, `react-markdown`, `remark-gfm`, `lucide-react`
- **Typography:** Google Fonts (`Noto Sans Bengali`, `Inter`, `JetBrains Mono`)

---

## Local Setup & Scripts

### Prerequisites
- Node.js `>= 18`
- npm `>= 9`

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (port 3000)
npm run dev

# 3. Type-check
npm run lint

# 4. Build static production bundle into dist/
npm run build

# 5. Preview the production build locally
npm run preview
```

---

## How to Get & Use a Google AI Studio API Key

1. Open [Google AI Studio](https://aistudio.google.com/) and sign in with your Google account.
2. Click **Get API key** → **Create API key**.
3. Open **EduGenius AI → Settings** (`#/settings`), paste the key into the **API Key** field, and click **Save Key**.
4. Click **Test API Connection** to verify live connectivity and load available Gemini models.

---

## Security Notes

- **Never commit API keys** to source code, `.env` files, commits, or screenshots.
- **Browser-Only Storage:** Your key is stored only in `sessionStorage` (cleared when the tab closes) or `localStorage` if you check **Remember on this device**.
- **Header-Only Transport:** `@google/genai` transmits the key via the `x-goog-api-key` HTTP header, never in URL query strings.
- **Restrict Your Key:** In Google AI Studio / Google Cloud Console, restrict your key by **HTTP referrer** (your deployed origin, e.g., `https://your-app.vercel.app/*`) and limit it to the **Generative Language API**. Avoid saving your key on shared or public computers.

---

## Deployment Guides (Static Build)

Because EduGenius AI uses `HashRouter` and relative Vite assets (`base: './'`), it deploys cleanly to any static host without server rewrites.

### 1. Vercel
1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/).
3. Framework Preset: **Vite** · Build Command: `npm run build` · Output Directory: `dist`.
4. Click **Deploy** (no server environment variables required for BYOK).

### 2. Netlify
1. Push the repository to GitHub.
2. Create a new site from Git in [Netlify](https://www.netlify.com/).
3. Build Command: `npm run build` · Publish Directory: `dist`.
4. Click **Deploy site**.

### 3. GitHub Pages

> **Important (Avoid Blank White Page):** Do **not** set GitHub Pages to "Deploy from a branch (`main` / `/(root)`)". GitHub Pages must serve the compiled `dist/` bundle—not the raw root `index.html` (which points to `/src/main.tsx`).

**Option A — Automatic via GitHub Actions (Recommended):**
1. Push your repository to GitHub (the included `.github/workflows/deploy.yml` workflow automatically runs `npm ci` and `npm run build` with `VITE_BASE_PATH=/<repo-name>/`).
2. In your GitHub repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. The workflow will build and publish `dist/` (including `.nojekyll` and `404.html`).

**Option B — Manual `gh-pages` Branch:**
```bash
# Replace <repo-name> with your GitHub repository name (or omit for relative './')
VITE_BASE_PATH=/<repo-name>/ npm run build
npx gh-pages -d dist
```
Then set **Settings → Pages → Source** to **Deploy from a branch (`gh-pages` / `/(root)`)**.

---

## Troubleshooting

- **"API Key Not Configured" on Study Hub / Quiz / Tutor:** Go to **Settings**, paste your Google AI Studio key, click **Save Key**, and run **Test API Connection**.
- **400 / 401 / 403 Error:** Verify the key has no trailing spaces, is active in Google AI Studio, and—if HTTP referrer restrictions are enabled—allows your current domain (`localhost` or your deployed URL).
- **429 Rate Limit:** Free-tier Gemini keys have per-minute request quotas. Wait 20–30 seconds and click **আবার চেষ্টা করুন (Retry)**.
- **404 Model Not Found:** Click **Refresh Models** in **Settings** and select an available **Flash (fast)** or **Pro (high quality)** model.
