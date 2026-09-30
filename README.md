# ReSite — AI Website Cloner

Paste a link or drop a screenshot, and an AI agent rebuilds the page as clean, responsive, editable code. Then refine it by chatting.

**Live demo:** https://ai-website-cloner-rho.vercel.app

![Landing page](docs/screenshots/landing.png)

## Features

- **Two inputs:** a website link, or a screenshot (drag and drop, click, or paste with Ctrl+V)
- **Real AI generation:** a vision model (Google Gemini) turns the page into a single HTML file
- **Chat to refine:** ask for changes ("make the hero dark", "add a contact form") and the AI edits the real code
- **Live preview:** sandboxed iframe with desktop / tablet / mobile sizes
- **Code editor:** Monaco (the VS Code editor), with the preview updating as you type
- **Split and Compare views:** code next to preview, original capture next to rebuilt page
- **Versions:** every change is kept, with Undo / Redo
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
```

1. **Capture:** for a link, Microlink opens the page in a headless browser and returns a screenshot. For an uploaded image, this step is skipped.
2. **Generate:** the screenshot is sent to Gemini with a prompt that asks for one responsive, accessible HTML file, plus the sections, palette and fonts it used.
3. **Refine:** the chat sends the current code and the request back to Gemini, which returns the updated page and a one-line summary.
4. **Resilience:** if the model is overloaded (HTTP 503), the function retries, then falls back to a lighter model.

The API key lives only in server-side environment variables. The browser never sees it.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React + TypeScript (Vite) |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| State | Zustand |
| Code editor | Monaco Editor |
| Export | JSZip |
| AI model | Google Gemini (Flash) |
| Page capture | Microlink API |
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
  generate.ts   Vercel Function: page capture, AI generation and refinement
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
  lib/          history (localStorage)
  pages/        Landing, Workspace, History
  services/     api.ts (calls /api/generate)
  store/        projectStore (Zustand)
  types/        shared TypeScript types
```

## Limits

- Free tiers: Gemini and Microlink both have daily limits. When they are reached, the app shows a clear message.
- Some large sites block automated captures. Uploading a screenshot works instead.
- Generated pages are plain HTML and CSS (no React output yet).

## Roadmap

- [ ] React + Tailwind output, in addition to plain HTML
- [ ] Self-check loop: render the result, compare it with the original, fix differences
- [ ] User accounts and cloud-saved projects
- [ ] One-click deploy of generated sites

## Responsible use

ReSite is meant for learning and inspiration. The AI is instructed to replace brand names, logos, photos and real text with neutral placeholders, and login, account and payment pages are refused. Always check generated pages before using them.

## Author

Louka — engineering student at ESPRIT
