import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Tạm thời luôn chuyển qua trang Đăng nhập
    const timer = setTimeout(() => {
      router.replace('/(auth)');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
