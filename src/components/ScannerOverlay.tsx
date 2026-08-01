import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ScannerOverlayProps {
  isScanning: boolean;
  scannedCount: number;
  onToggleScan: () => void;
}

export function ScannerOverlay({ isScanning, scannedCount, onToggleScan }: ScannerOverlayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsLabel}>Đã quét được:</Text>
        <Text style={styles.statsValue}>{scannedCount} THẺ</Text>
      </View>

      <TouchableOpacity 
        style={[styles.scanButton, isScanning && styles.scanButtonActive]} 
        onPress={onToggleScan}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isScanning ? 'stop-circle' : 'barcode-outline'} 
          size={64} 
          color={colors.surface} 
        />
        <Text style={styles.scanButtonText}>
          {isScanning ? 'DỪNG QUÉT' : 'BÓP CÒ ĐỂ QUÉT'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statsLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scanButton: {
    backgroundColor: colors.success,
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: colors.success + '40',
  },
  scanButtonActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger + '40',
  },
  scanButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
});
