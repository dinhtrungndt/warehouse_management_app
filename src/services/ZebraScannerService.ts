import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

// Lấy module Native Zebra (nếu đã được biên dịch vào APK)
const { ZebraRfidBarcode } = NativeModules;
const zebraEmitter = ZebraRfidBarcode ? new NativeEventEmitter(ZebraRfidBarcode) : null;

export type ScanEvent = {
  epc?: string;
  barcode?: string;
  rssi?: number; // Cường độ sóng
  timestamp: number;
};

class ZebraScanner {
  private listeners: ((event: ScanEvent) => void)[] = [];
  private isExpoGo = Constants.appOwnership === 'expo';
  private mockInterval: NodeJS.Timeout | null = null;
  private isScanning = false;

  constructor() {
    this.init();
  }

  private init() {
    if (Platform.OS !== 'android') return;

    if (!this.isExpoGo && zebraEmitter) {
      // Đăng ký sự kiện lắng nghe từ Native SDK (Máy thật)
      zebraEmitter.addListener('onTagRead', (data: any) => {
        this.emit({
          epc: data.epc,
          rssi: data.rssi,
          timestamp: Date.now(),
        });
      });

      zebraEmitter.addListener('onBarcodeRead', (data: any) => {
        this.emit({
          barcode: data.barcode,
          timestamp: Date.now(),
        });
      });
    }
  }

  // Bắt đầu phát tia sóng quét
  public startScan() {
    this.isScanning = true;

    if (this.isExpoGo) {
      // GIẢ LẬP TRÊN EXPO GO
      this.mockInterval = setInterval(() => {
        const randomId = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
        this.emit({
          epc: `E2801170000000000000${randomId}`,
          rssi: Math.floor(Math.random() * -30 - 30), // -30 to -60 dBm
          timestamp: Date.now(),
        });
      }, 300);
    } else if (ZebraRfidBarcode) {
      // GỌI XUỐNG SDK THẬT
      ZebraRfidBarcode.startScanning();
    }
  }

  // Dừng quét
  public stopScan() {
    this.isScanning = false;

    if (this.isExpoGo && this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    } else if (ZebraRfidBarcode) {
      ZebraRfidBarcode.stopScanning();
    }
  }

  public getIsScanning() {
    return this.isScanning;
  }

  // Đăng ký Callback để UI nhận dữ liệu
  public addListener(callback: (event: ScanEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private emit(event: ScanEvent) {
    this.listeners.forEach(cb => cb(event));
  }
}

export const zebraScannerService = new ZebraScanner();
