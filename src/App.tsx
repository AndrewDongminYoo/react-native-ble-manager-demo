import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  ListRenderItemInfo,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {
  BleManagerDidUpdateStateEvent,
  Peripheral,
} from 'react-native-ble-manager';
import BleModule from './BleModule';
import BleProtocol from './BleProtocol';
import Characteristic from './components/Characteristic';
import Header from './components/Header';
import {BleEventType, BleState} from './type';

// 참고 : BleModule 카테고리가 Bluetooth의 연결 정보를 유지하기 때문에 글로벌 상태로 싱글턴 객체를 유지합니다.
const bleModule = new BleModule();
const bleProtocol = new BleProtocol();

const App: React.FC = () => {
  // Bluetooth 연결 여부
  const [isConnected, setIsConnected] = useState(false);
  // Bluetooth 스캔 중
  const [scanning, setScanning] = useState(false);
  // Bluetooth 모니터링 여부
  const [isMonitoring, setIsMonitoring] = useState(false);
  // Bluetooth 현재 연결 ID
  const [connectingId, setConnectingId] = useState('');
  // Data 작성
  const [writeData, setWriteData] = useState('');
  // Data 수신
  const [receiveData, setReceiveData] = useState('');
  // Data 읽기
  const [readData, setReadData] = useState('');
  // 입력할 텍스트
  const [inputText, setInputText] = useState('');
  // Bluetooth 주변기기 목록
  const [peripheral, setPeripheral] = useState<Peripheral[]>([]);
  /** Bluetooth에서 수신한 Data Cache */
  const bleReceiveData = useRef<any[]>([]);
  /** 맵 타입을 사용하여 찾은 Bluetooth 장치를 저장하여 목록에 중복 장치가 표시되지 않도록 합니다. */
  const deviceMap = useRef(new Map<string, Peripheral>());
  useEffect(() => {
    bleModule.start();
  }, []);
  useEffect(() => {
    const updateStateListener = bleModule.addListener(
      BleEventType.BleManagerDidUpdateState,
      handleUpdateState,
    );
    const stopScanListener = bleModule.addListener(
      BleEventType.BleManagerStopScan,
      handleStopScan,
    );
    const discoverPeripheralListener = bleModule.addListener(
      BleEventType.BleManagerDiscoverPeripheral,
      handleDiscoverPeripheral,
    );
    const connectPeripheralListener = bleModule.addListener(
      BleEventType.BleManagerConnectPeripheral,
      handleConnectPeripheral,
    );
    const disconnectPeripheralListener = bleModule.addListener(
      BleEventType.BleManagerDisconnectPeripheral,
      handleDisconnectPeripheral,
    );
    const updateValueListener = bleModule.addListener(
      BleEventType.BleManagerDidUpdateValueForCharacteristic,
      handleUpdateValue,
    );
    return () => {
      updateStateListener.remove();
      stopScanListener.remove();
      discoverPeripheralListener.remove();
      connectPeripheralListener.remove();
      disconnectPeripheralListener.remove();
      updateValueListener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** Bluetooth 상태 변경 핸들러 */
  function handleUpdateState(event: BleManagerDidUpdateStateEvent) {
    console.log('BleManagerDidUpdateState:', event);
    bleModule.bleState = event.state;
    // Bluetooth가 활성화되면 자동으로 스캔합니다.
    if (event.state === BleState.On) {
      scan();
    }
  }
  /** 스캔 중지 핸들러 */
  function handleStopScan() {
    console.log('Scanning is stopped');
    setScanning(false);
  }
  /** 새로운 주변기기 탐색 */
  function handleDiscoverPeripheral(data: Peripheral) {
    // console.log('BleManagerDiscoverPeripheral:', data);
    // Bluetooth 연결 ID
    let id;
    // Bluetooth Mac Address
    let macAddress;
    if (Platform.OS === 'android') {
      macAddress = data.id;
      id = macAddress;
    } else {
      // iOS가 연결된 경우 MAC Address는 필요하지 않지만 크로스 플랫폼 기기 간 동일한 인터페이스를 위해 MAC Address를 입력합니다.
      macAddress = bleProtocol.getMacFromAdvertising(data);
      id = data.id;
    }
    deviceMap.current.set(id, data);
    setPeripheral([...deviceMap.current.values()]);
  }
  /** Bluetooth 주변기기 연결 */
  function handleConnectPeripheral(data: Peripheral) {
    console.log('BleManagerConnectPeripheral:', data);
  }
  /** Bluetooth 주변기기 연결 끊김 */
  function handleDisconnectPeripheral(data: Peripheral) {
    console.log('BleManagerDisconnectPeripheral:', data);
    initData();
  }
  function initData() {
    // 연결을 분리 한 후 UUID를 초기화합니다.
    bleModule.initUUID();
    // 연결을 끊은 후 마지막 스캔 결과를 표시합니다.
    setPeripheral([...deviceMap.current.values()]);
    setIsConnected(false);
    setWriteData('');
    setReadData('');
    setReceiveData('');
    setInputText('');
  }
  /** 새로운 Data를 받아 업데이트합니다. */
  function handleUpdateValue(data: any) {
    let value = data.value as string;
    console.log('BluetoothUpdateValue:', value);
    bleReceiveData.current.push(value);
    setReceiveData(bleReceiveData.current.join(''));
    bleProtocol.parseData(value);
  }
  function scan() {
    if (bleModule.bleState !== BleState.On) {
      enableBluetooth();
      return;
    }
    // 스캔할 때 현재 연결 기기 목록을 지웁니다.
    deviceMap.current.clear();
    bleModule
      .scan()
      .then(() => {
        setScanning(true);
      })
      .catch(err => {
        setScanning(false);
        console.error(err);
      });
  }
  function enableBluetooth() {
    if (Platform.OS === 'ios') {
      alert('휴대폰 Bluetooth를 켜십시오.');
    } else {
      Alert.alert('힌트', '휴대폰 Bluetooth를 켜십시오.', [
        {
          text: '취소',
          onPress: () => {},
        },
        {
          text: '활성화',
          onPress: () => {
            bleModule.enableBluetooth();
          },
        },
      ]);
    }
  }
  /** Bluetooth 연결 */
  function connect(item: Peripheral) {
    setConnectingId(item.id);
    if (scanning) {
      // 현재 스캔하고 연결할 때 스캔을 끕니다.
      bleModule.stopScan().then(() => {
        setScanning(false);
      });
    }
    bleModule
      .connect(item.id)
      .then(peripheralInfo => {
        setIsConnected(true);
        // 연결이 성공하면 목록이 연결된 장치 만 표시됩니다.
        setPeripheral([item]);
        setConnectingId(peripheralInfo.id);
      })
      .catch(err => {
        alert('연결 실패');
        console.error(err);
      })
      .finally(() => {
        setConnectingId('');
      });
  }
  /** 연결을 끊습니다. */
  function disconnect() {
    bleModule.disconnect();
    initData();
  }
  function notify(index: number) {
    bleModule
      .startNotification(index)
      .then(() => {
        setIsMonitoring(true);
        alert('알림 시작에 성공했습니다.');
      })
      .catch(err => {
        setIsMonitoring(false);
        alert('알림 시작에 실패했습니다.');
        console.error(err);
      });
  }
  function read(index: number) {
    bleModule
      .read(index)
      .then((data: string) => {
        setReadData(data);
      })
      .catch(err => {
        alert('읽기 실패');
        console.error(err);
      });
  }
  function write(writeType: 'write' | 'writeWithoutResponse') {
    return (index: number) => {
      if (inputText.length === 0) {
        alert('메시지 내용을 입력하십시오.');
        return;
      }
      bleModule[writeType](inputText, index)
        .then(() => {
          bleReceiveData.current = [];
          setWriteData(inputText);
          setInputText('');
        })
        .catch(err => {
          alert('전송에 실패했습니다.');
          console.error(err);
        });
    };
  }
  function alert(text: string) {
    Alert.alert('힌트', text, [{text: '단언', onPress: () => {}}]);
  }
  function renderItem(item: ListRenderItemInfo<Peripheral>) {
    const data = item.item;
    const disabled = !!connectingId && connectingId !== data.id;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled || isConnected}
        onPress={() => {
          connect(data);
        }}
        style={[styles.item, {opacity: disabled ? 0.5 : 1}]}>
        <View style={{flexDirection: 'row'}}>
          <Text style={{color: 'black'}}>{data.name ? data.name : ''}</Text>
          <Text style={{marginLeft: 50, color: 'red'}}>
            {connectingId === data.id ? '연결 중...' : ''}
          </Text>
        </View>
        <Text>{data.id}</Text>
      </TouchableOpacity>
    );
  }
  function renderFooter() {
    if (!isConnected) {
      return;
    }
    return (
      <ScrollView
        style={{
          marginTop: 10,
          borderColor: '#eee',
          borderStyle: 'solid',
          borderTopWidth: StyleSheet.hairlineWidth * 2,
        }}>
        <Characteristic
          label="Data 작성 (write) :"
          action="보내다"
          content={writeData}
          characteristics={bleModule.writeWithResponseCharacteristicUUID}
          onPress={write('write')}
          input={{inputText, setInputText}}
        />
        <Characteristic
          label="Data 작성 (writeWithoutResponse)"
          action="보내다"
          content={writeData}
          characteristics={bleModule.writeWithoutResponseCharacteristicUUID}
          onPress={write('writeWithoutResponse')}
          input={{inputText, setInputText}}
        />
        <Characteristic
          label="읽기 Data:"
          action="읽다"
          content={readData}
          characteristics={bleModule.readCharacteristicUUID}
          onPress={read}
        />
        <Characteristic
          label={`Data 수신 Data 알림 (${
            isMonitoring ? '모니터링 중입니다.' : '모니터링이 꺼져 있습니다.'
          }) :`}
          action="알아채다"
          content={receiveData}
          characteristics={bleModule.notifyCharacteristicUUID}
          onPress={notify}
        />
      </ScrollView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <Header
        isConnected={isConnected}
        scanning={scanning}
        disabled={scanning || !!connectingId}
        onPress={isConnected ? disconnect : scan}
      />
      <FlatList
        renderItem={renderItem}
        keyExtractor={item => item.id}
        data={peripheral}
        extraData={connectingId}
      />
      {renderFooter()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  item: {
    flexDirection: 'column',
    borderColor: 'rgb(235,235,235)',
    borderStyle: 'solid',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: 10,
    paddingVertical: 8,
  },
});

export default App;
