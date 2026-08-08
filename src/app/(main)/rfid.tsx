import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { zebraScannerService } from '../../services/ZebraScannerService';

export default function RFIDIssueScreen() {
  const router = useRouter();
  const [assetId, setAssetId] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  React.useEffect(() => {
    const unsubscribe = zebraScannerService.addListener((event) => {
      if (event.epc) {
        setRfidTag(event.epc);
      } else if (event.barcode && !assetId) {
        setAssetId(event.barcode);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [assetId]);

  const handleStartScan = () => {
    setIsScanning(true);
    zebraScannerService.startScan();
  };

  const handleStopScan = () => {
    setIsScanning(false);
    zebraScannerService.stopScan();
  };
  const handleIssue = () => {
    if (!assetId || !rfidTag) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã tài sản và quét mã thẻ RFID!');
      return;
    }
    
    Alert.alert(
      'Xác nhận Gán Thẻ',
      `Tài sản: ${assetId}\nMã Thẻ: ${rfidTag}\n\nBạn có chắc chắn muốn gán thẻ này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          onPress: () => {
            Alert.alert('Thành công', 'Đã gán thẻ thành công vào hệ thống!');
            setAssetId('');
            setRfidTag('');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Gán thẻ / Phát hành Tag' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Bước 1: Chọn Tài sản</Text>
          </View>
          <Text style={styles.hint}>Nhập mã tài sản hoặc quét barcode trên tài sản</Text>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="VD: VTT010005C"
              value={assetId}
              onChangeText={setAssetId}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.searchBtn}>
              <Ionicons name="barcode-outline" size={24} color={colors.surface} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Ionicons name="pricetag-outline" size={24} color={colors.warning} />
            <Text style={styles.cardTitle}>Bước 2: Quét thẻ RFID</Text>
          </View>
          <Text style={styles.hint}>Đưa máy quét lại gần thẻ RFID mới và bóp cò</Text>
          
          <View style={styles.rfidDisplay}>
            {rfidTag ? (
              <Text style={styles.epcText}>{rfidTag}</Text>
            ) : (
              <Text style={styles.epcPlaceholder}>Chưa có dữ liệu thẻ</Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.scanTrigger, isScanning && styles.scanTriggerActive]} 
            onPressIn={handleStartScan}
            onPressOut={handleStopScan}
          >
            <Ionicons name={isScanning ? "sync-outline" : "wifi-outline"} size={32} color={colors.surface} />
            <Text style={styles.scanTriggerText}>
              {isScanning ? 'ĐANG DÒ THẺ (GIỮ CÒ)...' : 'BẤM GIỮ ĐỂ ĐỌC THẺ'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.issueBtn, (!assetId || !rfidTag) && styles.issueBtnDisabled]} 
          onPress={handleIssue}
        >
          <Ionicons name="save-outline" size={24} color={colors.surface} style={{ marginRight: 8 }} />
          <Text style={styles.issueBtnText}>LƯU VÀ GÁN THẺ</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 50,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rfidDisplay: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  epcText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: colors.success,
  },
  epcPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  scanTrigger: {
    backgroundColor: colors.warning,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  scanTriggerActive: {
    backgroundColor: colors.textSecondary,
  },
  scanTriggerText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  issueBtn: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  issueBtnDisabled: {
    backgroundColor: colors.border,
  },
  issueBtnText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
