import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ScannerOverlay } from '../../components/ScannerOverlay';
import { zebraScannerService } from '../../services/ZebraScannerService';
import apiClient from '../../services/apiClient';
import { colors } from '../../theme/colors';

interface Session {
  TaiSanKiemKe_id: number;
  MaKiemKe: string;
  NgayLapPhieu: string;
}

interface InventoryItem {
  MaTaiSan: string;
  SoThe: string;
  TenThietBi: string;
  SoLuongTon: number;
  SoLuongKiemKe: number;
  DaKiem: boolean;
}

interface ScannedTag {
  id: string;
  epc: string;
  timestamp: string;
}

export default function InventoryScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Data fetching state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory/sessions');
      if (res.data.success) {
        setSessions(res.data.data);
        if (res.data.data.length > 0) {
          handleSelectSession(res.data.data[0]);
        }
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lấy danh sách đợt kiểm kê');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(false);
    setLoading(true);
    setScannedTags([]); // Reset scanned tags on new session
    try {
      const res = await apiClient.get(`/inventory?sessionId=${session.TaiSanKiemKe_id}`);
      if (res.data.success) {
        setInventoryList(res.data.data);
        // Bơm danh sách thẻ hợp lệ vào súng giả lập để test
        const validEpcs = res.data.data.map((item: any) => item.SoThe).filter(Boolean);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu kiểm kê cho đợt này');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = zebraScannerService.addListener((event) => {
      if (event.epc) {
        setScannedTags(prev => {
          // Tránh duplicate
          if (prev.find(t => t.epc === event.epc)) return prev;
          const newTag: ScannedTag = {
            id: Date.now().toString() + Math.random(),
            epc: event.epc!,
            timestamp: new Date(event.timestamp).toLocaleTimeString(),
          };
          return [newTag, ...prev];
        });
      }
    });

    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        ])
      ).start();
      zebraScannerService.startScan();
    } else {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(0);
      zebraScannerService.stopScan();
    }

    return () => {
      unsubscribe();
      zebraScannerService.stopScan();
    };
  }, [isScanning]);

  const toggleScan = () => {
    if (!selectedSession) {
      Alert.alert('Lỗi', 'Vui lòng chọn đợt kiểm kê trước khi quét');
      return;
    }
    setIsScanning(!isScanning);
  };

  const syncData = async () => {
    if (isScanning) {
      Alert.alert('Thông báo', 'Vui lòng dừng quét trước khi đồng bộ!');
      return;
    }
    if (scannedTags.length === 0) {
      Alert.alert('Thông báo', 'Chưa có thẻ nào được quét!');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/inventory', { 
        sessionId: selectedSession?.TaiSanKiemKe_id,
        tags: scannedTags 
      });
      
      if (response.data.success) {
        Alert.alert('Thành công', response.data.message, [
          { text: 'OK', onPress: () => handleSelectSession(selectedSession!) }
        ]);
      } else {
        Alert.alert('Lỗi', 'Đồng bộ thất bại: ' + response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến Máy chủ API.');
    } finally {
      setLoading(false);
    }
  };

  // Tính toán trạng thái các thẻ
  const listData = useMemo(() => {
    const scannedEpcs = new Set(scannedTags.map(t => t.epc));
    
    // Ghép dữ liệu DB với dữ liệu mới quét
    const combined = inventoryList.map(item => {
      const isScannedNow = scannedEpcs.has(item.SoThe);
      return {
        ...item,
        isMatched: isScannedNow,
        status: isScannedNow ? 'vừa_quét' : (item.DaKiem ? 'đã_kiểm_trước' : 'chưa_kiểm')
      };
    });

    // Tìm các thẻ lạ (quét được nhưng không có trong DB)
    const dbEpcs = new Set(inventoryList.map(item => item.SoThe));
    const unknownTags = scannedTags.filter(t => !dbEpcs.has(t.epc)).map(t => ({
      SoThe: t.epc,
      TenThietBi: 'Thẻ lạ không có trong hệ thống',
      status: 'thẻ_lạ',
      timestamp: t.timestamp
    }));

    return [...combined, ...unknownTags];
  }, [inventoryList, scannedTags]);

  const stats = {
    total: inventoryList.length,
    scannedValid: listData.filter(i => i.status === 'vừa_quét' || i.status === 'đã_kiểm_trước').length,
    unknown: listData.filter(i => i.status === 'thẻ_lạ').length,
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.tagItem}>
      <View style={styles.tagInfo}>
        <Text style={styles.tagEpc} numberOfLines={1}>{item.SoThe || item.MaTaiSan}</Text>
        <Text style={styles.tagTime}>{item.TenThietBi}</Text>
      </View>
      <View style={[
        styles.statusBadge, 
        item.status === 'vừa_quét' ? styles.badgeSuccess : 
        item.status === 'đã_kiểm_trước' ? styles.badgeInfo :
        item.status === 'thẻ_lạ' ? styles.badgeUnknown : styles.badgePending
      ]}>
        <Text style={styles.badgeText}>
          {item.status === 'vừa_quét' ? 'Hợp lệ' : 
           item.status === 'đã_kiểm_trước' ? 'Đã kiểm' :
           item.status === 'thẻ_lạ' ? 'Thẻ lạ' : 'Chưa quét'}
        </Text>
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

      <TouchableOpacity style={styles.infoCard} onPress={() => setShowSessionModal(true)}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>
            {selectedSession ? `Đợt: ${selectedSession.MaKiemKe}` : 'Chọn đợt kiểm kê...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.primary} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Cần kiểm</Text>
            <Text style={styles.statValueBlue}>{stats.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Đã quét</Text>
            <Text style={styles.statValueGreen}>{stats.scannedValid}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Thẻ lạ</Text>
            <Text style={styles.statValueRed}>{stats.unknown}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => `${item.SoThe || 'unknown'}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.border} />
              <Text style={styles.emptyText}>Chưa có tài sản trong đợt này</Text>
            </View>
          }
        />
      )}

      {/* Modal chọn đợt kiểm kê */}
      <Modal visible={showSessionModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn kỳ kiểm kê</Text>
            <FlatList
              data={sessions}
              keyExtractor={item => item.TaiSanKiemKe_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.sessionItem} onPress={() => handleSelectSession(item)}>
                  <Text style={styles.sessionCode}>{item.MaKiemKe}</Text>
                  <Text style={styles.sessionDate}>{new Date(item.NgayLapPhieu).toLocaleDateString()}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowSessionModal(false)}>
              <Text style={styles.closeModalText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScannerOverlay 
        isScanning={isScanning} 
        scannedCount={scannedTags.length} 
        onToggleScan={toggleScan} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  syncBtn: { marginRight: 16 },
  infoCard: { backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  statValueBlue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  statValueGreen: { fontSize: 20, fontWeight: 'bold', color: colors.success },
  statValueRed: { fontSize: 20, fontWeight: 'bold', color: colors.danger },
  listContainer: { padding: 16, paddingBottom: 100 },
  tagItem: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagInfo: { flex: 1, paddingRight: 8 },
  tagEpc: { fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold', color: colors.text },
  tagTime: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeSuccess: { backgroundColor: colors.success + '20' },
  badgeInfo: { backgroundColor: colors.primary + '20' },
  badgePending: { backgroundColor: colors.border },
  badgeUnknown: { backgroundColor: colors.danger + '20' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: colors.text },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 16, color: colors.textSecondary, fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  sessionItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  sessionCode: { fontSize: 16, fontWeight: 'bold' },
  sessionDate: { fontSize: 14, color: colors.textSecondary },
  closeModalBtn: { marginTop: 16, padding: 16, backgroundColor: colors.border, borderRadius: 8, alignItems: 'center' },
  closeModalText: { fontSize: 16, fontWeight: 'bold' },
});
