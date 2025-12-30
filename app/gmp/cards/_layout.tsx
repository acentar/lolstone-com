import { Stack } from 'expo-router';
import { adminColors } from '../../../src/constants/adminTheme';

export default function CardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: adminColors.background },
      }}
    />
  );
}

