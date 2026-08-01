import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const modules = [
  { id: 'import', title: 'Nhập Kho', icon: 'log-in-outline', color: '#1890ff', route: '/(main)/import' },
  { id: 'export', title: 'Xuất Kho', icon: 'log-out-outline', color: '#f5222d', route: '/(main)/export' },
  { id: 'transfer', title: 'Điều Chuyển', icon: 'swap-horizontal-outline', color: '#faad14', route: '/(main)/transfer' },
  { id: 'rfid', title: 'Gán Tag', icon: 'pricetag-outline', color: '#722ed1', route: '/(main)/rfid' },
  { id: 'inventory', title: 'Kiểm Kê', icon: 'checkmark-done-outline', color: '#52c41a', route: '/(main)/inventory' },
  { id: 'search', title: 'Tìm Kiếm', icon: 'search-outline', color: '#13c2c2', route: '/(main)/search' },
];

export default function MainDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/(auth)');
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.username}>Thủ kho Bà Rịa</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out" size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Chức năng Nghiệp vụ</Text>
        
        <View style={styles.gridContainer}>
          {modules.map((mod) => (
            <TouchableOpacity 
              key={mod.id} 
              style={styles.gridItem}
              onPress={() => navigateTo(mod.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, { backgroundColor: mod.color + '20' }]}>
                <Ionicons name={mod.icon as any} size={40} color={mod.color} />
              </View>
              <Text style={styles.itemTitle}>{mod.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="hardware-chip-outline" size={24} color={colors.primary} />
            <Text style={styles.statusTitle}>Trạng thái Thiết bị</Text>
          </View>
          <View style={styles.statusBody}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Zebra RFD40:</Text>
              <Text style={styles.statusValueSuccess}>Đã kết nối</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Pin súng quét:</Text>
              <Text style={styles.statusValue}>85%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: colors.danger + '10',
    borderRadius: 8,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  statusBody: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusValueSuccess: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  }
});
