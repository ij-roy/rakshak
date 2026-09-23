'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { applyVolumeSettings, clearCombatCueFold, createWebProceduralAudio, noteCombatCue, type CombatCueFold, type CueId, CUE_IDS } from '@rakshak/audio';
import { applyRunCheckpoint, buildRunReport, captureRunCheckpoint, formatCheckpointTime, GameRuntime, readWatchStamp, watchChanged, type WatchStamp } from '@rakshak/game-core';
import {
  describeLevelChoice,
  GUARDIAN_BY_ID,
  isLowHealth,
  MAP_BY_ID,
  nextWatchObjective,
  PASSIVE_BY_ID,
  WEAPON_BY_ID,
  type GuardianId,
  type MapId,
  type MetaTrackId,
} from '@rakshak/game-data';
import {
  copyHud,
  createEmptyRenderSnapshot,
  type HudSnapshot,
  type MutableRenderSnapshot,
  type RenderSnapshot,
} from '@rakshak/game-protocol';
import { controlPrompt, controlsReference } from '@rakshak/input';
import { copy, creditSections, tutorialSteps } from '@rakshak/game-ui';
import { createWebPlayInputAdapter } from '@rakshak/input/web';
import { interruptionResponse } from '@rakshak/input';
import { createPixiRenderer } from '@rakshak/renderer-web-pixi';
import { TICK_MS } from '@rakshak/shared';
import {
  claimReward,
  commitProfile,
  computeSaveChecksum,
  describeRunOutcome,
  loadProfile,
  EMPTY_HELD_REWARD,
  holdReward,
  PENDING_PROFILE_KEY,
  replaceProfile,
  rewardContextFromSave,
  settleRun,
  validateSave,
  type ProfileLoad,
  type RunOutcomeSummary,
  withBumpedRevision,
  type SaveFileV1,
} from '@rakshak/storage';
import { ProfileRecovery } from './ProfileRecovery';
import { createIndexedDbRepository } from '../lib/indexedDbStorage';
import { MODAL_FOCUSABLE, nextTabIndex } from '../lib/modalFocus';
import { stickHeading, writeStickVector } from '../lib/stick-readout';
import {
  clearRunCheckpointSync,
  readRunCheckpointSync,
  RUN_FRESH_FLAG,
  RUN_RESUME_FLAG,
  writeRunCheckpointSync,
} from '../lib/runCheckpoint';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function isCueId(id: string): id is CueId {
  return (CUE_IDS as readonly string[]).includes(id);
}

function withChecksum(partial: Omit<SaveFileV1, 'checksum'>): SaveFileV1 {
  return { ...partial, checksum: computeSaveChecksum(partial) };
}

function choiceLabel(contentId: string, kind: string): string {
  if (kind === 'weapon') return WEAPON_BY_ID[contentId as keyof typeof WEAPON_BY_ID]?.displayName ?? contentId;
  if (kind === 'passive') return PASSIVE_BY_ID[contentId as keyof typeof PASSIVE_BY_ID]?.displayName ?? contentId;
  return contentId.replace(/_/g, ' ');
}

function useModalDialog(active: boolean, focusKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!active) return;
    const node = ref.current;
    const previous = document.activeElement;
    if (previous instanceof HTMLElement && node && !node.contains(previous)) {
      restoreRef.current = previous;
    }
    return () => {
      const back = restoreRef.current;
      restoreRef.current = null;
      if (back && document.contains(back)) back.focus();
    };
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const preferred = node.querySelector<HTMLElement>('[data-autofocus]');
    (preferred ?? node.querySelector<HTMLElement>(MODAL_FOCUSABLE))?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = [...node.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE)];
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const next = nextTabIndex(items.length, items.indexOf(document.activeElement as HTMLElement), event.shiftKey);
      event.preventDefault();
      items[next]?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, focusKey]);

  return ref;
}

function ModalDialog({
  active,
  focusKey,
  className,
  label,
  children,
}: {
  active: boolean;
  focusKey: string;
  className: string;
  label: string;
  children: ReactNode;
}) {
  const ref = useModalDialog(active, focusKey);
  return (
    <div
      ref={ref}
      className={className}
      role="dialog"
      aria-modal={active}
      aria-label={label}
      inert={active ? undefined : true}
    >
      {children}
    </div>
  );
}

function TutorialCard({
  active,
  step,
  place,
  moveHint,
  onNext,
  onDone,
  doneLabel,
}: {
  active: boolean;
  step: number;
  place: string;
  moveHint: string;
  onNext: () => void;
  onDone: () => void;
  doneLabel: string;
}) {
  const current = tutorialSteps[step] ?? tutorialSteps[0];
  const last = step >= tutorialSteps.length - 1;
  return (
    <ModalDialog active={active} focusKey={`${step}`} className="story-overlay" label="How to play">
      <p className="story-kicker">
        How to play · {step + 1} / {tutorialSteps.length}
      </p>
      <h2>{current.title}</h2>
      {step === 0 ? <p>{place}</p> : null}
      <p>{step === 0 ? moveHint : current.body}</p>
      <div className="results-actions">
        {last ? (
          <button type="button" className="nav-link primary" data-autofocus onClick={onDone}>
            {doneLabel}
          </button>
        ) : (
          <button type="button" className="nav-link primary" data-autofocus onClick={onNext}>
            Next
          </button>
        )}
        {last ? null : (
          <button type="button" className="nav-link" onClick={onDone}>
            Skip
          </button>
        )}
      </div>
    </ModalDialog>
  );
}

