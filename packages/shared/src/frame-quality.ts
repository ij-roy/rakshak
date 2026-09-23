export type FrameQuality = 'full' | 'lean';

export type FrameQualityState = {
  quality: FrameQuality;
  slow: number;
  fast: number;
};

export function createFrameQuality(): FrameQualityState {
  return { quality: 'full', slow: 0, fast: 0 };
}

/**
 * Drop decorative detail after sustained frames past the 18.5 ms budget,
 * and restore it after a run of comfortable frames.
 */
export function stepFrameQuality(state: FrameQualityState, frameMs: number): FrameQuality {
  if (frameMs > 18.5) {
    state.slow += 1;
    state.fast = 0;
    if (state.slow >= 20) state.quality = 'lean';
  } else if (frameMs < 12) {
    state.fast += 1;
    state.slow = 0;
    if (state.fast >= 45) state.quality = 'full';
  } else {
    state.slow = 0;
    state.fast = 0;
  }
  return state.quality;
}
