import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface HeaderProps {
  isConnected: boolean;
  scanning: boolean;
  disabled: boolean;
  onPress: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isConnected,
  scanning,
  disabled,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.buttonView, {opacity: disabled ? 0.7 : 1}]}
        disabled={disabled}
        onPress={onPress}>
        <Text style={[styles.buttonText]}>
          {scanning
            ? 'Bluetooth 스캔 중'
            : isConnected
            ? 'Bluetooth를 분리하세요.'
            : 'Bluetooth를 연결하세요.'}
        </Text>
      </TouchableOpacity>
      <Text style={{marginLeft: 10, marginTop: 10}}>
        {isConnected ? '현재 장비 연결됨' : '현재 연결 가능'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  buttonView: {
    backgroundColor: 'rgb(33, 150, 243)',
    paddingHorizontal: 10,
    marginHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default Header;
