import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ScannerOverlay } from '../../components/ScannerOverlay';
import { colors } from '../../theme/colors';

interface ScannedTag {
  id: string;
  epc: string;
  timestamp: string;
  status: 'matched' | 'unknown';
}

export default function InventoryScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Giả lập chức năng Quét liên tục (Loop) khi bóp cò
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      // Hiệu ứng chớp nháy (sóng RFID)
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        ])
      ).start();

      // Sinh mã EPC ngẫu nhiên mỗi 300ms
      interval = setInterval(() => {
        const randomId = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
        const newTag: ScannedTag = {
          id: Date.now().toString(),
          epc: `E2801170000000000000${randomId}`,
          timestamp: new Date().toLocaleTimeString(),
          status: Math.random() > 0.2 ? 'matched' : 'unknown',
        };
        setScannedTags(prev => [newTag, ...prev]);
      }, 300);
    } else {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(0);
    }

    return () => clearInterval(interval);
  }, [isScanning]);

  const toggleScan = () => {
    setIsScanning(!isScanning);
  };

  const syncData = () => {
    if (isScanning) {
      Alert.alert('Thông báo', 'Vui lòng dừng quét trước khi đồng bộ!');
      return;
    }
    if (scannedTags.length === 0) {
      Alert.alert('Thông báo', 'Chưa có dữ liệu để đồng bộ!');
      return;
    }
    Alert.alert('Thành công', `Đã đồng bộ ${scannedTags.length} thẻ về hệ thống Web!`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const renderItem = ({ item }: { item: ScannedTag }) => (
    <View style={styles.tagItem}>
      <View style={styles.tagInfo}>
        <Text style={styles.tagEpc}>{item.epc}</Text>
        <Text style={styles.tagTime}>{item.timestamp}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'matched' ? styles.badgeSuccess : styles.badgeUnknown]}>
        <Text style={styles.badgeText}>{item.status === 'matched' ? 'Hợp lệ' : 'Thẻ lạ'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Kiểm Kê Kho',
          headerRight: () => (
            <TouchableOpacity onPress={syncData} style={styles.syncBtn}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.surface} />
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>Kỳ kiểm kê: Đợt 1 - Kho Bà Rịa</Text>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Ionicons name="radio-outline" size={24} color={colors.danger} />
          </Animated.View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tổng đã quét</Text>
            <Text style={styles.statValueBlue}>{scannedTags.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hợp lệ</Text>
            <Text style={styles.statValueGreen}>
              {scannedTags.filter(t => t.status === 'matched').length}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Thẻ lạ</Text>
            <Text style={styles.statValueRed}>
              {scannedTags.filter(t => t.status === 'unknown').length}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={scannedTags}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="scan-circle-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>Chưa có dữ liệu quét</Text>
          </View>
        }
      />

      <ScannerOverlay 
        isScanning={isScanning} 
        scannedCount={scannedTags.length} 
        onToggleScan={toggleScan} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  syncBtn: {
    marginRight: 16,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValueBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statValueGreen: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
  },
  statValueRed: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.danger,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  tagItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagInfo: {
    flex: 1,
  },
  tagEpc: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: colors.text,
  },
  tagTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: colors.success + '20',
  },
  badgeUnknown: {
    backgroundColor: colors.danger + '20',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  }
});
