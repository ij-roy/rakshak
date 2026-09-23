/** Next index inside a modal. A missing current focus lands on the first or last control. */
export function nextTabIndex(count: number, current: number, shift: boolean): number {
  if (count <= 0) return 0;
  if (current < 0) return shift ? count - 1 : 0;
  if (shift) return (current - 1 + count) % count;
  return (current + 1) % count;
}

export const MODAL_FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
