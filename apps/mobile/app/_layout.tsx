import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@rakshak/game-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
      <StatusBar style="light" hidden />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.night950 },
          headerTintColor: colors.sand200,
          contentStyle: { backgroundColor: colors.night950 },
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'RAKSHAK', headerShown: false }} />
        <Stack.Screen name="play" options={{ title: 'Play', headerShown: false }} />
        <Stack.Screen name="upgrades" options={{ title: 'Upgrades' }} />
        <Stack.Screen name="characters" options={{ title: 'Characters' }} />
        <Stack.Screen name="collection" options={{ title: 'Collection' }} />
        <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="credits" options={{ title: 'Credits' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night950 },
});
