import { Text, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@rakshak/game-ui';

export function InfoScreen({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.night950,
  },
  title: {
    color: colors.sand200,
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    marginTop: spacing.md,
    color: colors.sand200,
    fontSize: 16,
    lineHeight: 24,
  },
});
