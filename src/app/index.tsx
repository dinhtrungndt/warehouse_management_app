import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Logic kiểm tra xem user đã đăng nhập chưa
  // Tạm thời luôn redirect qua trang Đăng nhập
  return <Redirect href="/(auth)" />;
}
