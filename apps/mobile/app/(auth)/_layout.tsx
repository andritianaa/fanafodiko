import { Stack, Redirect } from 'expo-router';
import { useStore } from '../../src/store/useStore';

export default function AuthLayout() {
  const token = useStore((s) => s.token);
  if (token) return <Redirect href="/(app)" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="cgu" />
    </Stack>
  );
}
