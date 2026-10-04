const EARTHY_HUES = [42, 25, 70, 130, 160, 200, 255, 330];

export function brandHue(slug: string): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return EARTHY_HUES[h % EARTHY_HUES.length];
}
