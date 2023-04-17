/**
 * 참고: 이 파일의 코드는 Bluetooth Protocol 관련 코드를 처리하기 위한 것으로, 특정 Bluetooth Protocol 규칙에 따라 코드를 수정해야 합니다.
 * 모든 경우에 적용되는 것은 아니며, 일반적인 용도의 앱에서 Bluetooth 인터페이스를 사용하기 위한 샘플 코드입니다.
 *
 * Bluetooth Protocol을 처리하는 도구 함수, 이 예제에서 사용된 Bluetooth Protocol은 다음과 같습니다.
 * 8Bit 바이너리, 즉 1Byte의 Data를 나타내는 2개의 16진수 문자열(예: FE = 11111110)
 * Packet Data 길이 = Packet 명령 + Data의 Byte 길이, 1
 * 반환 Data: FEFD048D010203FCFB(16진수)
 * 세그먼트 구문 분석: Packet Head(FEFD) + Packet Data 길이(04) + Packet 명령(8D) + Data(010203) + Packet Trail(FCFB)
 */
import {Peripheral} from 'react-native-ble-manager';
import {addZero} from './utils';
// Head는 Bluetooth Protocol에 의해 정의되었습니다.
const BLE_HEAD = 'FEFD';
// Bluetooth Protocol 정의에서의 Trail 부분
const BLE_TRAIL = 'FCFB';
/** 최대 Data Delay Time */
const DELAY_TIME = 300;

export default class BleProtocol {
  /** Packet Head를 받은 후 Trail 상태를 받고, 완전한 Data Packet의 수신 상태를 받습니다. */
  trailStatus: boolean;
  /** Bluetooth Data Cache를 받습니다. */
  receiveData: string[];
  /** 수신한 Data의 Delay Time 모니터링 */
  receivedDelayTimer?: number;
  constructor() {
    this.trailStatus = true;
    this.receiveData = [];
  }
  /** Bluetooth가 반환 한 Data를 분석합니다. */
  parseData(data: string) {
    // 일부 Bluetooth 장치는 iOS에서는 소문자 16 진수를 받고 Android에서는 대문자 16 진수를받습니다.
    // 여기서는 대문자 16진수로 통일합니다.
    this.receiveData.push(data.toUpperCase());
    // 배열을 하나의 문자열로 연결합니다.
    let packet = this.receiveData.join('');
    // Packet 명령
    let command;
    // Packet Data 길이
    let packetLen;
    // Packet Head를 받은 경우, Packet Data 길이를 받습니다.
    if (this.isHead(packet)) {
      this.trailStatus = false;
      packetLen = this.getPacketByteLen(packet);
    }
    // Packet Trail을 받은 경우, Packet Data 길이를 확인합니다.
    if (this.isTrail(packet)) {
      // Data 길이 확인 : Packet Data 길이 = 실제 수신 Packet 길이
      if (packetLen === this.getDataByteLen(packet)) {
        // Packet Trail 수신 여부 True
        this.trailStatus = true;
        command = this.getResponseCommand(packet);
        // Packet을 수신한 후 수신된 Bluetooth Data Cache 지우기
        this.receiveData = [];
      }
    }
    this.receivedDelayTimer && clearTimeout(this.receivedDelayTimer);
    // Packet Head를 수신한 후 300ms까지 Packet 테일을 수신하지 못하면 불완전한 Packet Data는 삭제됩니다.
    // 일반적으로 100ms면 충분하지만, 다양한 상황 대비를 위해 300ms로 설정합니다.
    this.receivedDelayTimer = setTimeout(() => {
      if (!this.trailStatus) {
        this.receiveData = [];
      }
    }, DELAY_TIME);
    // Data Packet은 Trail을 수신하기 전에 Data 처리를 수행하지 않습니다.
    if (!this.trailStatus) {
      return;
    }
    this.trailStatus = false;
    // 특정 Packet 명령(8D)에 따른 해당 작업
    if (command === '8D') {
      console.log('Packet 명령: ', command);
    }
  }
  /** 반환된 Data에 전체 Data에 대한 Packet Head가 포함되어 있는지 확인합니다. */
  isHead(str: string) {
    return str.substring(0, 4) === BLE_HEAD;
  }
  /** 반환된 Data에 전체 Data가 포함된 Packet Head가 포함되어 있는지 확인합니다. */
  isTrail(str: string) {
    const len = str.length;
    return str.substring(len - 4, len) === BLE_TRAIL;
  }
  /** 반환된 Data에 대한 Packet 명령 가져오기 */
  getResponseCommand(str: string) {
    return str.substring(6, 8);
  }
  /** Packet의 Packet Data 길이를 반환합니다. */
  getPacketByteLen(str: string) {
    let hexLen = str.substring(4, 6);
    return parseInt(hexLen, 16);
  }
  /**
   * Data 실제 Byte 길이
   * 1Byte의 경우 16진수 문자열 2개
   */
  getDataByteLen(str: string) {
    return str.substring(6, str.length - 4).length / 2;
  }
  /**
   * Bluetooth Protocol 형식, Packet Head, Data 길이, Packet 테일 추가
   * @param {string} data
   * @returns {string} Returns Generated Code.
   * @example
   *  addProtocol('0A') // FEFD010AFCFB
   */
  addProtocol(data: string) {
    return BLE_HEAD + this.getHexByteLength(data) + data + BLE_TRAIL;
  }
  /* 16진수 Data의 길이를 계산하고, 두 자리당 1 길이씩 16진수 형식으로 길이를 반환합니다. */
  getHexByteLength(str: string) {
    let length = str.length / 2;
    let hexLength = addZero(length.toString(16));
    return hexLength;
  }
  /* ios는 Bluetooth 브로드캐스트 메시지에서 Bluetooth 맥 Address를 가져옵니다. */
  getMacFromAdvertising(data: Peripheral) {
    let manufacturerData = data.advertising?.manufacturerData?.data;
    // 비어 있음은 이 Bluetooth 브로드캐스트 메시지에 맥 Address가 포함되어 있지 않음을 의미합니다.
    if (!manufacturerData) {
      return;
    }
    return this.swapEndianWithColon(manufacturerData);
  }
  /**
   * iOS는 브로드캐스트에서 가져온 Mac Address의 크기 끝 형식을 콜론으로 바꿉니다.
   * @param {string} str - Mac Address from Broadcast.
   * @returns {string} - Returns ios Mac Address.
   * @example
   * swapEndianWithColon('010000CAEA80') // '80:EA:CA:00:00:01'
   */
  swapEndianWithColon(str: string) {
    let format = '';
    let len = str.length;
    for (let j = 2; j <= len; j = j + 2) {
      format += str.substring(len - j, len - (j - 2));
      if (j !== len) {
        format += ':';
      }
    }
    return format.toUpperCase();
  }
}
