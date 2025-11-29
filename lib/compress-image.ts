"use client";

type CompressOptions = {
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
};

// Compress image using canvas. Works best with JPG/WEBP outputs for aggressive size drop.
export async function compressImageFile(file: File, opts: CompressOptions = {}): Promise<File> {
  const maxBytes = opts.maxBytes ?? 600 * 1024;
  const maxWidth = opts.maxWidth ?? 1024;
  const maxHeight = opts.maxHeight ?? 1024;
  let quality = opts.quality ?? 0.65;

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const { width, height } = resizeDimensions(img, maxWidth, maxHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo iniciar el canvas para comprimir.");

  ctx.drawImage(img, 0, 0, width, height);

  // Prefer WEBP for better compression; fallback to JPEG if not supported.
  const mimeType = canvas.toDataURL("image/webp").length ? "image/webp" : "image/jpeg";
  let currentCanvas = canvas;
  let blob = dataUrlToBlob(currentCanvas.toDataURL(mimeType, quality));

  let attempts = 0;
  while (blob.size > maxBytes && attempts < 4) {
    attempts += 1;
    quality = Math.max(0.35, quality - 0.12);
    const shrink = 0.82;
    const nextWidth = Math.max(320, Math.round(currentCanvas.width * shrink));
    const nextHeight = Math.max(320, Math.round(currentCanvas.height * shrink));
    const smaller = document.createElement("canvas");
    smaller.width = nextWidth;
    smaller.height = nextHeight;
    const smallerCtx = smaller.getContext("2d");
    if (!smallerCtx) throw new Error("No se pudo optimizar la imagen.");
    smallerCtx.drawImage(currentCanvas, 0, 0, nextWidth, nextHeight);
    currentCanvas = smaller;
    blob = dataUrlToBlob(currentCanvas.toDataURL(mimeType, quality));
  }

  if (blob.size > maxBytes) {
    throw new Error("La imagen sigue siendo pesada luego de optimizar. Prueba con otra más liviana.");
  }

  return new File([blob], makeCompressedName(file.name, mimeType), { type: mimeType });
}

const readFileAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resizeDimensions(img: HTMLImageElement, maxWidth: number, maxHeight: number) {
  let { width, height } = img;
  const ratio = width / height;

  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(maxWidth / ratio);
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(maxHeight * ratio);
  }

  return { width, height };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const bstr = atob(parts[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

function makeCompressedName(name: string, mime: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  const ext = mime.includes("webp") ? "webp" : "jpg";
  return `${base}-compressed.${ext}`;
}
