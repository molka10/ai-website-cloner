import { toJpeg } from "html-to-image";
import pixelmatch from "pixelmatch";
import type { CapturedImage } from "@/types/project";

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

export async function imageToBase64(src: string, maxWidth = 1280, maxHeight = 3000): Promise<CapturedImage> {
  const img = await loadImage(src);

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

export async function pixelSimilarity(a: string, b: string, aspectRatio: number): Promise<number> {
  const width = 320;
  const height = Math.max(1, Math.round(width * aspectRatio));

  const [imgA, imgB] = await Promise.all([
    loadImage(`data:image/jpeg;base64,${a}`),
    loadImage(`data:image/jpeg;base64,${b}`),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not compare the images.");

  ctx.drawImage(imgA, 0, 0, width, height);
  const dataA = ctx.getImageData(0, 0, width, height);

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(imgB, 0, 0, width, height);
  const dataB = ctx.getImageData(0, 0, width, height);
  const different = pixelmatch(dataA.data, dataB.data, undefined, width, height, { threshold: 0.2 });
  return Math.round((1 - different / (width * height)) * 100);
}