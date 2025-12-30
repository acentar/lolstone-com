// Import polyfills first
import '../src/polyfills';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../src/context/AuthContext';
// import { WalletContextProvider } from '../src/context/WalletContext';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <PaperProvider>
      {/* <WalletContextProvider> */}
        <AuthProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            />
          </View>
        </AuthProvider>
      {/* </WalletContextProvider> */}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

