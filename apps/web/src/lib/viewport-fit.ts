/**
 * Layout budget for the home menu and the watch chrome.
 * Matches `.home { overflow-y: auto }`, the two-column menu at `max-height: 420px`,
 * and the portrait rotate prompt under 900px wide in `globals.css`.
 */
export type ViewportFit = {
  columns: 1 | 2;
  scrolls: boolean;
  playReachable: boolean;
  settingsReachable: boolean;
  fieldFits: boolean;
  hudFits: boolean;
  pauseFits: boolean;
  needsRotate: boolean;
};

const HOME_LINKS = 6;

export function viewportFit(width: number, height: number, rootFontPx = 16): ViewportFit {
  const scale = rootFontPx / 16;
  const short = height <= 420;
  const columns: 1 | 2 = short ? 2 : 1;
  const brand = short ? 2.4 * rootFontPx : Math.min(4.75 * rootFontPx, Math.max(2.6 * rootFontPx, width * 0.08));
  const playHeight = 64 * scale;
  const linkHeight = (short ? 36 : 44) * scale;
  const rows = 1 + Math.ceil(HOME_LINKS / columns);
  const padding = (short ? 24 : 48) * scale;
  const stack = brand + padding + playHeight + rows * (linkHeight + 8 * scale);
  const scrolls = stack > height;
  return {
    columns,
    scrolls,
    playReachable: playHeight > 0 && (stack <= height || scrolls),
    settingsReachable: linkHeight >= 36 * scale && (stack <= height || scrolls),
    fieldFits: width >= 280 && height >= 160,
    hudFits: width >= 280 && height >= 160,
    pauseFits: width >= 280 && height >= 200,
    needsRotate: width < 900 && height > width,
  };
}
