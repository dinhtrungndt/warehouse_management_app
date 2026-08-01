import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ScannerOverlay } from '../../components/ScannerOverlay';
import { colors } from '../../theme/colors';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [signalStrength, setSignalStrength] = useState(0); // 0 to 100
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning && searchQuery) {
      // Giả lập cường độ sóng thay đổi khi người dùng di chuyển súng quét
      interval = setInterval(() => {
        const newSignal = Math.floor(Math.random() * 100);
        setSignalStrength(newSignal);
        
        // Nhịp đập Radar tương ứng với sóng mạnh yếu
        Animated.sequence([
          Animated.timing(pulseAnim, { 
            toValue: 1 + (newSignal / 100) * 0.5, 
            duration: 200, 
            useNativeDriver: true 
          }),
          Animated.timing(pulseAnim, { 
            toValue: 1, 
            duration: 200, 
            useNativeDriver: true 
          })
        ]).start();
      }, 500);
    } else {
      setSignalStrength(0);
      pulseAnim.setValue(1);
    }
    return () => clearInterval(interval);
  }, [isScanning, searchQuery]);

  const toggleScan = () => {
    setIsScanning(!isScanning);
  };

  // Tính toán màu sắc cảnh báo dựa trên độ gần
  const getRadarColor = () => {
    if (signalStrength > 80) return colors.success;
    if (signalStrength > 40) return colors.warning;
    if (signalStrength > 0) return colors.danger;
    return colors.border;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Tìm Kiếm Định Vị', headerStyle: { backgroundColor: colors.secondary } }} />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập mã EPC hoặc Mã tài sản cần tìm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.radarContainer}>
        {searchQuery ? (
          <>
            <Animated.View style={[styles.radarCircle, { 
              borderColor: getRadarColor(),
              transform: [{ scale: pulseAnim }]
            }]}>
              <Ionicons name="location-outline" size={48} color={getRadarColor()} />
            </Animated.View>
            <Text style={styles.signalText}>
              Cường độ tín hiệu: <Text style={{ color: getRadarColor(), fontSize: 24 }}>{signalStrength}%</Text>
            </Text>
            <Text style={styles.instructionText}>
              {signalStrength > 80 ? '🎯 Đã đến rất gần tài sản!' : 'Di chuyển súng quét xung quanh kho để dò sóng...'}
            </Text>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="barcode-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>Vui lòng nhập mã tài sản cần dò tìm ở trên.</Text>
          </View>
        )}
      </View>

      <ScannerOverlay 
        isScanning={isScanning} 
        scannedCount={signalStrength > 0 ? 1 : 0} 
        onToggleScan={toggleScan} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  radarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  radarCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signalText: { fontSize: 16, color: colors.textSecondary, fontWeight: 'bold', marginBottom: 8 },
  instructionText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  emptyState: { alignItems: 'center' },
  emptyText: { marginTop: 16, color: colors.textSecondary, fontSize: 16, textAlign: 'center' }
});
