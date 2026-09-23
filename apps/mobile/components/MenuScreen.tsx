import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createDefaultSave, replaceProfile, type ProfileLoad, type SaveFileV1 } from '@rakshak/storage';
import { colors, copy, spacing } from '@rakshak/game-ui';
import { createAsyncStorageRepository } from '../lib/asyncStoragePort';

export function MenuScreen({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
      <Link href="/" asChild>
        <Pressable style={styles.back}>
          <Text style={styles.backText}>{copy.back}</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

export function MobileRecovery({
  load,
  onResolved,
}: {
  load: Extract<ProfileLoad, { status: 'blocked' }>;
  onResolved: (save: SaveFileV1) => void;
}) {
  async function write(next: SaveFileV1) {
    const written = await replaceProfile(createAsyncStorageRepository(), next);
    if (written.ok) onResolved(written.save);
  }
  return (
    <MenuScreen title="Profile needs recovery" hint={load.notice}>
      {load.backup ? (
        <Pressable style={styles.action} onPress={() => void write(load.backup as SaveFileV1)}>
          <Text style={styles.actionText}>Restore backup</Text>
        </Pressable>
      ) : null}
      <Pressable
        style={styles.action}
        onPress={() => void write(createDefaultSave(new Date().toISOString(), `local-reset-${Date.now()}`))}
      >
        <Text style={styles.actionText}>Reset profile</Text>
      </Pressable>
    </MenuScreen>
  );
}

export const menuStyles = StyleSheet.create({
  row: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.indigo600,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: { color: colors.sand200, fontSize: 16, flex: 1 },
  meta: { color: colors.ash400, marginTop: 4, fontSize: 13 },
  status: { color: colors.brass500, textTransform: 'uppercase', fontSize: 12 },
  action: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.brass500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  actionText: { color: colors.brass500, textTransform: 'uppercase' },
  message: { color: colors.sand200, marginTop: spacing.sm },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night950 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: {
    color: colors.sand200,
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hint: { marginTop: spacing.md, color: colors.ash400, fontSize: 16, lineHeight: 24 },
  back: { marginTop: spacing.lg, minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.brass500, textTransform: 'uppercase' },
  action: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.brass500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: colors.brass500, textTransform: 'uppercase' },
});

export function Row({ title, detail, status }: { title: string; detail?: string; status: string }) {
  return (
    <View style={menuStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={menuStyles.name}>{title}</Text>
        {detail ? <Text style={menuStyles.meta}>{detail}</Text> : null}
      </View>
      <Text style={menuStyles.status}>{status}</Text>
    </View>
  );
}
