import { toJpeg } from "html-to-image";
import type { CapturedImage } from "@/types/project";

export async function imageToBase64(src: string, maxWidth = 1280, maxHeight = 3000): Promise<CapturedImage> {
  const img = new Image();
  img.src = src;
  await img.decode();

  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.min(maxHeight, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, img.naturalWidth * scale, img.naturalHeight * scale);

  return {
    data: canvas.toDataURL("image/jpeg", 0.8).split(",")[1] ?? "",
    width,
    height,
  };
}

export async function captureHtml(html: string, width = 1280, height = 800): Promise<string> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-same-origin");
  iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;border:0;`;
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Could not render the page.");
    await doc.fonts?.ready;

    const dataUrl = await toJpeg(doc.documentElement, {
      width,
      height,
      quality: 0.8,
      pixelRatio: 1,
      backgroundColor: "#ffffff",
    });

    return dataUrl.split(",")[1] ?? "";
  } finally {
    iframe.remove();
  }
}