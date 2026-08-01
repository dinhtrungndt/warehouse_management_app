import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { ScannerOverlay } from '../../components/ScannerOverlay';
import { colors } from '../../theme/colors';

export default function ImportScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  // Mock data phiếu nhập
  const slipInfo = {
    code: 'PN230045',
    date: '30/07/2026',
    totalRequired: 50,
  };

  const toggleScan = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      // Giả lập sau 2s quét được 1 số lượng
      setTimeout(() => {
        setScannedCount(prev => Math.min(prev + 10, slipInfo.totalRequired));
      }, 1000);
    }
  };

  const handleSave = () => {
    Alert.alert('Thành công', 'Đã lưu kết quả Nhập Kho lên hệ thống!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Nhập Kho',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
              <Ionicons name="save-outline" size={24} color={colors.surface} />
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>Phiếu nhập: {slipInfo.code}</Text>
        </View>
        <Text style={styles.cardSub}>Ngày tạo: {slipInfo.date}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Tiến độ quét:</Text>
            <Text style={styles.progressText}>
              <Text style={{ color: scannedCount >= slipInfo.totalRequired ? colors.success : colors.primary }}>
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
            ? '✅ Đã quét đủ số lượng yêu cầu!' 
            : 'Hãy hướng súng quét về phía kiện hàng và bóp cò.'}
        </Text>
      </View>

      <ScannerOverlay 
        isScanning={isScanning} 
        scannedCount={scannedCount} 
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
  headerBtn: {
    marginRight: 16,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  cardSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.text,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textSecondary,
  }
});
