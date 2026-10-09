const prepared = new Map<string, Promise<string | null>>();

/**
 * The feed's square mark, with a solid white or black field punched out
 * from the corners. NASA's logo file is already transparent. The social
 * image often is not: the meatball sits on white, the SpaceX X on black.
 * A failed load returns null so the name can stand alone.
 */
export function prepareAgencyMark(url: string): Promise<string | null> {
  const cached = prepared.get(url);
  if (cached) return cached;

  const job = loadMark(url);
  prepared.set(url, job);
  return job;
}

function loadMark(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        resolve(knockOutBackdrop(img) ?? url);
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function knockOutBackdrop(img: HTMLImageElement): string | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;

  const at = (x: number, y: number) => (y * w + x) * 4;
  const corners: Array<[number, number]> = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  if (corners.every(([x, y]) => d[at(x, y) + 3] < 16)) return null;

  const isWhite = (i: number) =>
    d[i + 3] > 200 && d[i] > 228 && d[i + 1] > 228 && d[i + 2] > 228;
  const isBlack = (i: number) =>
    d[i + 3] > 200 && d[i] < 32 && d[i + 1] < 32 && d[i + 2] < 32;

  const whiteCorners = corners.filter(([x, y]) => isWhite(at(x, y))).length;
  const blackCorners = corners.filter(([x, y]) => isBlack(at(x, y))).length;
  const match = whiteCorners >= 3 ? isWhite : blackCorners >= 3 ? isBlack : null;
  if (!match) return null;

  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (const [x, y] of corners) {
    if (match(at(x, y))) stack.push(x, y);
  }

  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (seen[p]) continue;
    const i = p * 4;
    if (!match(i)) continue;
    seen[p] = 1;
    d[i + 3] = 0;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
