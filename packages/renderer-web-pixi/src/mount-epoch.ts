/** Pixi ResizePlugin.destroy calls `_cancelResize()` on the Application. A second destroy, or a destroy before init finishes, leaves it null or missing. */
export function ensureResizeCancel(target: { _cancelResize?: (() => void) | null }): void {
  if (typeof target._cancelResize !== 'function') {
    target._cancelResize = () => {};
  }
}

export function createMountEpoch() {
  let epoch = 0;
  return {
    begin(): number {
      epoch += 1;
      return epoch;
    },
    cancel(): void {
      epoch += 1;
    },
    isCurrent(token: number): boolean {
      return token === epoch;
    },
  };
}
