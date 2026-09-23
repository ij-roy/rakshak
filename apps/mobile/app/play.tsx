import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, AppState, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, PaintStyle, Picture, Skia, createPicture, matchFont } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { applyRunCheckpoint, buildRunReport, captureRunCheckpoint, createGame, readWatchStamp, watchChanged, type GameRuntime, type WatchStamp } from '@rakshak/game-core';
import {
  describeLevelChoice,
  isLowHealth,
  nextWatchObjective,
  PASSIVE_BY_ID,
  WEAPON_BY_ID,
  type PassiveId,
  type WeaponId,
} from '@rakshak/game-data';
import {
  copyHud,
  createEmptyRenderSnapshot,
  EMPTY_INPUT,
  firstCheckpoint,
  paintWatch,
  type HudSnapshot,
  type InputSnapshot,
  type MutableRenderSnapshot,
  type RenderSnapshot,
} from '@rakshak/game-protocol';
import { colors, copy, creditSections, spacing, tutorialSteps } from '@rakshak/game-ui';
import {
  inputForLevelChoice,
  inputForPauseToggle,
  inputForReroll,
  interruptionResponse,
  type VirtualStickState,
} from '@rakshak/input';
import { createFrameQuality, stepFrameQuality, TICK_MS } from '@rakshak/shared';
import {
  claimReward,
  commitProfile,
  computeSaveChecksum,
  createDefaultSave,
  describeRunOutcome,
  loadProfile,
  replaceProfile,
  EMPTY_HELD_REWARD,
  holdReward,
  PENDING_PROFILE_KEY,
  rewardContextFromSave,
  settleRun,
  type ProfileLoad,
  type RunOutcomeSummary,
  validateSave,
  withBumpedRevision,
  type SaveFileV1,
} from '@rakshak/storage';
import { VirtualStick, sampleStick } from '../components/VirtualStick';
import { createAsyncStorageRepository } from '../lib/asyncStoragePort';
import { clearRunCheckpoint, readRunCheckpoint, writeRunCheckpoint } from '../lib/runCheckpoint';
import AsyncStorage from '@react-native-async-storage/async-storage';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function choiceLabel(contentId: string, kind: string): string {
  if (kind === 'weapon') return WEAPON_BY_ID[contentId as WeaponId]?.displayName ?? contentId;
  if (kind === 'passive') return PASSIVE_BY_ID[contentId as PassiveId]?.displayName ?? contentId;
  return contentId.replace(/_/g, ' ');
}