export function GameMount({
  guardianId = 'asha',
  mapId = 'gaon',
  onRetry,
  onNewWatch,
  onNextMap,
}: {
  guardianId?: GuardianId;
  mapId?: MapId;
  onRetry: () => void;
  onNewWatch: () => void;
  onNextMap: (mapId: MapId) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ReturnType<typeof createWebPlayInputAdapter> | null>(null);
  const audioRef = useRef<ReturnType<typeof createWebProceduralAudio> | null>(null);
  const rendererRef = useRef<ReturnType<typeof createPixiRenderer> | null>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const abandoningRef = useRef(false);
  const requestExitRef = useRef<() => void>(() => {});
  const [resumeNote, setResumeNote] = useState<string | null>(null);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stickSide, setStickSide] = useState<'left' | 'right'>('left');
  const [touchPlay, setTouchPlay] = useState(false);
  const stickOptionsRef = useRef({ size: 'medium' as 'small' | 'medium' | 'large', mode: 'fixed' as 'fixed' | 'floating', deadzone: 0.12 });
  const [liveSettings, setLiveSettings] = useState<SaveFileV1['settings'] | null>(null);
  const [knownEvolutions, setKnownEvolutions] = useState<readonly string[]>([]);
  const [pausePanel, setPausePanel] = useState<'main' | 'settings' | 'abandon' | 'credits'>('main');
  const [storyDismissed, setStoryDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('rakshak.help.seen') === '1',
  );
  const [helpStep, setHelpStep] = useState(0);
  const [helpReplay, setHelpReplay] = useState(false);
  const [bootAttempt, setBootAttempt] = useState(0);
  const storyGateRef = useRef(false);
  const dialogOpenRef = useRef(false);
  const saveRef = useRef<SaveFileV1 | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed'>('saving');
  const [profileBlock, setProfileBlock] = useState<Extract<ProfileLoad, { status: 'blocked' }> | null>(null);
  const [settingsNote, setSettingsNote] = useState<string | null>(null);
  const retrySaveRef = useRef<() => void>(() => {});
  const simDialogRef = useRef(false);

  const guardian = GUARDIAN_BY_ID[guardianId];
  const map = MAP_BY_ID[mapId];
  const mapIntro = useMemo(
    () => `${map.displayName} — ${map.subtitle}. The Chhaya thickens here.`,
    [map],
  );

  const pickChoice = useCallback((index: 0 | 1 | 2) => {
    inputRef.current?.injectConfirm(index);
  }, []);

  const dismissStory = useCallback(() => {
    storyGateRef.current = true;
    localStorage.setItem('rakshak.help.seen', '1');
    setStoryDismissed(true);
    setHelpReplay(false);
    setHelpStep(0);
  }, []);

  const applyLiveSettings = useCallback((next: SaveFileV1['settings']) => {
    setLiveSettings(next);
    setStickSide(next.stickSide);
    stickOptionsRef.current = {
      size: next.stickSize ?? 'medium',
      mode: next.stickMode ?? 'fixed',
      deadzone: next.stickDeadzone ?? 0.12,
    };
    inputRef.current?.setDeadzone(stickOptionsRef.current.deadzone);
    inputRef.current?.setBindings(next.bindings);
    if (audioRef.current) applyVolumeSettings(audioRef.current, next);
    rendererRef.current?.setReducedEffects(next.reducedEffects);
    const repo = createIndexedDbRepository();
    void (async () => {
      const base = saveRef.current;
      if (!base) {
        setSettingsNote('Could not save settings.');
        return;
      }
      const bumped = withBumpedRevision({
        ...base,
        updatedAt: new Date().toISOString(),
        settings: next,
      });
      setSettingsNote('Saving settings…');
      const written = await commitProfile(
        repo,
        (s) => JSON.stringify(s),
        (value) => validateSave(JSON.parse(value) as unknown),
        withChecksum(bumped),
      );
      setSettingsNote(written.ok ? 'Settings saved on this device.' : 'Could not save settings.');
    })();
  }, []);

  useEffect(() => {
    if (!hud?.paused) setPausePanel('main');
  }, [hud?.paused]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let raf = 0;
    let runtime: GameRuntime | null = null;
    let detachListeners: (() => void) | null = null;
    storyGateRef.current = localStorage.getItem('rakshak.help.seen') === '1';
    let prevSnap: RenderSnapshot | null = null;
    const snapA: MutableRenderSnapshot = createEmptyRenderSnapshot();
    const snapB: MutableRenderSnapshot = createEmptyRenderSnapshot();
    let useA = true;
    let acc = 0;
    let last = performance.now();
    let hudThrottle = 0;
    let rewardHeld = EMPTY_HELD_REWARD;
    let rewardBase: SaveFileV1 | null = null;
    const revealStick = (event: PointerEvent) => {
      if (event.pointerType === 'touch') setTouchPlay(true);
    };
    if (window.matchMedia('(pointer: coarse)').matches) setTouchPlay(true);
    window.addEventListener('pointerdown', revealStick);
    const input = createWebPlayInputAdapter();
    input.setDeadzone(stickOptionsRef.current.deadzone);
    inputRef.current = input;
    const audio = createWebProceduralAudio();
    audioRef.current = audio;
    const renderer = createPixiRenderer();
    rendererRef.current = renderer;
    const repo = createIndexedDbRepository();

    const unlockAudio = () => {
      void audio.unlock().then(() => audio.startAmbience());
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    async function persistRunEnd(_current: HudSnapshot, saveBase: SaveFileV1) {
      if (rewardHeld.claimed || !runtime) return;
      rewardBase = saveBase;
      setSaveState('saving');
      const settled = settleRun(saveBase, buildRunReport(runtime.world));
      rewardHeld = holdReward(rewardHeld, settled);
      if (!rewardHeld.pending) return;
      sessionStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(rewardHeld.pending));
      const written = await commitProfile(
        repo,
        (s) => JSON.stringify(s),
        (raw) => validateSave(JSON.parse(raw) as unknown),
        rewardHeld.pending,
      );
      rewardHeld = claimReward(rewardHeld, written.ok);
      if (cancelled) return;
      if (written.ok) {
        sessionStorage.removeItem(PENDING_PROFILE_KEY);
        clearRunCheckpointSync();
        sessionStorage.removeItem(RUN_RESUME_FLAG);
        setSaveState('saved');
      } else {
        setSaveState('failed');
      }
    }

    retrySaveRef.current = () => {
      if (rewardBase) void persistRunEnd({} as HudSnapshot, rewardBase);
    };

    async function boot() {
      try {
        await renderer.mount(host!);
        if (cancelled) return;

        const pendingRaw = sessionStorage.getItem(PENDING_PROFILE_KEY);
        if (pendingRaw) {
          try {
            const pending = validateSave(JSON.parse(pendingRaw) as unknown);
            if (pending.ok) {
              const flushed = await replaceProfile(repo, pending.save);
              if (!flushed.ok) {
                if (!cancelled) {
                  setSaveState('failed');
                  setError('Could not save the last watch.');
                }
                return;
              }
            }
          } catch {
            /* A damaged pending payload cannot be retried. */
          }
          sessionStorage.removeItem(PENDING_PROFILE_KEY);
        }

        const loaded = await loadProfile(repo);
        if (cancelled) return;
        if (loaded.status === 'blocked') {
          setProfileBlock(loaded);
          return;
        }
        if (loaded.notice) setResumeNote(loaded.notice);
        let save: SaveFileV1 = loaded.save;
        const meta = save.meta.upgrades as Partial<Record<MetaTrackId, number>>;
        save = withChecksum(
          withBumpedRevision({
            ...save,
            statistics: {
              ...save.statistics,
              runsStarted: save.statistics.runsStarted + 1,
            },
            updatedAt: new Date().toISOString(),
          }),
        );
        await commitProfile(
          repo,
          (s) => JSON.stringify(s),
          (raw) => validateSave(JSON.parse(raw) as unknown),
          save,
        );
        if (cancelled) return;
        applyVolumeSettings(audio, save.settings);
        renderer.setReducedEffects(save.settings.reducedEffects);
        setStickSide(save.settings.stickSide);
        input.setBindings(save.settings.bindings);
        setLiveSettings(save.settings);
        setKnownEvolutions(save.discovery.evolutions);
        saveRef.current = save;
        setSaveState('saving');

        runtime = new GameRuntime({
          seed: (Date.now() ^ (Math.floor(performance.now()) * 9973)) >>> 0,
          guardianId,
          mapId,
          meta,
          rewardContext: rewardContextFromSave(save),
        });
        const wantResume =
          new URLSearchParams(window.location.search).get('continue') === '1' ||
          sessionStorage.getItem(RUN_RESUME_FLAG) === '1';
        const freshStart = sessionStorage.getItem(RUN_FRESH_FLAG) === '1';
        sessionStorage.removeItem(RUN_RESUME_FLAG);
        sessionStorage.removeItem(RUN_FRESH_FLAG);
        if (wantResume && !freshStart) {
          const checkpoint = readRunCheckpointSync();
          if (checkpoint) {
            applyRunCheckpoint(runtime, checkpoint);
            writeRunCheckpointSync(captureRunCheckpoint(runtime, checkpoint.reason, checkpoint.resumeCount + 1));
            setResumeNote(
              `Restored this watch at ${formatCheckpointTime(checkpoint.tick)}. It stays paused until you resume. Progress after the last checkpoint was not kept.`,
            );
          } else {
            setResumeNote('No checkpoint was saved, so this is a new watch.');
          }
        }
        runtimeRef.current = runtime;
        if (cancelled) return;
        prevSnap = runtime.snapshot(snapA);
        setHud(copyHud(prevSnap.hud));
        setReady(true);
        setError(null);

        const onResize = () => {
          renderer.resize({
            width: host!.clientWidth,
            height: host!.clientHeight,
            dpr: window.devicePixelRatio || 1,
          });
          measureStick();
        };
        const stickEl = stickRef.current;
        const knob = stickEl?.querySelector<HTMLElement>('.stick-knob') ?? null;
        const readout = stickEl?.querySelector<HTMLElement>('.stick-readout') ?? null;
        const ring = stickEl?.querySelector<HTMLElement>('.stick-deadzone') ?? null;
        const stickBox = { left: 0, top: 0, width: 1, height: 1, reach: 1 };
        const stickVec = { dx: 0, dy: 0 };
        let lastHeading = '';
        let lastZonePct = -1;
        const measureStick = () => {
          if (!stickEl) return;
          const rect = stickEl.getBoundingClientRect();
          stickBox.left = rect.left;
          stickBox.top = rect.top;
          stickBox.width = rect.width;
          stickBox.height = rect.height;
          stickBox.reach = rect.width / 2 - 22;
        };
        let capturedPointerId: number | null = null;
        const releaseStick = () => {
          if (stickEl && capturedPointerId !== null && stickEl.hasPointerCapture(capturedPointerId)) {
            stickEl.releasePointerCapture(capturedPointerId);
          }
          capturedPointerId = null;
          input.releaseHold();
        };
        const paintStick = (dx: number, dy: number, active: boolean) => {
          if (!stickEl || !knob || !readout) return;
          const zonePct = Math.round(stickOptionsRef.current.deadzone * 100);
          if (ring && zonePct !== lastZonePct) {
            lastZonePct = zonePct;
            ring.style.width = ring.style.height = `${zonePct}%`;
          }
          if (!active) {
            knob.style.transform = 'translate(-50%, -50%)';
            if (lastHeading !== '') {
              lastHeading = '';
              readout.textContent = '';
            }
            stickEl.classList.remove('active');
            return;
          }
          const clampedX = Math.max(-1, Math.min(1, dx));
          const clampedY = Math.max(-1, Math.min(1, dy));
          knob.style.transform = `translate(calc(-50% + ${clampedX * stickBox.reach}px), calc(-50% + ${clampedY * stickBox.reach}px))`;
          const heading = stickHeading(dx, dy, stickOptionsRef.current.deadzone);
          if (heading !== lastHeading) {
            lastHeading = heading;
            readout.textContent = heading;
          }
          stickEl.classList.add('active');
        };
        const onStick = (clientX: number, clientY: number, active: boolean) => {
          if (runtimeRef.current?.world.run.paused || !stickEl || !active) {
            input.setStick(0, 0, false);
            paintStick(0, 0, false);
            return;
          }
          writeStickVector(stickVec, clientX, clientY, stickBox.left, stickBox.top, stickBox.width, stickBox.height);
          input.setStick(stickVec.dx, stickVec.dy, true);
          paintStick(stickVec.dx, stickVec.dy, true);
        };
        const pointerDown = (e: PointerEvent) => {
          if (!stickEl || runtimeRef.current?.world.run.paused) return;
          const floating = stickOptionsRef.current.mode === 'floating';
          const onStickSurface = stickEl.contains(e.target as Node);
          if (floating) {
            if (e.pointerType === 'mouse') return;
            if (e.target instanceof Element && e.target.closest('button, a, input, [role="dialog"]')) return;
          } else if (!onStickSurface) {
            return;
          }
          if (floating) {
            stickEl.classList.add('active');
            const size = stickEl.offsetWidth || 120;
            stickEl.style.left = `${e.clientX - size / 2}px`;
            stickEl.style.top = `${e.clientY - size / 2}px`;
            stickEl.style.right = 'auto';
          }
          capturedPointerId = e.pointerId;
          try {
            stickEl.setPointerCapture(e.pointerId);
          } catch {
            /* The pointer can end before the stick captures it. */
          }
          measureStick();
          onStick(e.clientX, e.clientY, true);
        };
        const pointerMove = (e: PointerEvent) => {
          if (!stickEl?.hasPointerCapture(e.pointerId)) return;
          onStick(e.clientX, e.clientY, true);
        };
        const pointerUp = (e: PointerEvent) => {
          if (stickEl?.hasPointerCapture(e.pointerId)) {
            stickEl.releasePointerCapture(e.pointerId);
          }
          if (capturedPointerId === e.pointerId) capturedPointerId = null;
          onStick(0, 0, false);
          if (stickEl) {
            stickEl.style.left = '';
            stickEl.style.top = '';
          }
        };
        const field = stickEl?.parentElement;
        field?.addEventListener('pointerdown', pointerDown);
        stickEl?.addEventListener('pointermove', pointerMove);
        stickEl?.addEventListener('pointerup', pointerUp);
        stickEl?.addEventListener('pointercancel', pointerUp);
        if (cancelled) {
          field?.removeEventListener('pointerdown', pointerDown);
          stickEl?.removeEventListener('pointermove', pointerMove);
          stickEl?.removeEventListener('pointerup', pointerUp);
          stickEl?.removeEventListener('pointercancel', pointerUp);
          return;
        }
        onResize();
        window.addEventListener('resize', onResize);
        detachListeners = () => {
          window.removeEventListener('resize', onResize);
          field?.removeEventListener('pointerdown', pointerDown);
          stickEl?.removeEventListener('pointermove', pointerMove);
          stickEl?.removeEventListener('pointerup', pointerUp);
          stickEl?.removeEventListener('pointercancel', pointerUp);
        };

        const stamp: WatchStamp = {
          tick: -1,
          paused: false,
          awaitingChoice: false,
          outcome: '',
          level: 0,
          rerolls: 0,
          choiceId: '',
        };
        const stepCues: CombatCueFold = {
          hitEnemy: false,
          hitPlayer: false,
          pickup: false,
          levelUp: false,
          boss: false,
          ending: '',
        };
        const loop = (now: number) => {
          if (cancelled || !runtime || !prevSnap) return;
          const frameDt = Math.min(100, now - last);
          last = now;
          acc += frameDt;

          let steps = 0;
          readWatchStamp(runtime.world, stamp);
          while (acc >= TICK_MS && steps < 4) {
            if (!storyGateRef.current) {
              acc -= TICK_MS;
              steps += 1;
              continue;
            }
            input.setDialogOpen(dialogOpenRef.current || simDialogRef.current);
            const events = runtime.step(input.sample());
            clearCombatCueFold(stepCues);
            let openDialog = false;
            for (let i = 0; i < events.length; i++) {
              const ev = events[i]!;
              if (ev.kind === 'level_offer' || ev.kind === 'paused' || ev.kind === 'run_ended') openDialog = true;
              if (ev.kind === 'cue' && isCueId(ev.cueId)) {
                audio.play(ev.cueId, ev.intensity);
              } else if (ev.kind === 'run_ended') {
                noteCombatCue(stepCues, ev.kind, ev.outcome);
              } else if (ev.kind === 'paused') {
                writeRunCheckpointSync(captureRunCheckpoint(runtime, 'pause'));
              } else if (ev.kind === 'boss_defeated') {
                writeRunCheckpointSync(captureRunCheckpoint(runtime, 'boss'));
              } else {
                noteCombatCue(stepCues, ev.kind);
              }
            }
            if (openDialog) simDialogRef.current = true;
            if (stepCues.levelUp) audio.play('level_up');
            if (stepCues.hitPlayer) audio.play('hit_player', 0.6);
            if (stepCues.hitEnemy) audio.play('hit_enemy', 0.45);
            if (stepCues.pickup) audio.play('pickup', 0.4);
            if (stepCues.boss) {
              audio.play('boss_warn', 0.8);
              audio.play('boss_intro', 0.7);
            }
            if (stepCues.ending) audio.play(stepCues.ending, 1);
            acc -= TICK_MS;
            steps += 1;
          }

          const advanced = watchChanged(stamp, runtime.world);
          const current = advanced ? runtime.snapshot(useA ? snapB : snapA) : prevSnap;
          if (advanced) useA = !useA;
          const alpha = advanced ? Math.min(1, acc / TICK_MS) : 1;
          renderer.render(prevSnap, current, alpha);
          prevSnap = current;
          simDialogRef.current =
            current.hud.awaitingLevelChoice ||
            current.hud.paused ||
            current.hud.runOutcome !== 'ongoing';
          hudThrottle += frameDt;
          if (hudThrottle >= 80) {
            hudThrottle = 0;
            setHud(copyHud(current.hud));
            if (current.hud.runOutcome !== 'ongoing') {
              void persistRunEnd(current.hud, save);
            }
          }
          raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);

        const protectRun = () => {
          const current = runtimeRef.current;
          if (!current || abandoningRef.current || current.world.run.outcome !== 'ongoing') return;
          releaseStick();
          current.world.run.paused = true;
          writeRunCheckpointSync(captureRunCheckpoint(current, 'background'));
          sessionStorage.setItem(RUN_RESUME_FLAG, '1');
          setHud((prev) => (prev ? { ...prev, paused: true } : prev));
        };
        const onBlur = () => {
          if (interruptionResponse('blur') === 'pause') protectRun();
        };
        const onVisibility = () => {
          const signal = document.hidden ? 'hidden' : 'visible';
          if (interruptionResponse(signal) === 'pause') protectRun();
        };
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
          if (!runtimeRef.current || abandoningRef.current || runtimeRef.current.world.run.outcome !== 'ongoing') {
            return;
          }
          protectRun();
          event.preventDefault();
          event.returnValue = '';
        };
        const onPopState = () => {
          window.history.pushState({ rakshakRun: true }, '');
          requestExitRef.current();
        };
        window.history.pushState({ rakshakRun: true }, '');
        window.addEventListener('pagehide', protectRun);
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('popstate', onPopState);
        requestExitRef.current = () => {
          const current = runtimeRef.current;
          if (!current || current.world.run.outcome !== 'ongoing') {
            abandoningRef.current = true;
            window.location.assign('/');
            return;
          }
          releaseStick();
          current.world.run.paused = true;
          writeRunCheckpointSync(captureRunCheckpoint(current, 'quit'));
          setPausePanel('abandon');
          setHud((prev) => (prev ? { ...prev, paused: true } : prev));
        };
        const previousDetach = detachListeners;
        detachListeners = () => {
          previousDetach?.();
          window.removeEventListener('pagehide', protectRun);
          window.removeEventListener('blur', onBlur);
          document.removeEventListener('visibilitychange', onVisibility);
          window.removeEventListener('beforeunload', onBeforeUnload);
          window.removeEventListener('popstate', onPopState);
        };

      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to start run');
      }
    }

    void boot();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      detachListeners?.();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('pointerdown', revealStick);
      window.removeEventListener('keydown', unlockAudio);
      input.dispose();
      inputRef.current = null;
      audioRef.current = null;
      rendererRef.current = null;
      runtimeRef.current = null;
      audio.dispose();
      renderer.dispose();
    };
  }, [bootAttempt, guardianId, mapId]);

  const outcome = hud?.runOutcome ?? 'ongoing';
  const choices = hud?.levelChoices ?? [];
  const storyOpen = !storyDismissed && ready && outcome === 'ongoing';
  const levelOpen = Boolean(hud?.awaitingLevelChoice && choices.length > 0);
  const pauseOpen = Boolean(hud?.paused && outcome === 'ongoing' && choices.length === 0);
  const resultsOpen = outcome !== 'ongoing' && Boolean(hud);
  const outcomeSummary: RunOutcomeSummary | null =
    resultsOpen && saveRef.current && runtimeRef.current
      ? describeRunOutcome(saveRef.current, buildRunReport(runtimeRef.current.world))
      : null;
  const modalKind = error
    ? 'error'
    : helpReplay || storyOpen
      ? 'story'
      : resultsOpen
        ? 'results'
        : levelOpen
          ? 'level'
          : pauseOpen
            ? 'pause'
            : null;
  dialogOpenRef.current = modalKind !== null;
  const backgroundInert = modalKind !== null ? true : undefined;
  const statusKey = error
    ? 'error'
    : resultsOpen
      ? outcome
      : levelOpen
        ? 'upgrade'
        : pauseOpen
          ? 'paused'
          : hud && isLowHealth(hud.hp, hud.maxHp)
            ? 'wounded'
            : ready
              ? 'playing'
              : '';
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const statusKeyRef = useRef('');
  useEffect(() => {
    if (!statusKey || statusKey === statusKeyRef.current) return;
    const previous = statusKeyRef.current;
    statusKeyRef.current = statusKey;
    if (statusKey === 'playing') {
      if (previous === 'paused') setStatusAnnouncement('Resumed');
      return;
    }
    const lines: Record<string, string> = {
      paused: 'Paused',
      wounded: 'Wounded',
      upgrade: 'Choose an upgrade',
      victory: 'Dawn reached the beacon',
      defeat: 'The night held',
      error: 'The watch did not start',
    };
    const line = lines[statusKey];
    if (line) setStatusAnnouncement(line);
  }, [statusKey]);

  return (
    <div className={`play-root${touchPlay ? ' touch-play' : ''}`}>
      <div className="sr-only" aria-live="polite">
        {statusAnnouncement}
      </div>
      <div className="play-orient">
        <p>Turn sideways. The night is played in landscape.</p>
        <Link href="/settings">Settings</Link>
        <Link href="/">Menu</Link>
      </div>
      <div ref={hostRef} className="play-canvas-host" inert={backgroundInert} />
      <div className="play-hud">
        <div className="play-hud-top" inert={backgroundInert}>
          <div>
            {hud ? (
              <>
                <div className="hud-line">
                  {guardian.displayName} · Lv {hud.level}
                  {isLowHealth(hud.hp, hud.maxHp) ? ' · Wounded' : ''}
                </div>
                <div className="hud-meter">
                  <span className="hud-meter-label">HP</span>
                  <div
                    className={`hp-bar${isLowHealth(hud.hp, hud.maxHp) ? ' low' : ''}`}
                    role="progressbar"
                    aria-label="Health"
                    aria-valuemin={0}
                    aria-valuemax={Math.ceil(hud.maxHp)}
                    aria-valuenow={Math.ceil(hud.hp)}
                  >
                    <span style={{ width: `${(hud.hp / Math.max(1, hud.maxHp)) * 100}%` }} />
                  </div>
                  <span className="hud-meter-value">
                    {Math.ceil(hud.hp)}/{Math.ceil(hud.maxHp)}
                  </span>
                </div>
                <div className="hud-meter">
                  <span className="hud-meter-label">XP</span>
                  <div
                    className="xp-bar"
                    role="progressbar"
                    aria-label="Experience"
                    aria-valuemin={0}
                    aria-valuemax={Math.ceil(hud.xpToNext)}
                    aria-valuenow={Math.ceil(hud.xp)}
                  >
                    <span style={{ width: `${(hud.xp / Math.max(1, hud.xpToNext)) * 100}%` }} />
                  </div>
                  <span className="hud-meter-value">
                    {Math.ceil(hud.xp)}/{Math.ceil(hud.xpToNext)}
                  </span>
                </div>
                <div className="hud-slots" aria-label="Equipped build">
                  {hud.weaponSlots.map((slot) => (
                    <span key={`w-${slot.contentId}`} className="hud-slot">
                      {choiceLabel(slot.contentId, 'weapon')} {slot.level}
                    </span>
                  ))}
                  {hud.passiveSlots.map((slot) => (
                    <span key={`p-${slot.contentId}`} className="hud-slot passive">
                      {choiceLabel(slot.contentId, 'passive')} {slot.level}
                    </span>
                  ))}
                </div>
                <div className="hud-muted">Kills {hud.kills}</div>
              </>
            ) : (
              <div>{copy.loadingCore}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="hud-timer">{hud ? formatTime(hud.survivalSeconds) : '0:00'}</div>
            <div className="hud-muted">{map.displayName}</div>
            <div className="hud-objective">
              {hud ? nextWatchObjective(hud.survivalSeconds, Boolean(hud.bossId)) : 'Lieutenant at 4:00'}
            </div>
            {hud?.bossId ? (
              <div className="boss-bar">
                <div className="boss-bar-label">{hud.bossId.replace(/_/g, ' ')}</div>
                <div
                  className="xp-bar boss"
                  role="progressbar"
                  aria-label="Boss health"
                  aria-valuemin={0}
                  aria-valuemax={Math.ceil(hud.bossMaxHp)}
                  aria-valuenow={Math.ceil(hud.bossHp)}
                >
                  <span
                    className="boss-fill"
                    style={{ width: `${(hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100}%` }}
                  />
                </div>
                <div className="hud-meter-value">
                  {Math.ceil(hud.bossHp)}/{Math.ceil(hud.bossMaxHp)}
                </div>
              </div>
            ) : null}
            <div className="hud-muted">
              {hud?.paused ? 'Paused' : ready ? controlPrompt({ touch: touchPlay, bindings: liveSettings?.bindings }) : ''}
            </div>
          </div>
        </div>

        {levelOpen && hud ? (
          <ModalDialog
            active={modalKind === 'level'}
            focusKey={choices.map((choice) => choice.contentId).join('|')}
            className="level-up-overlay"
            label="Choose upgrade"
          >
            <h2>Choose your path</h2>
            <p className="hud-muted">1 / 2 / 3 or tap · R rerolls ({hud.rerollsRemaining} left)</p>
            <div className="level-up-cards">
              {choices.map((c, i) => {
                const explained = describeLevelChoice({
                  kind: c.kind,
                  contentId: c.contentId,
                  currentLevel: c.currentLevel,
                  nextLevel: c.nextLevel,
                  weaponCount: hud.weaponSlots.length,
                  passiveCount: hud.passiveSlots.length,
                  discoveredEvolutions: knownEvolutions,
                });
                return (
                  <button
                    key={`${c.contentId}-${i}`}
                    type="button"
                    className="level-card"
                    data-autofocus={i === 0 ? true : undefined}
                    onClick={() => pickChoice(i as 0 | 1 | 2)}
                  >
                    <span className="level-card-mark" aria-hidden="true">
                      {explained.mark}
                    </span>
                    <span className="level-card-kind">
                      {explained.badge}
                      {c.currentLevel === 0 ? '' : ` · Lv ${c.currentLevel} → ${c.nextLevel}`}
                    </span>
                    <strong>{explained.title}</strong>
                    <span className="level-card-stat">{explained.behavior}</span>
                    {explained.stats.map((line) => (
                      <span key={line} className="level-card-stat">
                        {line}
                      </span>
                    ))}
                    <span className="level-card-stat">{explained.slot}</span>
                    <span className="level-card-stat">{explained.evolution}</span>
                  </button>
                );
              })}
            </div>
            {hud.rerollsRemaining > 0 ? (
              <button type="button" className="ghost-btn" onClick={() => inputRef.current?.injectCancel()}>
                Reroll
              </button>
            ) : null}
          </ModalDialog>
        ) : null}

        {resultsOpen && hud ? (
          <ModalDialog
            active={modalKind === 'results'}
            focusKey={outcomeSummary?.nextStep ?? outcome}
            className="results-overlay"
            label="Run results"
          >
            <h2>{outcomeSummary?.title ?? (outcome === 'victory' ? copy.runVictory : copy.runDefeat)}</h2>
            <p>{outcomeSummary?.flavor}</p>
            <p>
              {formatTime(hud.survivalSeconds)} · Level {hud.level} · {hud.kills} fallen
            </p>
            {outcomeSummary ? (
              <div className="results-detail">
                <p>
                  <strong>{outcomeSummary.totalMarks} guardian marks</strong>
                </p>
                {outcomeSummary.markLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>{outcomeSummary.build.length ? `Build: ${outcomeSummary.build.join(' · ')}` : 'No weapons carried.'}</p>
                <p>{outcomeSummary.recordLine}</p>
                <p>{outcomeSummary.unlocks.length ? `Unlocked: ${outcomeSummary.unlocks.join(', ')}` : 'No new unlocks.'}</p>
                <p>{outcomeSummary.damageLine}</p>
              </div>
            ) : null}
            <p className="hud-muted">
              {saveState === 'saved'
                ? 'Progress saved in this browser. Settings can export a backup. Opening the site again needs a connection.'
                : saveState === 'failed'
                  ? 'Could not save this run. It is still on this screen until you save it.'
                  : 'Saving this watch in this browser…'}
            </p>
            {saveState === 'failed' ? (
              <button type="button" className="nav-link" onClick={() => retrySaveRef.current()}>
                Save again
              </button>
            ) : null}
            <div className="results-actions">
              {outcomeSummary?.nextStep === 'next-map' && outcomeSummary.nextMapId ? (
                <button
                  type="button"
                  className="nav-link primary"
                  data-autofocus
                  onClick={() => onNextMap(outcomeSummary.nextMapId as MapId)}
                >
                  Next map: {outcomeSummary.nextMapName}
                </button>
              ) : (
                <button type="button" className="nav-link primary" data-autofocus onClick={onRetry}>
                  Retry
                </button>
              )}
              {outcomeSummary?.nextStep === 'next-map' ? (
                <button type="button" className="nav-link" onClick={onRetry}>
                  Retry
                </button>
              ) : null}
              <button type="button" className="nav-link" onClick={onNewWatch}>
                New Watch
              </button>
              <Link href="/" className="nav-link">
                Menu
              </Link>
            </div>
          </ModalDialog>
        ) : null}

        {pauseOpen && hud ? (
          <ModalDialog active={modalKind === 'pause'} focusKey={pausePanel} className="pause-overlay" label="Paused">
            <h2>Paused</h2>
            <p>The latest checkpoint of this watch stays in this browser until you finish or leave.</p>
            {resumeNote ? <p>{resumeNote}</p> : null}
            <p>
              {formatTime(hud.survivalSeconds)} · Level {hud.level} · HP {Math.ceil(hud.hp)}/{Math.ceil(hud.maxHp)} ·{' '}
              {hud.kills} fallen
            </p>
            {pausePanel === 'main' ? (
              <>
                <div className="pause-build">
                  <p className="hud-muted">Build</p>
                  <p>
                    {hud.weaponSlots.length
                      ? hud.weaponSlots
                          .map((slot) => `${choiceLabel(slot.contentId, 'weapon')} ${slot.level}`)
                          .join(' · ')
                      : 'No weapons'}
                  </p>
                  <p>
                    {hud.passiveSlots.length
                      ? hud.passiveSlots
                          .map((slot) => `${choiceLabel(slot.contentId, 'passive')} ${slot.level}`)
                          .join(' · ')
                      : 'No passives'}
                  </p>
                </div>
                <div className="results-actions">
                  <button type="button" className="nav-link primary" data-autofocus onClick={() => inputRef.current?.injectPause()}>
                    Resume
                  </button>
                  <button type="button" className="nav-link" onClick={() => setPausePanel('settings')}>
                    Settings
                  </button>
                  <button type="button" className="nav-link" onClick={() => setHelpReplay(true)}>
                    How to play
                  </button>
                  <button type="button" className="nav-link" onClick={() => setPausePanel('credits')}>
                    Credits
                  </button>
                  <button type="button" className="nav-link" onClick={() => setPausePanel('abandon')}>
                    Abandon run
                  </button>
                </div>
              </>
            ) : null}
            {pausePanel === 'settings' && liveSettings ? (
              <div className="pause-build">
                <label className="choice-row">
                  <span>Master {Math.round(liveSettings.masterVolume * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    data-autofocus
                    value={liveSettings.masterVolume}
                    onChange={(e) => {
                      applyLiveSettings({ ...liveSettings, masterVolume: Number(e.target.value) });
                      audioRef.current?.play('ui_confirm', 0.5);
                    }}
                  />
                </label>
                <label className="choice-row">
                  <span>Music {Math.round(liveSettings.musicVolume * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={liveSettings.musicVolume}
                    onChange={(e) => {
                      applyLiveSettings({ ...liveSettings, musicVolume: Number(e.target.value) });
                      audioRef.current?.play('victory', 0.45);
                    }}
                  />
                </label>
                <label className="choice-row">
                  <span>UI {Math.round(liveSettings.uiVolume * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={liveSettings.uiVolume}
                    onChange={(e) => {
                      const next = { ...liveSettings, uiVolume: Number(e.target.value) };
                      applyLiveSettings(next);
                      audioRef.current?.play('ui_confirm');
                    }}
                  />
                </label>
                <label className="choice-row">
                  <span>Night tone {Math.round(liveSettings.ambienceVolume * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={liveSettings.ambienceVolume}
                    onChange={(e) => applyLiveSettings({ ...liveSettings, ambienceVolume: Number(e.target.value) })}
                  />
                </label>
                <label className="choice-row">
                  <span>SFX {Math.round(liveSettings.sfxVolume * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={liveSettings.sfxVolume}
                    onChange={(e) => {
                      applyLiveSettings({ ...liveSettings, sfxVolume: Number(e.target.value) });
                      audioRef.current?.play('pickup', 0.6);
                    }}
                  />
                </label>
                <button type="button" className="ghost-btn" onClick={() => applyLiveSettings({ ...liveSettings, muted: !liveSettings.muted })}>
                  Mute: {liveSettings.muted ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => applyLiveSettings({ ...liveSettings, reducedEffects: !liveSettings.reducedEffects })}
                >
                  Reduced effects: {liveSettings.reducedEffects ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() =>
                    applyLiveSettings({
                      ...liveSettings,
                      stickSide: liveSettings.stickSide === 'left' ? 'right' : 'left',
                    })
                  }
                >
                  Stick side: {liveSettings.stickSide}
                </button>
                <ul className="content-list">
                  {controlsReference(liveSettings.bindings).map((row) => (
                    <li key={row.action}>
                      <strong>{row.action}</strong>
                      <span>{row.path}</span>
                    </li>
                  ))}
                </ul>
                {settingsNote ? <p className="hud-muted">{settingsNote}</p> : null}
                {settingsNote === 'Could not save settings.' ? (
                  <button type="button" className="nav-link" onClick={() => applyLiveSettings(liveSettings)}>
                    Save settings again
                  </button>
                ) : null}
                <button type="button" className="nav-link" onClick={() => setPausePanel('main')}>
                  Back to pause
                </button>
              </div>
            ) : null}
            {pausePanel === 'credits' ? (
              <div className="pause-build">
                {creditSections.map((section) => (
                  <p key={section.title}>
                    <strong>{section.title}. </strong>
                    {section.lines.join(' ')}
                  </p>
                ))}
                <button type="button" className="nav-link" onClick={() => setPausePanel('main')}>
                  Back to pause
                </button>
              </div>
            ) : null}
            {pausePanel === 'abandon' ? (
              <div className="pause-build">
                <p>
                  Leaving discards this watch. Marks and unlocks from it are not awarded, and its checkpoint is
                  cleared.
                </p>
                <div className="results-actions">
                  <button type="button" className="nav-link primary" data-autofocus onClick={() => setPausePanel('main')}>
                    Keep watching
                  </button>
                  <Link
                    href="/"
                    className="nav-link"
                    onClick={() => {
                      abandoningRef.current = true;
                      clearRunCheckpointSync();
                      sessionStorage.removeItem(RUN_RESUME_FLAG);
                    }}
                  >
                    Leave the watch
                  </Link>
                </div>
              </div>
            ) : null}
          </ModalDialog>
        ) : null}

        {storyOpen ? (
          <TutorialCard
            active={modalKind === 'story' && !helpReplay}
            step={helpStep}
            place={mapIntro}
            moveHint={controlPrompt({ touch: touchPlay, bindings: liveSettings?.bindings })}
            onNext={() => setHelpStep((current) => Math.min(tutorialSteps.length - 1, current + 1))}
            onDone={dismissStory}
            doneLabel="Start Run"
          />
        ) : null}
        {helpReplay ? (
          <TutorialCard
            active={modalKind === 'story'}
            step={helpStep}
            place={mapIntro}
            moveHint={controlPrompt({ touch: touchPlay, bindings: liveSettings?.bindings })}
            onNext={() => setHelpStep((current) => Math.min(tutorialSteps.length - 1, current + 1))}
            onDone={() => {
              setHelpReplay(false);
              setHelpStep(0);
            }}
            doneLabel="Back to pause"
          />
        ) : null}

        <div
          ref={stickRef}
          className={`virtual-stick ${liveSettings?.stickSize ?? 'medium'} ${liveSettings?.stickMode ?? 'fixed'}${stickSide === 'right' ? ' right' : ''}`}
          aria-label="Move stick"
          inert={backgroundInert}
        >
          <span className="stick-readout" />
          <span className="stick-deadzone" />
          <span className="stick-knob" />
        </div>

        <div className="play-footer-links" inert={backgroundInert}>
          <button type="button" className="ghost-btn" onClick={() => inputRef.current?.injectPause()}>
            {hud?.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="back-link" onClick={() => requestExitRef.current()}>
            Menu
          </button>
        </div>

        {profileBlock ? (
          <ProfileRecovery
            overlay
            load={profileBlock}
            onResolved={() => {
              setProfileBlock(null);
              setBootAttempt((n) => n + 1);
            }}
          />
        ) : null}

        {error ? (
          <ModalDialog active={modalKind === 'error'} focusKey="error" className="results-overlay" label="Run failed to start">
            <h2>The watch did not start</h2>
            <p>{error}</p>
            <div className="results-actions">
              <button type="button" className="nav-link primary" data-autofocus onClick={() => setBootAttempt((n) => n + 1)}>
                Try again
              </button>
              <Link href="/" className="back-link">
                {copy.back}
              </Link>
            </div>
          </ModalDialog>
        ) : null}
      </div>
    </div>
  );
}
