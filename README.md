# ReSite — AI Website Cloner

Paste a link or drop a screenshot, and an AI agent rebuilds the page as clean, responsive, editable code. It then checks its own result against the original and fixes the differences. Refine anything by chatting.

**Live demo:** https://ai-website-cloner-rho.vercel.app

![Landing page](docs/screenshots/landing.png)

## Features

- **Two inputs:** a website link, or a screenshot (drag and drop, click, or paste with Ctrl+V)
- **Real AI generation:** a vision model (Google Gemini) turns the page into a single HTML file
- **Self-check loop:** the agent screenshots its own result, compares it with the original, and fixes visual differences (up to 2 rounds)
- **Chat to refine:** ask for changes ("make the hero dark", "add a contact form") and the AI edits the real code
- **Live preview:** sandboxed iframe with desktop / tablet / mobile sizes
- **Code editor:** Monaco (the VS Code editor), with the preview updating as you type
- **Split and Compare views:** code next to preview, original capture next to rebuilt page
- **Versions:** every generation, fix and change is kept, with Undo / Redo
- **Export:** copy the code or download a .zip
- **History:** save projects in the browser and reopen them later
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
render HTML in a hidden iframe ──▶ screenshot (html-to-image)
original + screenshot + HTML ──▶ Gemini ──▶ score + differences + fixed HTML
```

1. **Capture:** for a link, Microlink opens the page in a headless browser and returns a screenshot. For an uploaded image, this step is skipped.
2. **Generate:** the screenshot is sent to Gemini with a prompt that asks for one responsive, accessible HTML file, plus the sections, palette and fonts it used.
3. **Self-check:** the browser renders the result in a hidden, script-free iframe and screenshots it at the same size as the original. Gemini compares both images and returns corrected HTML. The loop stops when no visual differences are left, or after 2 rounds.
4. **Refine:** the chat sends the current code and the request back to Gemini, which returns the updated page and a one-line summary.
5. **Resilience:** if a model is overloaded (503) or out of quota (429), the function retries, then falls back to a second model. A failed self-check never breaks the generation.

The API key lives only in server-side environment variables. The browser never sees it. Images are compressed in the browser (max 1280 px wide, JPEG) before being sent.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React + TypeScript (Vite) |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| State | Zustand |
| Code editor | Monaco Editor |
| Page screenshots in the browser | html-to-image |
| Export | JSZip |
| AI model | Google Gemini (Flash) |
| Page capture from a link | Microlink API |
| Backend and hosting | Vercel Functions + Vercel |

## Getting started

You need a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/molka10/ai-website-cloner.git
cd ai-website-cloner
npm install
```

Create a `.env.local` file at the root (it is ignored by Git):

```
GEMINI_API_KEY=your_key_here
```

Run the site and the API together with the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Then open http://localhost:3000. (`npm run dev` only starts the front end, without the `/api` functions.)

## Project structure

```
api/
  generate.ts   Vercel Function: page capture, generation, refinement and self-check
src/
  components/
    agent/      AgentProgress, ChatPanel
    code/       CodeEditor, ExportMenu
    input/      InputPanel
    landing/    Hero, HowItWorks, Examples
    layout/     Navbar, Footer, ThemeToggle
    preview/    PreviewFrame, ViewportSwitcher, ComparePanel
    ui/         shadcn components
  hooks/        useShortcuts
  lib/          capture (screenshots, image compression), history (localStorage)
  pages/        Landing, Workspace, History
  services/     api.ts (calls /api/generate)
  store/        projectStore (Zustand): generation, self-check loop, versions
  types/        shared TypeScript types
```

## Limits and lessons learned

- **Self-scoring is optimistic:** the model grades its own work generously (once 98/100 with a whole column missing). The loop therefore stops on "no differences left", not on the score.
- **Free tiers:** Gemini and Microlink both have per-minute and daily limits. The app falls back to a second model and shows a clear message when limits are reached.
- **Blocked sites:** some large sites refuse automated captures. Uploading a screenshot works instead.
- **Output:** generated pages are plain HTML and CSS (no React output yet).

## Roadmap

- [ ] Objective pixel similarity score (pixelmatch) next to the model's score
- [ ] React + Tailwind output, in addition to plain HTML
- [ ] User accounts and cloud-saved projects
- [ ] One-click deploy of generated sites

## Responsible use

ReSite is meant for learning and inspiration. The AI is instructed to replace brand names, logos, photos and personal data (usernames, emails, file names) with neutral placeholders, and the self-check is forbidden from changing any text. Login, account and payment pages are refused. Always check generated pages before using them.

## Author

Louka — engineering student at ESPRIT
