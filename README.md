# ReSite — AI Website Cloner

Paste a link or drop a screenshot, and an AI agent rebuilds the page as clean, responsive, editable code. It then checks its own result against the original and fixes the differences. Refine anything by chatting, export it as HTML or as a React + Tailwind component, and keep your projects in the cloud.

**Live demo:** https://ai-website-cloner-rho.vercel.app

![Landing page](docs/screenshots/landing.png)

## Features

- **Two inputs:** a website link, or a screenshot (drag and drop, click, or paste with Ctrl+V)
- **Real AI generation:** a vision model (Google Gemini) turns the page into a single responsive HTML file
- **Self-check loop:** the agent screenshots its own result, compares it with the original and fixes visual differences (up to 2 rounds)
- **Two scores per round:** the model's own similarity score, plus an objective pixel similarity computed with pixelmatch
- **Chat to refine:** ask for changes ("make the hero dark", "add a contact form") and the AI edits the real code
- **Live preview:** sandboxed iframe with desktop / tablet / mobile sizes
- **Code editor:** Monaco (the VS Code editor), with the preview updating as you type
- **Split and Compare views:** code next to preview, original capture next to rebuilt page
- **React + Tailwind export:** converts the current version into a `Page.tsx` component, checked with a real parser
- **Versions:** every generation, fix and change is kept, with Undo / Redo
- **Export:** copy the code or download a .zip
- **Accounts and cloud history:** sign in with Google to keep projects on every device (projects stay in the browser when signed out)
- **Dark mode** and **keyboard shortcuts** (Ctrl+S, Ctrl+Z, Ctrl+Y)

![Agent progress](docs/screenshots/progress.png)
![Workspace](docs/screenshots/workspace.png)
![Dark mode](docs/screenshots/dark.png)

## How it works

```
Browser ──▶ /api/generate (Vercel Function, secret key) ──▶ Microlink (page capture)
                                                        ──▶ Gemini (vision model)
        ◀── HTML + sections + palette + improvements ◀──

Self-check (repeated up to 2 times):
render HTML in a hidden iframe ──▶ screenshot (html-to-image) ──▶ pixel score (pixelmatch)
original + screenshot + HTML ──▶ Gemini ──▶ score + differences + fixed HTML

Accounts:
Browser ──▶ Firebase Authentication (Google) ──▶ Firestore users/{uid}/projects
```

One Vercel Function handles five actions:

| Action | Input | Output |
| --- | --- | --- |
| `url` | A link, captured by Microlink | Same as `generate`, plus the capture |
| `generate` | A compressed screenshot (max 1280 px wide) | HTML, sections, palette, fonts, improvements |
| `check` | Original image, render of the result, current HTML | Score, differences, fixed HTML |
| `refine` | Current HTML and a chat request | Updated HTML and a one-line summary |
| `react` | Current HTML | `Page.tsx`, parsed with Babel and repaired once if invalid |

1. **Capture:** for a link, Microlink opens the page in a headless browser and returns a screenshot. For an uploaded image, this step is skipped.
2. **Generate:** the screenshot is sent to Gemini with a prompt that asks for one responsive, accessible HTML file.
3. **Self-check:** the browser renders the result in a hidden iframe (no scripts allowed) at the same size as the original and screenshots it. Gemini compares both images and returns corrected HTML. The loop stops when no visual differences are left, or after 2 rounds.
4. **Refine:** the chat sends the current code and the request to Gemini, which returns the updated page.
5. **React export:** Gemini converts the HTML to a TSX component with Tailwind classes. The server parses it with `@babel/parser`; on a syntax error, it sends the error back to Gemini for one repair.
6. **Resilience:** if a model is overloaded (503) or out of quota (429), the function retries, then falls back to a second model. A failed self-check never breaks the generation.

### Security

- The Gemini key lives only in server-side environment variables. The browser never sees it.
- Firebase's web config is public by design. Projects are protected by Firestore security rules: each user can only read and write `users/{their uid}/projects`.
- Generated pages run in sandboxed iframes; History thumbnails run with no scripts at all.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React + TypeScript (Vite) |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| State | Zustand |
| Code editor | Monaco Editor |
| Screenshots and comparison in the browser | html-to-image, pixelmatch |
| Code validation | @babel/parser |
| Export | JSZip |
| AI model | Google Gemini (Flash) |
| Page capture from a link | Microlink API |
| Accounts and database | Firebase Authentication + Firestore |
| Backend and hosting | Vercel Functions + Vercel |

## Getting started

You need:

- a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- a Firebase project (free Spark plan) with **Google** sign-in enabled and a **Firestore** database (optional: without it, sign-in is hidden and projects stay in the browser)

```bash
git clone https://github.com/molka10/ai-website-cloner.git
cd ai-website-cloner
npm install
```

Create a `.env.local` file at the root (it is ignored by Git):

```
GEMINI_API_KEY=your_gemini_key

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Firestore rules used by the app:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/projects/{projectId} {
      allow read, delete: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.html is string
        && request.resource.data.html.size() < 900000;
    }
  }
}
```

Run the site and the API together with the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Then open http://localhost:3000. (`npm run dev` only starts the front end, without the `/api` functions.)

When deploying, add the same variables in Vercel → Settings → Environment Variables, and add your Vercel domain to Firebase → Authentication → Settings → Authorized domains.

## Project structure

```
api/
  generate.ts   Vercel Function: capture, generation, refinement, self-check, React export
src/
  components/
    agent/      AgentProgress, ChatPanel
    code/       CodeEditor, ExportMenu, ReactPanel
    input/      InputPanel
    landing/    Hero, HowItWorks, Examples
    layout/     Navbar, Footer, ThemeToggle, AuthButton
    preview/    PreviewFrame, ViewportSwitcher, ComparePanel
    ui/         shadcn components
  hooks/        useShortcuts
  lib/          capture (screenshots, compression, pixel score), firebase, history (Firestore or localStorage)
  pages/        Landing, Workspace, History
  services/     api.ts (calls /api/generate)
  store/        projectStore (generation, self-check loop, versions), authStore
  types/        shared TypeScript types
```

## Limits and lessons learned

- **Self-scoring is optimistic:** the model grades its own work generously (once 98/100 with a whole column missing). The loop stops on "no differences left", not on the score, and a pixel score gives an objective second opinion.
- **AI output must be checked:** the React export once contained an invalid ternary, which is why it is now parsed and repaired on the server.
- **Branding rules are not a guarantee:** brand names and logos are usually replaced, but a long slogan can still slip through.
- **Free tiers:** Gemini and Microlink both have per-minute and daily limits. The app falls back to a second model and shows a clear message when limits are reached.
- **Blocked sites:** some large sites refuse automated captures. Uploading a screenshot works instead.
- **Reopened projects:** the original image isn't stored in the cloud, so Check again and Compare are only available right after a generation.

## Roadmap

- [ ] Stricter post-generation check for brand names and slogans
- [ ] Store the original image with saved projects
- [ ] Multi-page sites
- [ ] One-click deploy of generated sites

## Responsible use

ReSite is meant for learning and inspiration. The AI is instructed to replace brand names, logos, photos and personal data (usernames, emails, file names) with neutral placeholders, and the self-check is forbidden from changing any text. Login, account and payment pages are refused. Always check generated pages before using them.

## Author

Louka — engineering student at ESPRIT
