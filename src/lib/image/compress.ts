export type CompressedImage = { blob: Blob; ext: "webp" | "jpg"; width: number; height: number; originalSize: number };

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Redimensiona (lado mayor ≤ maxSize) y comprime en el navegador antes de subir.
 * Genera WebP; si el navegador no sabe codificarlo (p. ej. Safari) usa JPEG. Elimina los metadatos EXIF
 * y respeta la orientación original de la foto.
 */
export async function compressImage(file: File, { maxSize = 1600, webpQuality = 0.82, jpegQuality = 0.86 } = {}): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen en este navegador.");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await canvasToBlob(canvas, "image/webp", webpQuality);
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", width, height, originalSize: file.size };
  const jpeg = await canvasToBlob(canvas, "image/jpeg", jpegQuality);
  if (!jpeg) throw new Error("No se pudo comprimir la imagen.");
  return { blob: jpeg, ext: "jpg", width, height, originalSize: file.size };
}

export const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