export default function PlayScreen() {
  const { width, height } = useWindowDimensions();
  const cueFont = useMemo(() => {
    try {
      return matchFont({ fontFamily: 'sans-serif', fontSize: 16 });
    } catch {
      return null;
    }
  }, []);
  const viewRef = useRef({ width, height });
  viewRef.current = { width, height };
  const fontRef = useRef(cueFont);
  fontRef.current = cueFont;
  const picture = useSharedValue(createPicture(() => undefined, Skia.XYWHRect(0, 0, 1, 1)));
  const insets = useSafeAreaInsets();
  const [runKey, setRunKey] = useState(0);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const stickRef = useRef<VirtualStickState>({ dx: 0, dy: 0, active: false });
  const edgeRef = useRef<InputSnapshot | null>(null);
  const frameBuffers = useRef<MutableRenderSnapshot[]>([
    createEmptyRenderSnapshot(),
    createEmptyRenderSnapshot(),
    createEmptyRenderSnapshot(),
  ]);
  const frameSlot = useRef(0);
  const hudKeyRef = useRef('');
  const savedRef = useRef(false);
  const rewardHeldRef = useRef(EMPTY_HELD_REWARD);
  const retrySaveRef = useRef<() => void>(() => {});
  const [rewardBlocked, setRewardBlocked] = useState(false);
  const [profileBlock, setProfileBlock] = useState<Extract<ProfileLoad, { status: 'blocked' }> | null>(null);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [saveNote, setSaveNote] = useState('');
  const [outcomeSummary, setOutcomeSummary] = useState<RunOutcomeSummary | null>(null);
  const helpGateRef = useRef(true);
  const [showHelp, setShowHelp] = useState(true);
  const [showCredits, setShowCredits] = useState(false);
  const [helpStep, setHelpStep] = useState(0);
  const [knownEvolutions, setKnownEvolutions] = useState<readonly string[]>([]);

  const closeHelp = useCallback(() => {
    helpGateRef.current = false;
    void AsyncStorage.setItem('rakshak.help.seen', '1');
    setShowHelp(false);
    setHelpStep(0);
  }, []);

  useEffect(() => {
    void AsyncStorage.getItem('rakshak.help.seen').then((seen) => {
      if (seen === '1') {
        helpGateRef.current = false;
        setShowHelp(false);
      }
    });
  }, []);

  const queue = useCallback((input: InputSnapshot) => {
    edgeRef.current = input;
  }, []);

  const onStick = useCallback((dx: number, dy: number, active: boolean) => {
    const stick = stickRef.current;
    if (runtimeRef.current?.world.run.paused || !active) {
      stick.dx = 0;
      stick.dy = 0;
      stick.active = false;
      return;
    }
    stick.dx = dx;
    stick.dy = dy;
    stick.active = active;
  }, []);

  useEffect(() => {
    let alive = true;
    const retired: { dispose(): void }[] = [];
    const colors = new Map<string, ReturnType<typeof Skia.Color>>();
    const colorOf = (value: string) => {
      const cached = colors.get(value);
      if (cached) return cached;
      const next = Skia.Color(value);
      colors.set(value, next);
      return next;
    };
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    const skPath = Skia.Path.Make();
    const shapePaths = new Map<ArrayLike<number>, ReturnType<typeof Skia.Path.Make>>();
    const pathFor = (points: ArrayLike<number>) => {
      const cached = shapePaths.get(points);
      if (cached) return cached;
      const path = Skia.Path.Make();
      path.moveTo(points[0] ?? 0, points[1] ?? 0);
      for (let i = 2; i < points.length; i += 2) path.lineTo(points[i] ?? 0, points[i + 1] ?? 0);
      path.close();
      shapePaths.set(points, path);
      return path;
    };
    const hudStamp = {
      hp: Number.NaN,
      level: -1,
      seconds: -1,
      paused: -1,
      choices: '',
      rerolls: -1,
      outcome: '',
      bossId: '',
      bossHp: Number.NaN,
      weapons: [] as { contentId: string; level: number }[],
      passives: [] as { contentId: string; level: number }[],
    };
    const slotsDiffer = (
      prev: { contentId: string; level: number }[],
      next: readonly { contentId: string; level: number }[],
    ) => {
      if (prev.length !== next.length) return true;
      for (let i = 0; i < next.length; i++) {
        const slot = next[i];
        const prior = prev[i];
        if (!slot || !prior || slot.contentId !== prior.contentId || slot.level !== prior.level) return true;
      }
      return false;
    };
    const rememberSlots = (
      prev: { contentId: string; level: number }[],
      next: readonly { contentId: string; level: number }[],
    ) => {
      prev.length = next.length;
      for (let i = 0; i < next.length; i++) {
        const slot = next[i];
        if (!slot) continue;
        const prior = prev[i] ?? { contentId: '', level: 0 };
        prior.contentId = slot.contentId;
        prior.level = slot.level;
        prev[i] = prior;
      }
    };
    let pendingSnap: RenderSnapshot | null = null;
    let pendingDecorative = true;
    let pendingW = 1;
    let pendingH = 1;
    let recording: {
      save(): void;
      restore(): void;
      translate(x: number, y: number): void;
      rotate(degrees: number, px: number, py: number): void;
      drawCircle(x: number, y: number, radius: number, brush: ReturnType<typeof Skia.Paint>): void;
      drawPath(path: ReturnType<typeof Skia.Path.Make>, brush: ReturnType<typeof Skia.Paint>): void;
      drawText(
        value: string,
        x: number,
        y: number,
        brush: ReturnType<typeof Skia.Paint>,
        font: NonNullable<typeof fontRef.current>,
      ): void;
    } | null = null;
    const drawPoints = (points: ArrayLike<number>, color: string, opacity: number, strokeWidth: number, close: boolean) => {
      const canvas = recording;
      if (!canvas || points.length < 4) return;
      skPath.reset();
      skPath.moveTo(points[0] ?? 0, points[1] ?? 0);
      for (let i = 2; i < points.length; i += 2) skPath.lineTo(points[i] ?? 0, points[i + 1] ?? 0);
      if (close) skPath.close();
      paint.setColor(colorOf(color));
      paint.setAlphaf(Math.max(0, Math.min(1, opacity)));
      paint.setStyle(strokeWidth > 0 ? PaintStyle.Stroke : PaintStyle.Fill);
      paint.setStrokeWidth(strokeWidth);
      canvas.drawPath(skPath, paint);
    };
    const brush = {
      circle(x: number, y: number, radius: number, color: string, opacity: number, strokeWidth: number) {
        const canvas = recording;
        if (!canvas) return;
        paint.setColor(colorOf(color));
        paint.setAlphaf(Math.max(0, Math.min(1, opacity)));
        paint.setStyle(strokeWidth > 0 ? PaintStyle.Stroke : PaintStyle.Fill);
        paint.setStrokeWidth(strokeWidth);
        canvas.drawCircle(x, y, radius, paint);
      },
      polygon(points: ArrayLike<number>, color: string, opacity: number, strokeWidth: number) {
        drawPoints(points, color, opacity, strokeWidth, true);
      },
      polyline(points: ArrayLike<number>, color: string, opacity: number, strokeWidth: number) {
        drawPoints(points, color, opacity, strokeWidth, false);
      },
      silhouette(
        points: ArrayLike<number>,
        originX: number,
        originY: number,
        facing: number,
        color: string,
        opacity: number,
        strokeWidth: number,
      ) {
        const canvas = recording;
        if (!canvas) return;
        canvas.save();
        canvas.translate(originX, originY);
        canvas.rotate((facing * 180) / Math.PI, 0, 0);
        paint.setColor(colorOf(color));
        paint.setAlphaf(Math.max(0, Math.min(1, opacity)));
        paint.setStyle(strokeWidth > 0 ? PaintStyle.Stroke : PaintStyle.Fill);
        paint.setStrokeWidth(strokeWidth);
        canvas.drawPath(pathFor(points), paint);
        canvas.restore();
      },
      text(value: string, x: number, y: number, color: string, opacity: number) {
        const canvas = recording;
        const font = fontRef.current;
        if (!canvas || !font) return;
        paint.setColor(colorOf(color));
        paint.setAlphaf(Math.max(0, Math.min(1, opacity)));
        paint.setStyle(PaintStyle.Fill);
        canvas.drawText(value, x, y, paint, font);
      },
    };
    const record = (canvas: NonNullable<typeof recording>) => {
      recording = canvas;
      if (pendingSnap) paintWatch(pendingSnap, pendingW, pendingH, brush, pendingDecorative);
      recording = null;
    };
    const publish = (snap: RenderSnapshot, decorative = true) => {
      pendingW = Math.max(1, viewRef.current.width);
      pendingH = Math.max(1, viewRef.current.height);
      pendingSnap = snap;
      pendingDecorative = decorative;
      const next = createPicture(record, Skia.XYWHRect(0, 0, pendingW, pendingH));
      retired.push(picture.value);
      picture.value = next;
      if (retired.length > 2) retired.shift()?.dispose();
    };
    const repo = createAsyncStorageRepository();
    let interval: ReturnType<typeof setInterval> | null = null;
    savedRef.current = false;
    hudKeyRef.current = '';
    rewardHeldRef.current = EMPTY_HELD_REWARD;
    edgeRef.current = null;
    stickRef.current = { dx: 0, dy: 0, active: false };

    let saving = false;
    async function persist(current: HudSnapshot, base: SaveFileV1) {
      if (saving || rewardHeldRef.current.claimed || current.runOutcome === 'ongoing' || !runtimeRef.current) return;
      saving = true;
      setSaveNote('Saving this watch…');
      const report = buildRunReport(runtimeRef.current.world);
      setOutcomeSummary(describeRunOutcome(base, report));
      rewardHeldRef.current = holdReward(rewardHeldRef.current, settleRun(base, report));
      if (!rewardHeldRef.current.pending) {
        saving = false;
        return;
      }
      try {
        await AsyncStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(rewardHeldRef.current.pending));
        const result = await commitProfile(
          repo,
          (s) => JSON.stringify(s),
          (raw) => validateSave(JSON.parse(raw) as unknown),
          rewardHeldRef.current.pending,
        );
        rewardHeldRef.current = claimReward(rewardHeldRef.current, result.ok);
        if (!alive) return;
        if (result.ok) {
          savedRef.current = true;
          await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
          await clearRunCheckpoint();
          setSaveNote('Progress saved on this device.');
          return;
        }
      } catch {
        // The next publish can try this watch again.
      }
      saving = false;
      if (alive) setSaveNote('Could not save this run.');
    }

    async function boot() {
      const pendingRaw = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
      if (pendingRaw) {
        let flushedOk = false;
        try {
          const pending = validateSave(JSON.parse(pendingRaw) as unknown);
          if (pending.ok) {
            const flushed = await commitProfile(
              repo,
              (s) => JSON.stringify(s),
              (raw) => validateSave(JSON.parse(raw) as unknown),
              pending.save,
            );
            flushedOk = flushed.ok;
          } else {
            flushedOk = true;
          }
        } catch {
          flushedOk = true;
        }
        if (!flushedOk) {
          if (alive) {
            setRewardBlocked(true);
            setSaveNote('Could not save the last watch.');
          }
          return;
        }
        await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
      }
      if (alive) setRewardBlocked(false);

      const loaded = await loadProfile(repo);
      if (loaded.status === 'blocked') {
        if (alive) setProfileBlock(loaded);
        return;
      }
      if (alive) setProfileBlock(null);
      let save: SaveFileV1 = loaded.save;
      const bumped = withBumpedRevision({
        ...save,
        statistics: {
          ...save.statistics,
          runsStarted: save.statistics.runsStarted + 1,
        },
        updatedAt: new Date().toISOString(),
      });
      save = { ...bumped, checksum: computeSaveChecksum(bumped) };
      await commitProfile(
        repo,
        (s) => JSON.stringify(s),
        (raw) => validateSave(JSON.parse(raw) as unknown),
        save,
      );

      const runtime = createGame((Date.now() ^ (runKey * 9973)) >>> 0, {
        guardianId: 'asha',
        mapId: 'gaon',
        rewardContext: rewardContextFromSave(save),
      });
      const resumeFlag = await AsyncStorage.getItem('run.resume');
      const freshFlag = await AsyncStorage.getItem('run.fresh');
      await AsyncStorage.multiRemove(['run.resume', 'run.fresh']);
      if (resumeFlag === '1' && freshFlag !== '1') {
        const checkpoint = await readRunCheckpoint();
        if (checkpoint) applyRunCheckpoint(runtime, checkpoint);
      }
      runtimeRef.current = runtime;
      retrySaveRef.current = () => {
        void persist({ runOutcome: 'defeat' } as HudSnapshot, save);
      };
      if (!alive) return;
      const reducedEffects = save.settings.reducedEffects;
      const frameQuality = createFrameQuality();
      const decorative = () => !reducedEffects && frameQuality.quality === 'full';
      const initial = runtime.snapshot(frameBuffers.current[0]!);
      frameSlot.current = 1;
      publish(initial, decorative());
      setHud(copyHud(initial.hud));
      setKnownEvolutions(save.discovery.evolutions);
      setSaveNote('');

      let acc = 0;
      let last = Date.now();
      const stamp: WatchStamp = {
        tick: -1,
        paused: false,
        awaitingChoice: false,
        outcome: '',
        level: 0,
        rerolls: 0,
        choiceId: '',
      };
      interval = setInterval(() => {
        const now = Date.now();
        const frameMs = now - last;
        if (!reducedEffects) stepFrameQuality(frameQuality, frameMs);
        acc += Math.min(100, frameMs);
        last = now;
        let steps = 0;
        readWatchStamp(runtime.world, stamp);
        if (!helpGateRef.current) {
        while (acc >= TICK_MS && steps < 4) {
          const edge = edgeRef.current;
          edgeRef.current = null;
          const input = edge ?? (stickRef.current.active ? sampleStick(stickRef.current) : EMPTY_INPUT);
          const events = runtime.step(input);
          const checkpoint = firstCheckpoint(events);
          if (checkpoint) void writeRunCheckpoint(captureRunCheckpoint(runtime, checkpoint));
          acc -= TICK_MS;
          steps += 1;
        }
        }
        if (!alive) return;
        if (!watchChanged(stamp, runtime.world)) return;
        const preview = runtime.snapshot(frameBuffers.current[frameSlot.current]!);
        frameSlot.current = (frameSlot.current + 1) % frameBuffers.current.length;
        publish(preview, decorative());
        const hud = preview.hud;
        const hp = Math.ceil(hud.hp);
        const bossHp = Math.ceil(hud.bossHp);
        const clock = Math.floor(hud.survivalSeconds);
        const paused = hud.paused ? 1 : 0;
        let choices = '';
        if (hud.awaitingLevelChoice) {
          for (const choice of hud.levelChoices) choices += `${choice.contentId},`;
        }
        const weaponsChanged = slotsDiffer(hudStamp.weapons, hud.weaponSlots);
        const passivesChanged = slotsDiffer(hudStamp.passives, hud.passiveSlots);
        if (
          hp !== hudStamp.hp ||
          hud.level !== hudStamp.level ||
          clock !== hudStamp.seconds ||
          paused !== hudStamp.paused ||
          choices !== hudStamp.choices ||
          hud.rerollsRemaining !== hudStamp.rerolls ||
          hud.runOutcome !== hudStamp.outcome ||
          (hud.bossId ?? '') !== hudStamp.bossId ||
          bossHp !== hudStamp.bossHp ||
          weaponsChanged ||
          passivesChanged
        ) {
          hudStamp.hp = hp;
          hudStamp.level = hud.level;
          hudStamp.seconds = clock;
          hudStamp.paused = paused;
          hudStamp.choices = choices;
          hudStamp.rerolls = hud.rerollsRemaining;
          hudStamp.outcome = hud.runOutcome;
          hudStamp.bossId = hud.bossId ?? '';
          hudStamp.bossHp = bossHp;
          rememberSlots(hudStamp.weapons, hud.weaponSlots);
          rememberSlots(hudStamp.passives, hud.passiveSlots);
          hudKeyRef.current = choices;
          setHud(copyHud(hud));
        }
        if (hud.runOutcome !== 'ongoing') void persist(hud, save);
      }, 1000 / 60);
    }

    void boot();
    const appState = AppState.addEventListener('change', (state) => {
      const runtime = runtimeRef.current;
      if (!runtime || runtime.world.run.outcome !== 'ongoing') return;
      const signal = state === 'active' ? 'active' : state === 'background' ? 'background' : 'inactive';
      if (interruptionResponse(signal) === 'ignore') return;
      stickRef.current = { dx: 0, dy: 0, active: false };
      runtime.world.run.paused = true;
      setHud((prev) => (prev ? { ...prev, paused: true } : prev));
      void AsyncStorage.setItem('run.resume', '1');
      void writeRunCheckpoint(captureRunCheckpoint(runtime, 'background'));
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      const runtime = runtimeRef.current;
      if (!runtime || runtime.world.run.outcome !== 'ongoing') return false;
      stickRef.current = { dx: 0, dy: 0, active: false };
      if (!runtime.world.run.paused) {
        runtime.world.run.paused = true;
        void writeRunCheckpoint(captureRunCheckpoint(runtime, 'quit'));
      }
      return true;
    });
    return () => {
      alive = false;
      appState.remove();
      back.remove();
      if (interval) clearInterval(interval);
      skPath.dispose();
      paint.dispose();
      for (const path of shapePaths.values()) path.dispose();
      retired.forEach((item) => item.dispose());
      runtimeRef.current = null;
    };
  }, [runKey]);

  const choosing = Boolean(hud?.awaitingLevelChoice && (hud.levelChoices?.length ?? 0) > 0);
  const finished = hud != null && hud.runOutcome !== 'ongoing';

  if (profileBlock) {
    return (
      <View style={styles.root}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Profile needs recovery</Text>
          <Text style={styles.cardMeta}>{profileBlock.notice}</Text>
          {profileBlock.backup ? (
            <Pressable
              style={styles.action}
              onPress={() => {
                const backup = profileBlock.backup;
                if (!backup) return;
                void replaceProfile(createAsyncStorageRepository(), backup).then((written) => {
                  if (written.ok) setRunKey((n) => n + 1);
                });
              }}
            >
              <Text style={styles.actionText}>Restore backup</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.action}
            onPress={() => {
              void replaceProfile(
                createAsyncStorageRepository(),
                createDefaultSave(new Date().toISOString(), `local-reset-${Date.now()}`),
              ).then((written) => {
                if (written.ok) setRunKey((n) => n + 1);
              });
            }}
          >
            <Text style={styles.actionText}>Reset profile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (rewardBlocked) {
    return (
      <View style={styles.root}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Could not save the last watch.</Text>
          <Text style={styles.cardMeta}>The marks from that watch are still waiting on this device.</Text>
          <Pressable style={styles.action} onPress={() => setRunKey((n) => n + 1)}>
            <Text style={styles.actionText}>Save again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Canvas style={{ width, height }}>
        <Picture picture={picture} />
      </Canvas>
      <View
        style={[
          styles.hud,
          {
            paddingTop: insets.top + spacing.md,
            paddingLeft: insets.left + spacing.md,
            paddingRight: insets.right + spacing.md,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.hudTop}>
          <View>
            <Text style={styles.hudText}>
              {hud
                ? `HP ${Math.ceil(hud.hp)}/${Math.ceil(hud.maxHp)} · Lv ${hud.level}${isLowHealth(hud.hp, hud.maxHp) ? ' · Wounded' : ''}`
                : copy.loadingCore}
            </Text>
            {hud ? (
              <Text style={styles.hudBuild}>
                {hud.weaponSlots.map((slot) => `${choiceLabel(slot.contentId, 'weapon')} ${slot.level}`).join(' · ') ||
                  'No weapons'}
                {hud.passiveSlots.length
                  ? ` · ${hud.passiveSlots.map((slot) => `${choiceLabel(slot.contentId, 'passive')} ${slot.level}`).join(' · ')}`
                  : ''}
              </Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.hudText}>
              {hud ? `${formatTime(hud.survivalSeconds)}${hud.paused ? ' · Paused' : ''}` : '0:00'}
            </Text>
            <Text style={styles.hudBuild}>
              {hud ? nextWatchObjective(hud.survivalSeconds, Boolean(hud.bossId)) : 'Lieutenant at 4:00'}
            </Text>
          </View>
        </View>

        {choosing && hud ? (
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Choose your path</Text>
            <ScrollView style={styles.cardScroll} contentContainerStyle={styles.cardRow}>
              {hud.levelChoices.map((c, i) => {
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
                  <Pressable
                    key={`${c.contentId}-${i}`}
                    style={styles.card}
                    onPress={() => queue(inputForLevelChoice(i as 0 | 1 | 2))}
                  >
                    <Text style={styles.cardKind}>
                      {explained.mark} · {explained.badge}
                      {c.currentLevel === 0 ? '' : ` · Lv ${c.currentLevel} → ${c.nextLevel}`}
                    </Text>
                    <Text style={styles.cardName}>{explained.title}</Text>
                    <Text style={styles.cardDetail}>{explained.behavior}</Text>
                    {explained.stats.map((line) => (
                      <Text key={line} style={styles.cardDetail}>
                        {line}
                      </Text>
                    ))}
                    <Text style={styles.cardDetail}>{explained.slot}</Text>
                    <Text style={styles.cardDetail}>{explained.evolution}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {hud.rerollsRemaining > 0 ? (
              <Pressable style={styles.action} onPress={() => queue(inputForReroll())}>
                <Text style={styles.actionText}>Reroll ({hud.rerollsRemaining})</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {showHelp && !finished ? (
          <View style={styles.modal}>
            <Text style={styles.cardKind}>
              How to play · {helpStep + 1} / {tutorialSteps.length}
            </Text>
            <Text style={styles.modalTitle}>{tutorialSteps[helpStep]?.title}</Text>
            <Text style={styles.cardMeta}>{tutorialSteps[helpStep]?.body}</Text>
            {helpStep < tutorialSteps.length - 1 ? (
              <Pressable style={styles.action} onPress={() => setHelpStep((current) => current + 1)}>
                <Text style={styles.actionText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.action} onPress={closeHelp}>
                <Text style={styles.actionText}>Start Run</Text>
              </Pressable>
            )}
            {helpStep < tutorialSteps.length - 1 ? (
              <Pressable style={styles.action} onPress={closeHelp}>
                <Text style={styles.actionText}>Skip</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {hud?.paused && !choosing && !finished && !showHelp ? (
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Paused</Text>
            <Text style={styles.cardMeta}>
              Lv {hud.level} · {hud.kills} fallen · {formatTime(hud.survivalSeconds)}
            </Text>
            <Pressable style={styles.action} onPress={() => queue(inputForPauseToggle())}>
              <Text style={styles.actionText}>Resume</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => setShowHelp(true)}>
              <Text style={styles.actionText}>How to play</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => setShowCredits(true)}>
              <Text style={styles.actionText}>Credits</Text>
            </Pressable>
            {showCredits ? (
              <ScrollView style={{ maxHeight: 220 }}>
                {creditSections.map((section) => (
                  <Text key={section.title} style={styles.cardMeta}>
                    {section.title}. {section.lines.join(' ')}
                  </Text>
                ))}
                <Pressable style={styles.action} onPress={() => setShowCredits(false)}>
                  <Text style={styles.actionText}>Back to pause</Text>
                </Pressable>
              </ScrollView>
            ) : null}
            <Pressable
              style={styles.action}
              onPress={() => {
                void clearRunCheckpoint().then(() => setRunKey((n) => n + 1));
              }}
            >
              <Text style={styles.actionText}>New watch</Text>
            </Pressable>
          </View>
        ) : null}

        {finished && hud ? (
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {outcomeSummary?.title ?? (hud.runOutcome === 'victory' ? copy.runVictory : copy.runDefeat)}
            </Text>
            {outcomeSummary ? <Text style={styles.cardMeta}>{outcomeSummary.flavor}</Text> : null}
            <Text style={styles.cardMeta}>
              {formatTime(hud.survivalSeconds)} · Level {hud.level} · {hud.kills} fallen
            </Text>
            {outcomeSummary ? (
              <Text style={styles.cardDetail}>
                {`${outcomeSummary.totalMarks} guardian marks. ${outcomeSummary.markLines.join(' ')} ${outcomeSummary.build.length ? `Build: ${outcomeSummary.build.join(', ')}. ` : ''}${outcomeSummary.recordLine} ${outcomeSummary.unlocks.length ? `Unlocked: ${outcomeSummary.unlocks.join(', ')}. ` : 'No new unlocks. '}${outcomeSummary.damageLine}`}
              </Text>
            ) : null}
            {saveNote ? <Text style={styles.cardMeta}>{saveNote}</Text> : null}
            {saveNote === 'Could not save this run.' ? (
              <Pressable
                style={styles.action}
                onPress={() => retrySaveRef.current()}
              >
                <Text style={styles.actionText}>Save again</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.action}
              onPress={() => {
                void clearRunCheckpoint().then(() => setRunKey((n) => n + 1));
              }}
            >
              <Text style={styles.actionText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!choosing && !finished ? (
          <View style={[styles.stickWrap, { left: insets.left + spacing.lg, bottom: insets.bottom + spacing.lg }]}>
            <VirtualStick onChange={onStick} />
          </View>
        ) : null}
        {!choosing ? (
          <View style={[styles.bottomRight, { right: insets.right + spacing.lg, bottom: insets.bottom + spacing.lg }]}>
            {!finished && !hud?.paused ? (
              <Pressable style={styles.menuBtn} onPress={() => queue(inputForPauseToggle())}>
                <Text style={styles.menuText}>Pause</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night950 },
  hud: { ...StyleSheet.absoluteFillObject, padding: spacing.md },
  hudTop: { flexDirection: 'row', justifyContent: 'space-between' },
  hudText: { color: colors.sand200, fontVariant: ['tabular-nums'] },
  hudBuild: { color: colors.monsoon400, fontSize: 12, marginTop: 2, maxWidth: 220 },
  modal: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: 48,
    bottom: 24,
    borderWidth: 1,
    borderColor: colors.brass500,
    backgroundColor: 'rgba(11, 12, 20, 0.92)',
    padding: spacing.md,
    justifyContent: 'center',
  },
  modalTitle: {
    color: colors.sand200,
    fontSize: 22,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardScroll: { flexGrow: 0, maxHeight: '70%' },
  cardRow: { gap: spacing.sm, paddingVertical: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.indigo600,
    backgroundColor: colors.night800,
    padding: spacing.sm,
  },
  cardKind: { color: colors.brass500, textTransform: 'uppercase', fontSize: 12 },
  cardName: { color: colors.sand200, fontSize: 16, marginTop: 4 },
  cardDetail: { color: colors.sand200, marginTop: 4, fontSize: 13, lineHeight: 18 },
  cardMeta: { color: colors.ash400, marginTop: 4, textAlign: 'center' },
  action: {
    minHeight: 44,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brass500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  actionText: { color: colors.brass500, textTransform: 'uppercase' },
  stickWrap: { position: 'absolute', left: spacing.lg, bottom: spacing.lg },
  bottomRight: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, gap: spacing.sm },
  menuBtn: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.indigo600,
    backgroundColor: colors.night800,
  },
  menuText: { color: colors.sand200, textTransform: 'uppercase' },
});
