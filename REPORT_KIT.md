# EduGenius AI — PDF Report Kit

> Use this kit to assemble your final academic / client submission PDF report for **EduGenius AI (Doc-ID #PRJ-EDU-2026-V1)**.

---

## (a) Cover Page Template

```text
========================================================================
                     APEX EDUTECH LABS INC. · PROJECT REPORT
========================================================================

  PROJECT TITLE:    EduGenius AI — Next-Gen AI Learning Platform
  PROJECT ID:       #PRJ-EDU-2026-V1
  SUBTITLE:         Bilingual (Bengali + English) Gemini-Powered MVP

------------------------------------------------------------------------
  SUBMITTED BY:     [Your Full Name]
  STUDENT / ROLL ID:[Your Roll / Student ID]
  BATCH / SECTION:  [Your Batch / Cohort]
  INSTITUTION:      [Your University / Training Center]
  SUBMISSION DATE:  [DD Month YYYY]
------------------------------------------------------------------------
```

---

## (b) Project Links (Fill Before Exporting PDF)

- **Live Deployed URL:** `[https://your-edugenius-deployment-url]`
- **GitHub Source Repository:** `[https://github.com/your-username/edugenius-ai]`
- **Tech Stack Summary:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router (`HashRouter`), `@google/genai`, Zod, `react-markdown`

---

## (c) Numbered Screenshot Checklist

Capture clean screenshots (hide or mask your real API key in any Settings screenshot!) and place them in order in your PDF:

1. **Google AI Studio API Key + Model + System Prompt Setup:**
   - Screenshot showing Google AI Studio API key creation screen (key masked) + `Settings` model selector & `src/constants/prompts.ts` system prompt architecture.
2. **Home / Hero Page (`#/`):**
   - Full hero headline (`Learn Smarter. Understand Faster. Grow Further.`), Bengali subtitle, interactive `Ask AI` input, demo figures strip (with visible `Demo figures` label), and 3 feature cards.
3. **AI Study Hub (`#/study-hub`) with Generated Output:**
   - Filled form (`Subject`, `Level`, `Topic`, `Format`, `Language`) alongside the 6 structured Markdown cards and Copy / `.md` / `.txt` buttons.
4. **Smart AI Quiz (`#/quiz`) Question + Post-Submit Explanation:**
   - Active question screen after submitting an answer, showing emerald/red feedback with check/cross icon, the correct option, and detailed Markdown explanation.
5. **Live AI Tutor (`#/tutor`) with Quick Chips & Weekly Plan:**
   - Chat conversation showing Bengali quick chips and a generated structured response (or 7-day weekly study routine table).
6. **Settings Page (`#/settings`):**
   - Masked API key input, `Remember on this device` checkbox, `Connected` badge after `Test API Connection`, live model dropdown, temperature slider (`0.2`–`0.7`), and security notice.
7. **Mobile Viewport (`360px` width):**
   - Responsive mobile view with hamburger navigation menu open or clean single-column layout without horizontal overflow.
8. **Desktop Viewport (`1280px` / `1440px` width):**
   - Full two-column Study Hub or Landing layout demonstrating spacing, typography (`Noto Sans Bengali` + `Inter`), and contrast.

---

## (d) Freelancer Declaration Note (~100 Words — Editable)

> *Edit the bracketed details if needed to reflect your exact workflow before exporting your PDF:*

I independently designed, built, and verified **EduGenius AI** as a bilingual (Bengali and English) static web application powered by Google's `@google/genai` SDK. A key engineering challenge was ensuring reliable structured JSON outputs for Study Notes and MCQ Quizzes while preventing quiz answers from leaking into the DOM before submission. I solved this by enforcing strict `responseSchema` definitions paired with runtime `Zod` validation, automatic retry logic, and post-submit state gating. Another challenge was securing user-provided API keys in a serverless static build; I implemented browser-only `sessionStorage`/`localStorage` persistence, masked key inputs, and clear bilingual error handling.

---
*(Word count: 100 words)*
