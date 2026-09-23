import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCheckpointTime, type RunCheckpointV1 } from '@rakshak/game-core';
import { copy, menuRoutes, colors, spacing } from '@rakshak/game-ui';
import { GAME_VERSION } from '@rakshak/shared';
import { readRunCheckpoint, clearRunCheckpoint } from '../lib/runCheckpoint';

export default function HomeScreen() {
  const [checkpoint, setCheckpoint] = useState<RunCheckpointV1 | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sideBySide = height < 480;
  const linkStyle = [styles.link, sideBySide ? styles.linkHalf : null];
  useEffect(() => {
    void readRunCheckpoint().then(setCheckpoint);
  }, []);
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        sideBySide ? styles.contentRow : null,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          paddingLeft: insets.left + spacing.lg,
          paddingRight: insets.right + spacing.lg,
        },
      ]}
    >
      <View style={sideBySide ? styles.intro : undefined}>
      <Text style={[styles.brand, sideBySide ? styles.brandCompact : null]}>{copy.brand}</Text>
      <Text style={styles.tagline}>{copy.tagline}</Text>
      <View style={styles.footer}>
        <Text style={styles.footerText}>v{GAME_VERSION}</Text>
        <Link href="/privacy" style={styles.footerLink}>
          {copy.privacy}
        </Link>
      </View>
      </View>
      <View style={[styles.nav, sideBySide ? styles.navWrap : null]}>
        {checkpoint ? (
          <Link href="/play" asChild>
            <Pressable
              style={[linkStyle, styles.primary]}
              onPress={() => {
                void AsyncStorage.setItem('run.resume', '1');
              }}
            >
              <Text style={[styles.linkText, styles.primaryText]}>
                Continue {checkpoint.mapId} · {formatCheckpointTime(checkpoint.tick)}
              </Text>
            </Pressable>
          </Link>
        ) : null}
        {menuRoutes.map((item) => {
          if (item.href === '/play' && checkpoint) {
            return (
              <Pressable key={item.href} style={linkStyle} onPress={() => setConfirmNew(true)}>
                <Text style={styles.linkText}>New watch</Text>
              </Pressable>
            );
          }
          return (
          <Link key={item.href} href={item.href as `/play`} asChild>
            <Pressable
              style={[linkStyle, 'primary' in item && item.primary ? styles.primary : null]}
              onPress={() => {
                if (item.href === '/play') void AsyncStorage.setItem('run.fresh', '1');
              }}
            >
              <Text
                style={[
                  styles.linkText,
                  'primary' in item && item.primary ? styles.primaryText : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          </Link>
          );
        })}
        {confirmNew && checkpoint ? (
          <Pressable
            style={linkStyle}
            onPress={() => {
              void clearRunCheckpoint().then(async () => {
                await AsyncStorage.setItem('run.fresh', '1');
                await AsyncStorage.removeItem('run.resume');
                setCheckpoint(null);
                setConfirmNew(false);
                router.push('/play');
              });
            }}
          >
            <Text style={styles.linkText}>
              Discard {checkpoint.mapId} at {formatCheckpointTime(checkpoint.tick)}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night950,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  intro: { width: 220, flexShrink: 0 },
  brand: {
    fontSize: 48,
    letterSpacing: 2,
    color: colors.sand200,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  brandCompact: { fontSize: 32 },
  tagline: {
    marginTop: spacing.sm,
    color: colors.ash400,
    fontSize: 16,
  },
  nav: {
    marginTop: spacing.xl,
    maxWidth: 280,
    gap: spacing.sm,
  },
  navWrap: {
    marginTop: 0,
    maxWidth: 420,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  link: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.indigo600,
    backgroundColor: colors.night800,
  },
  linkHalf: { width: '47%' },
  primary: {
    borderColor: colors.brass500,
  },
  linkText: {
    color: colors.sand200,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.brass500,
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerText: {
    color: colors.ash400,
    fontVariant: ['tabular-nums'],
  },
  footerLink: {
    color: colors.brass500,
  },
});
