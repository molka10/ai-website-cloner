# ReSite — AI Website Cloner

Paste a link or drop a screenshot, and an AI agent rebuilds the page as clean, responsive, editable code.

**Live demo:** https://ai-website-cloner-rho.vercel.app

![Landing page](docs/screenshots/landing.png)

## Features

- **Two inputs:** a website link, or a screenshot (drag and drop, click, or paste with Ctrl+V)
- **Agent progress:** step-by-step view of what the agent is doing (capture, analysis, code)
- **Live preview:** sandboxed iframe with desktop / tablet / mobile sizes
- **Code editor:** Monaco (the VS Code editor), with the preview updating as you type
- **Split and Compare views:** code next to preview, original next to rebuilt
- **Chat to refine:** ask for changes, with every version kept (Undo / Redo)
- **Export:** copy the code or download a .zip
- **History:** save projects and reopen them later
- **Dark mode** and **keyboard shortcuts** (Ctrl+S, Ctrl+Z, Ctrl+Y)

![Agent progress](docs/screenshots/progress.png)
![Workspace](docs/screenshots/workspace.png)
![Dark mode](docs/screenshots/dark.png)

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React + TypeScript (Vite) |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| State | Zustand |
| Code editor | Monaco Editor |
| Export | JSZip |
| Deployment | Vercel |

## How it works

The front end talks to a single service file, `src/services/api.ts`. For now it returns **mock data** so the whole interface can be built and tested without a backend. The planned AI agent pipeline is:

1. **Capture** — a headless browser takes screenshots and reads the page structure
2. **Understand** — a vision model turns the screenshots into a design spec (sections, colors, fonts)
3. **Plan** — components, design tokens and improvements (accessibility, responsiveness)
4. **Generate** — code written section by section
5. **Self-check** — render the result, compare it with the original, fix differences

Swapping the mocks for real `fetch` calls in `api.ts` is the only change the UI needs.

## Getting started

```bash
git clone https://github.com/molka10/ai-website-cloner.git
cd ai-website-cloner
npm install
npm run dev
```

Then open http://localhost:5173.

## Project structure

```
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
  mocks/        sample AI result
  pages/        Landing, Workspace, History
  services/     api.ts (mock API)
  store/        projectStore (Zustand)
  types/        shared TypeScript types
```

## Roadmap

- [ ] Backend: real screenshot capture (Playwright) and AI generation
- [ ] React + Tailwind output, in addition to plain HTML
- [ ] User accounts and cloud-saved projects
- [ ] One-click deploy of generated sites

## Responsible use

ReSite is meant for learning and inspiration. Generated code uses placeholder text and images, not the original site's logos, photos or copy. Login and payment pages should not be rebuilt.

## Author

Louka — engineering student at ESPRIT
