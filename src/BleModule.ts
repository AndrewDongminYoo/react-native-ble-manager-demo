import {Platform, NativeModules, NativeEventEmitter} from 'react-native';
import BleManager, {Peripheral, PeripheralInfo} from 'react-native-ble-manager';
import {BleEventType, BleState} from './type';
import {byteToString} from './utils';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

export default class BleModule {
  /** 페어링된 주변기기 ID */
  peripheralId: string;
  /** Bluetooth 상태 */
  bleState: BleState;
  readServiceUUID!: any[];
  readCharacteristicUUID!: any[];
  writeWithResponseServiceUUID!: any[];
  writeWithResponseCharacteristicUUID!: any[];
  writeWithoutResponseServiceUUID!: any[];
  writeWithoutResponseCharacteristicUUID!: any[];
  notifyServiceUUID!: any[];
  notifyCharacteristicUUID!: any[];
  constructor() {
    this.peripheralId = '';
    this.bleState = BleState.Off;
    this.initUUID();
  }
  initUUID() {
    this.readServiceUUID = [];
    this.readCharacteristicUUID = [];
    this.writeWithResponseServiceUUID = [];
    this.writeWithResponseCharacteristicUUID = [];
    this.writeWithoutResponseServiceUUID = [];
    this.writeWithoutResponseCharacteristicUUID = [];
    this.notifyServiceUUID = [];
    this.notifyCharacteristicUUID = [];
  }
  /** 리스너 추가 */
  addListener(
    eventType: BleEventType,
    listener: (data: any) => void,
    context?: any,
  ) {
    return bleManagerEmitter.addListener(eventType, listener, context);
  }
  /** Bluetooth 모듈 초기화 */
  start() {
    BleManager.start({showAlert: false})
      .then(() => {
        // 초기화 성공한 후 Bluetooth 상태 확인
        this.checkState();
        console.log('Init the module success');
      })
      .catch(error => {
        console.log('Init the module fail', error);
      });
  }
  /** Bluetooth 상태 및 트리거 BleManagerDidUpdateState 이벤트에 대한 강제 검사 */
  checkState() {
    BleManager.checkState();
  }
  /** 사용 가능한 장비를 스캔하고 5 초 후에 끝납니다. */
  scan(): Promise<void> {
    return new Promise((resolve, reject) => {
      BleManager.scan([], 5, true)
        .then(() => {
          console.log('Scan started');
          resolve();
        })
        .catch(error => {
          console.log('Scan started fail', error);
          reject(error);
        });
    });
  }
  /** 스캔 중지 */
  stopScan(): Promise<void> {
    return new Promise((resolve, reject) => {
      BleManager.stopScan()
        .then(() => {
          console.log('Scan stopped');
          resolve();
        })
        .catch(error => {
          console.log('Scan stopped fail', error);
          reject();
        });
    });
  }
  /** 스캔 한 Bluetooth 장비로 돌아갑니다. */
  getDiscoveredPeripherals(): Promise<Peripheral[]> {
    return new Promise((resolve, reject) => {
      BleManager.getDiscoveredPeripherals()
        .then(peripheralsArray => {
          console.log('Discovered peripherals: ', peripheralsArray);
          resolve(peripheralsArray);
        })
        .catch(error => {
          console.log('Discovered peripherals fail', error);
          reject(error);
        });
    });
  }
  /** 16, 32 및 128 Bit UUID를 128 Bit UUID로 변환합니다. */
  fullUUID(uuid: string) {
    if (uuid.length === 4) {
      return '0000' + uuid.toUpperCase() + '-0000-1000-8000-00805F9B34FB';
    }
    if (uuid.length === 8) {
      return uuid.toUpperCase() + '-0000-1000-8000-00805F9B34FB';
    }
    return uuid.toUpperCase();
  }
  /** 알림, 읽기, 쓰기, WriteWithoutResponse의 serviceUUID 및 characteristicUUID를 얻습니다. */
  getUUID(peripheralInfo: PeripheralInfo) {
    this.readServiceUUID = [];
    this.readCharacteristicUUID = [];
    this.writeWithResponseServiceUUID = [];
    this.writeWithResponseCharacteristicUUID = [];
    this.writeWithoutResponseServiceUUID = [];
    this.writeWithoutResponseCharacteristicUUID = [];
    this.notifyServiceUUID = [];
    this.notifyCharacteristicUUID = [];
    for (let item of peripheralInfo.characteristics!) {
      item.service = this.fullUUID(item.service);
      item.characteristic = this.fullUUID(item.characteristic);
      if (Platform.OS === 'android') {
        if (item.properties.Notify === 'Notify') {
          this.notifyServiceUUID.push(item.service);
          this.notifyCharacteristicUUID.push(item.characteristic);
        }
        if (item.properties.Read === 'Read') {
          this.readServiceUUID.push(item.service);
          this.readCharacteristicUUID.push(item.characteristic);
        }
        if (item.properties.Write === 'Write') {
          this.writeWithResponseServiceUUID.push(item.service);
          this.writeWithResponseCharacteristicUUID.push(item.characteristic);
        }
        if (item.properties.WriteWithoutResponse === 'WriteWithoutResponse') {
          this.writeWithoutResponseServiceUUID.push(item.service);
          this.writeWithoutResponseCharacteristicUUID.push(item.characteristic);
        }
      } else {
        // ios
        for (let property of item.properties as string[]) {
          if (property === 'Notify') {
            this.notifyServiceUUID.push(item.service);
            this.notifyCharacteristicUUID.push(item.characteristic);
          }
          if (property === 'Read') {
            this.readServiceUUID.push(item.service);
            this.readCharacteristicUUID.push(item.characteristic);
          }
          if (property === 'Write') {
            this.writeWithResponseServiceUUID.push(item.service);
            this.writeWithResponseCharacteristicUUID.push(item.characteristic);
          }
          if (property === 'WriteWithoutResponse') {
            this.writeWithoutResponseServiceUUID.push(item.service);
            this.writeWithoutResponseCharacteristicUUID.push(
              item.characteristic,
            );
          }
        }
      }
    }
    console.log('readServiceUUID', this.readServiceUUID);
    console.log('readCharacteristicUUID', this.readCharacteristicUUID);
    console.log(
      'writeWithResponseServiceUUID',
      this.writeWithResponseServiceUUID,
    );
    console.log(
      'writeWithResponseCharacteristicUUID',
      this.writeWithResponseCharacteristicUUID,
    );
    console.log(
      'writeWithoutResponseServiceUUID',
      this.writeWithoutResponseServiceUUID,
    );
    console.log(
      'writeWithoutResponseCharacteristicUUID',
      this.writeWithoutResponseCharacteristicUUID,
    );
    console.log('notifyServiceUUID', this.notifyServiceUUID);
    console.log('notifyCharacteristicUUID', this.notifyCharacteristicUUID);
  }
  /**
   * Bluetooth를 연결합니다. 연결할 수 없는 경우 장치를 먼저 스캔해야 할 수도 있습니다.
   * iOS에서는 Bluetooth 장치에 연결하는 데 시간이 걸리지 않으므로 발생하지 않으려면 타이머를 명확하게 설정해야 할 수도 있습니다.
   */
  connect(id: string): Promise<PeripheralInfo> {
    return new Promise((resolve, reject) => {
      BleManager.connect(id)
        .then(() => {
          console.log('Connected success');
          // 연결된 Bluetooth 장비의 서비스 및 특성을 구합니다.
          return BleManager.retrieveServices(id);
        })
        .then(peripheralInfo => {
          console.log('Connected peripheralInfo', peripheralInfo);
          this.peripheralId = peripheralInfo.id;
          this.getUUID(peripheralInfo);
          resolve(peripheralInfo);
        })
        .catch(error => {
          console.log('Connected fail', error);
          reject(error);
        });
    });
  }
  /** Bluetooth 연결 분리 */
  disconnect() {
    BleManager.disconnect(this.peripheralId)
      .then(() => {
        console.log('Disconnected');
      })
      .catch(error => {
        console.log('Disconnected fail', error);
      });
  }
  /** 알림 시작 */
  startNotification(index = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      BleManager.startNotification(
        this.peripheralId,
        this.notifyServiceUUID[index],
        this.notifyCharacteristicUUID[index],
      )
        .then(() => {
          console.log('Notification started');
          resolve();
        })
        .catch(error => {
          console.log('Start notification fail', error);
          reject(error);
        });
    });
  }
  /** 알림 중지 */
  stopNotification(index = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      BleManager.stopNotification(
        this.peripheralId,
        this.notifyServiceUUID[index],
        this.notifyCharacteristicUUID[index],
      )
        .then(() => {
          console.log('Stop notification success!');
          resolve();
        })
        .catch(error => {
          console.log('Stop notification fail', error);
          reject(error);
        });
    });
  }
  /** Bluetooth에 Data 작성 */
  write(data: any, index = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      BleManager.write(
        this.peripheralId,
        this.writeWithResponseServiceUUID[index],
        this.writeWithResponseCharacteristicUUID[index],
        data,
      )
        .then(() => {
          console.log('Write success', data.toString());
          resolve();
        })
        .catch(error => {
          console.log('Write failed', data);
          reject(error);
        });
    });
  }
  /** 리스폰스 없이 Bluetooth에 Data를 작성합니다. */
  writeWithoutResponse(data: any, index = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      BleManager.writeWithoutResponse(
        this.peripheralId,
        this.writeWithoutResponseServiceUUID[index],
        this.writeWithoutResponseCharacteristicUUID[index],
        data,
      )
        .then(() => {
          console.log('Write success', data);
          resolve();
        })
        .catch(error => {
          console.log('Write failed', data);
          reject(error);
        });
    });
  }
  /** 지정된 기능이 있는 Data를 읽습니다. */
  read(index = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      BleManager.read(
        this.peripheralId,
        this.readServiceUUID[index],
        this.readCharacteristicUUID[index],
      )
        .then(data => {
          const str = byteToString(data);
          console.log('Read', data, str);
          resolve(str);
        })
        .catch(error => {
          console.log('Read fail', error);
          reject(error);
        });
    });
  }
  /** 연결된 Bluetooth 장치로 돌아갑니다. */
  getConnectedPeripherals(): Promise<Peripheral[]> {
    return new Promise((resolve, reject) => {
      BleManager.getConnectedPeripherals([])
        .then(peripheralsArray => {
          console.log('Get connected peripherals', peripheralsArray);
          resolve(peripheralsArray);
        })
        .catch(error => {
          console.log('Get connected peripherals fail', error);
          reject(error);
        });
    });
  }
  /** 지정된 장치가 연결되어 있는지 확인 */
  isPeripheralConnected(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      BleManager.isPeripheralConnected(this.peripheralId, [])
        .then(isConnected => {
          console.log(
            isConnected
              ? 'Peripheral is connected'
              : 'Peripheral is NOT connected',
          );
          resolve(isConnected);
        })
        .catch(error => {
          console.log('Get peripheral is connected fail', error);
          reject(error);
        });
    });
  }
  /** (Android 만 해당) 바인딩 장치를 얻습니다. */
  getBondedPeripherals(): Promise<Peripheral[]> {
    return new Promise((resolve, reject) => {
      BleManager.getBondedPeripherals()
        .then(bondedPeripheralsArray => {
          console.log('Bonded peripherals', bondedPeripheralsArray);
          resolve(bondedPeripheralsArray);
        })
        .catch(error => {
          console.log('Bonded peripherals fail', error);
          reject(error);
        });
    });
  }
  /** (Android 만 해당) Bluetooth 활성화 */
  enableBluetooth() {
    BleManager.enableBluetooth()
      .then(() => {
        console.log('The bluetooth is already enabled or the user confirm');
      })
      .catch(error => {
        console.log('The user refuse to enable bluetooth', error);
      });
  }
  /** (Android만 해당) Cache 목록에서 연결된 주변 장치 장치 삭제. 장치가 다시 활성화면 다시 연결됩니다. */
  removePeripheral() {
    BleManager.removePeripheral(this.peripheralId)
      .then(() => {
        console.log('Remove peripheral success');
      })
      .catch(error => {
        console.log('Remove peripheral fail', error);
      });
  }
}
