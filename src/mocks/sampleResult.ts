import type { GenerateResult } from "@/types/project";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nova Studio</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; color: #0f172a; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; }
  nav span { margin-left: 24px; color: #475569; }
  .hero { text-align: center; padding: 96px 24px; background: #f8fafc; }
  .hero h1 { font-size: 48px; margin: 0 0 16px; }
  .hero p { color: #475569; font-size: 18px; }
  .btn { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #0ea5e9; color: white; border-radius: 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; padding: 64px 40px; }
  .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
  footer { text-align: center; padding: 32px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <header><strong>Nova Studio</strong><nav><span>Work</span><span>About</span><span>Contact</span></nav></header>
  <section class="hero"><h1>We design websites that grow</h1><p>A small studio for brands that want to stand out.</p><span class="btn">Start a project</span></section>
  <section class="grid">
    <div class="card"><h3>Branding</h3><p>Logos, colors and identity.</p></div>
    <div class="card"><h3>Web design</h3><p>Fast, responsive websites.</p></div>
    <div class="card"><h3>Strategy</h3><p>Plans that turn visits into clients.</p></div>
  </section>
  <footer>© Nova Studio</footer>
</body>
</html>`;

export const sampleResult: GenerateResult = {
  id: "sample",
  sourcePreview: "",
  analysis: {
    sections: ["navbar", "hero", "features", "footer"],
    palette: ["#0F172A", "#0EA5E9", "#F8FAFC", "#E2E8F0"],
    fonts: ["System UI"],
  },
  code: { html },
  improvements: ["Added mobile-friendly grid", "Improved text contrast", "Semantic HTML tags"],
};