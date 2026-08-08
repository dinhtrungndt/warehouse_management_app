import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ScannerOverlay } from '../../components/ScannerOverlay';
import { zebraScannerService } from '../../services/ZebraScannerService';
import apiClient from '../../services/apiClient';
import { colors } from '../../theme/colors';

interface Session {
  TS_ChungTuNhap_id: number;
  MaChungTuNhap: string;
  NgayChungTu: string;
}

interface ImportItem {
  TS_ChungTuChiTiet_id: number;
  TaiSan_id: number;
  MaTaiSan: string;
  TenThietBi: string;
  SoLuong: number;
  SoThe: string | null;
  DaXacNhan: boolean;
  assignedEpc?: string; // EPC mới được gán ở local
}

interface ScannedTag {
  id: string;
  epc: string;
  timestamp: string;
}

export default function ImportScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [importList, setImportList] = useState<ImportItem[]>([]);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // State cho việc gán thẻ
  const [tagToAssign, setTagToAssign] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/import/sessions');
      if (res.data.success) {
        setSessions(res.data.data);
        if (res.data.data.length > 0) {
          handleSelectSession(res.data.data[0]);
        }
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lấy danh sách phiếu nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(false);
    setLoading(true);
    setScannedTags([]);
    try {
      const res = await apiClient.get(`/import?sessionId=${session.TS_ChungTuNhap_id}`);
      if (res.data.success) {
        setImportList(res.data.data);
        const validEpcs = res.data.data.map((item: any) => item.SoThe).filter(Boolean);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu chi tiết phiếu nhập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = zebraScannerService.addListener((event) => {
      if (event.epc) {
        setScannedTags(prev => {
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
      Alert.alert('Lỗi', 'Vui lòng chọn phiếu nhập trước khi quét');
      return;
    }
    setIsScanning(!isScanning);
  };

  const assignTagToAsset = (item: ImportItem) => {
    if (!tagToAssign) return;
    setImportList(prev => prev.map(i => 
      i.TS_ChungTuChiTiet_id === item.TS_ChungTuChiTiet_id 
        ? { ...i, assignedEpc: tagToAssign }
        : i
    ));
    setTagToAssign(null);
    setShowAssignModal(false);
  };

  const syncData = async () => {
    if (isScanning) {
      Alert.alert('Thông báo', 'Vui lòng dừng quét trước khi đồng bộ!');
      return;
    }
    
    // Lọc ra các thẻ đã quét và trùng khớp với db
    const scannedEpcs = new Set(scannedTags.map(t => t.epc));
    const matchedTags = importList.filter(i => i.SoThe && scannedEpcs.has(i.SoThe)).map(i => ({ epc: i.SoThe }));
    
    // Lọc ra các thẻ được gán mới (chưa có trong DB, được người dùng bấm gán thẻ)
    const newAssignments = importList
      .filter(i => i.assignedEpc)
      .map(i => ({
        tsChungTuChiTietId: i.TS_ChungTuChiTiet_id,
        taiSanId: i.TaiSan_id,
        epc: i.assignedEpc
      }));

    if (matchedTags.length === 0 && newAssignments.length === 0) {
      Alert.alert('Thông báo', 'Chưa có thẻ hợp lệ hoặc thẻ được gán mới để đồng bộ!');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/import', { 
        sessionId: selectedSession?.TS_ChungTuNhap_id,
        tags: matchedTags,
        newAssignments: newAssignments
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

  const listData = useMemo(() => {
    const scannedEpcs = new Set(scannedTags.map(t => t.epc));
    const assignedEpcs = new Set(importList.filter(i => i.assignedEpc).map(i => i.assignedEpc));
    const dbEpcs = new Set(importList.filter(i => i.SoThe).map(i => i.SoThe));
    
    const combined = importList.map(item => {
      const isScanned = item.SoThe && scannedEpcs.has(item.SoThe);
      const isAssigned = !!item.assignedEpc;
      
      let status = 'chưa_quét';
      if (isAssigned) status = 'đã_gán_mới';
      else if (isScanned) status = 'hợp_lệ';
      else if (item.DaXacNhan) status = 'đã_xác_nhận';
      else if (!item.SoThe) status = 'chưa_có_thẻ';

      return {
        ...item,
        isMatched: isScanned || isAssigned,
        status
      };
    });

    const unknownTags = scannedTags.filter(t => !dbEpcs.has(t.epc) && !assignedEpcs.has(t.epc)).map(t => ({
      SoThe: t.epc,
      TenThietBi: 'Thẻ lạ / Thẻ mới',
      status: 'thẻ_lạ',
      timestamp: t.timestamp
    }));

    return [...combined, ...unknownTags];
  }, [importList, scannedTags]);

  const stats = {
    total: importList.length,
    scannedValid: listData.filter(i => i.status === 'hợp_lệ' || i.status === 'đã_xác_nhận' || i.status === 'đã_gán_mới').length,
    unknown: listData.filter(i => i.status === 'thẻ_lạ').length,
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.tagItem}>
      <View style={styles.tagInfo}>
        <Text style={styles.tagEpc} numberOfLines={1}>{item.SoThe || item.assignedEpc || item.MaTaiSan}</Text>
        <Text style={styles.tagTime}>{item.TenThietBi}</Text>
      </View>
      <View style={styles.actionContainer}>
        {item.status === 'thẻ_lạ' && (
          <TouchableOpacity 
            style={styles.assignBtn}
            onPress={() => {
              setTagToAssign(item.SoThe);
              setShowAssignModal(true);
            }}
          >
            <Text style={styles.assignBtnText}>Gán thẻ</Text>
          </TouchableOpacity>
        )}
        <View style={[
          styles.statusBadge, 
          item.status === 'hợp_lệ' || item.status === 'đã_gán_mới' ? styles.badgeSuccess : 
          item.status === 'đã_xác_nhận' ? styles.badgeInfo :
          item.status === 'chưa_có_thẻ' ? styles.badgeWarning :
          item.status === 'thẻ_lạ' ? styles.badgeUnknown : styles.badgePending
        ]}>
          <Text style={styles.badgeText}>
            {item.status === 'hợp_lệ' ? 'Hợp lệ' : 
             item.status === 'đã_gán_mới' ? 'Đã gán' :
             item.status === 'đã_xác_nhận' ? 'Đã duyệt' :
             item.status === 'chưa_có_thẻ' ? 'Thiếu thẻ' :
             item.status === 'thẻ_lạ' ? 'Thẻ lạ' : 'Chưa quét'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Nhập Kho',
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
            {selectedSession ? `Phiếu: ${selectedSession.MaChungTuNhap}` : 'Chọn phiếu nhập...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.primary} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Cần nhập</Text>
            <Text style={styles.statValueBlue}>{stats.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Đã quét/gán</Text>
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
          keyExtractor={(item, index) => `${item.SoThe || item.assignedEpc || 'unknown'}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.border} />
              <Text style={styles.emptyText}>Chưa có tài sản trong phiếu này</Text>
            </View>
          }
        />
      )}

      {/* Modal chọn Phiếu Nhập */}
      <Modal visible={showSessionModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn Phiếu Nhập Kho</Text>
            <FlatList
              data={sessions}
              keyExtractor={item => item.TS_ChungTuNhap_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.sessionItem} onPress={() => handleSelectSession(item)}>
                  <Text style={styles.sessionCode}>{item.MaChungTuNhap}</Text>
                  <Text style={styles.sessionDate}>{new Date(item.NgayChungTu).toLocaleDateString()}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowSessionModal(false)}>
              <Text style={styles.closeModalText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Gán Thẻ */}
      <Modal visible={showAssignModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <Text style={styles.modalTitle}>Gán thẻ mới: {tagToAssign}</Text>
            <Text style={{ marginBottom: 12, color: colors.textSecondary }}>Chọn tài sản chưa có thẻ để gán:</Text>
            <FlatList
              data={importList.filter(i => !i.SoThe && !i.assignedEpc)}
              keyExtractor={item => item.TS_ChungTuChiTiet_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.sessionItem} onPress={() => assignTagToAsset(item)}>
                  <Text style={styles.sessionCode}>{item.TenThietBi}</Text>
                  <Text style={styles.sessionDate}>Mã TS: {item.MaTaiSan}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>Không còn tài sản nào thiếu thẻ!</Text>}
            />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowAssignModal(false)}>
              <Text style={styles.closeModalText}>Hủy bỏ</Text>
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
  actionContainer: { flexDirection: 'row', alignItems: 'center' },
  assignBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginRight: 8 },
  assignBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeSuccess: { backgroundColor: colors.success + '20' },
  badgeInfo: { backgroundColor: colors.primary + '20' },
  badgePending: { backgroundColor: colors.border },
  badgeUnknown: { backgroundColor: colors.danger + '20' },
  badgeWarning: { backgroundColor: '#FFA50020' },
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
