import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ScannerOverlay } from '../../components/ScannerOverlay';
import { colors } from '../../theme/colors';

export default function TransferScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  const slipInfo = {
    code: 'PDC230012',
    date: '01/08/2026',
    from: 'Kho Bà Rịa',
    to: 'Phòng TCKT',
    totalRequired: 8,
  };

  const toggleScan = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      setTimeout(() => {
        setScannedCount(prev => Math.min(prev + 2, slipInfo.totalRequired));
      }, 800);
    }
  };

  const handleSave = () => {
    Alert.alert('Thành công', 'Đã xác nhận Điều Chuyển!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Điều Chuyển',
          headerStyle: { backgroundColor: colors.warning },
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={{ marginRight: 16 }}>
              <Ionicons name="save-outline" size={24} color={colors.surface} />
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="swap-horizontal-outline" size={24} color={colors.warning} />
          <Text style={[styles.cardTitle, { color: colors.warning }]}>Phiếu: {slipInfo.code}</Text>
        </View>
        <Text style={styles.cardSub}>Từ: {slipInfo.from}  ➡️  Đến: {slipInfo.to}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Tiến độ điều chuyển:</Text>
            <Text style={styles.progressText}>
              <Text style={{ color: scannedCount >= slipInfo.totalRequired ? colors.success : colors.warning }}>
                {scannedCount}
              </Text> / {slipInfo.totalRequired}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(scannedCount / slipInfo.totalRequired) * 100}%` },
                scannedCount >= slipInfo.totalRequired && { backgroundColor: colors.success }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructionText}>
          {scannedCount >= slipInfo.totalRequired 
            ? '✅ Đã quét đủ tài sản điều chuyển!' 
            : 'Quét các tài sản cần điều chuyển theo danh sách.'}
        </Text>
      </View>

      <ScannerOverlay isScanning={isScanning} scannedCount={scannedCount} onToggleScan={toggleScan} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  progressContainer: { marginTop: 8 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: colors.text },
  progressText: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary },
  progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.warning },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instructionText: { textAlign: 'center', fontSize: 16, color: colors.textSecondary }
});
