import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';

export default function Index() {
  const token = useStore((s) => s.token);
  return token ? <Redirect href="/(app)" /> : <Redirect href="/(auth)/login" />;
}
