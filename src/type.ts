/** react-native-ble-manager */
export enum BleEventType {
  /** 스캔 수신 종료 */
  BleManagerStopScan = 'BleManagerStopScan',
  /** 새 장치 검색 */
  BleManagerDiscoverPeripheral = 'BleManagerDiscoverPeripheral',
  /** Bluetooth 상태 변경 */
  BleManagerDidUpdateState = 'BleManagerDidUpdateState',
  /** 새 Data 수신 */
  BleManagerDidUpdateValueForCharacteristic = 'BleManagerDidUpdateValueForCharacteristic',
  /** Bluetooth 장치 연결됨 */
  BleManagerConnectPeripheral = 'BleManagerConnectPeripheral',
  /** Bluetooth 장치 연결 해제 */
  BleManagerDisconnectPeripheral = 'BleManagerDisconnectPeripheral',
  /** [iOS 만 해당] centralManager:WillRestoreState: 호출 시 트리거됨 (Bluetooth 이벤트 처리를 위해 앱이 백그라운드에서 재시작됨) */
  BleManagerCentralManagerWillRestoreState = 'BleManagerCentralManagerWillRestoreState',
  /** [iOS 만 해당] 주변 장치가 지정된 기능 값에 대한 알림 제공 시작 또는 중지 요청을 받았습니다. */
  BleManagerDidUpdateNotificationStateFor = 'BleManagerDidUpdateNotificationStateFor',
}

export enum BleState {
  Unknown = 'unknown', // [iOS only]
  Resetting = 'resetting', // [iOS only]
  Unsupported = 'unsupported',
  Unauthorized = 'unauthorized', // [iOS only]
  On = 'on',
  Off = 'off',
  TurningOn = 'turning_on', // [android only]
  TurningOff = 'turning_off', // [android only]
}
