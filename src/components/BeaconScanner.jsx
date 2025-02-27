import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// 스타일드 컴포넌트 정의
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const Subtitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  margin-top: 24px;
`;

const Description = styled.p`
  margin-bottom: 16px;
  line-height: 1.5;
`;

const StatusBox = styled.div`
  background-color: #f0f0f0;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: white;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StartButton = styled(Button)`
  background-color: #4285f4;
  
  &:hover:not(:disabled) {
    background-color: #3367d6;
  }
`;

const StopButton = styled(Button)`
  background-color: #ea4335;
  
  &:hover:not(:disabled) {
    background-color: #d33426;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
`;

const Th = styled.th`
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
  background-color: #f2f2f2;
`;

const Td = styled.td`
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
`;

const Tr = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const EmptyRow = styled.tr`
  text-align: center;
`;

// 비콘 스캐너 컴포넌트
const BeaconScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('스캔 준비 완료');
  const [devices, setDevices] = useState(new Map());
  const [deviceList, setDeviceList] = useState([]);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(true);

  // 지원 여부 확인
  useEffect(() => {
    if (!navigator.bluetooth) {
      setIsBluetoothSupported(false);
      setStatusMessage('이 브라우저는 Web Bluetooth API를 지원하지 않습니다. Chrome이나 Edge 같은 다른 브라우저를 사용해 보세요.');
    }
  }, []);

  // 장치 목록 업데이트
  const updateDeviceList = useCallback(() => {
    const deviceArray = Array.from(devices.values());
    setDeviceList(deviceArray);
  }, [devices]);

  // 제조사 데이터 파싱 함수
  const parseManufacturerData = (manufacturerData) => {
    if (!manufacturerData || manufacturerData.size === 0) {
      return '데이터 없음';
    }
    
    let result = '';
    for (const [companyId, data] of manufacturerData) {
      // 데이터를 16진수 문자열로 변환
      const hex = Array.from(new Uint8Array(data))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      
      // iBeacon 형식 감지 및 파싱
      if (isIBeacon(companyId, data)) {
        const iBeaconData = parseIBeacon(data);
        result += `iBeacon: ${iBeaconData}\n`;
      } else {
        result += `ID: 0x${companyId.toString(16).padStart(4, '0')}, 데이터: ${hex}\n`;
      }
    }
    return result;
  };
  
  // iBeacon 형식인지 확인
  const isIBeacon = (companyId, data) => {
    // Apple의 회사 ID: 0x004C
    if (companyId !== 0x004C) return false;
    
    const view = new DataView(data);
    
    // iBeacon 프리픽스: 0x02, 0x15
    return view.getUint8(0) === 0x02 && view.getUint8(1) === 0x15;
  };
  
  // iBeacon 데이터 파싱
  const parseIBeacon = (data) => {
    const view = new DataView(data);
    
    // UUID 추출 (16 바이트)
    let uuid = '';
    for (let i = 2; i < 18; i++) {
      const byte = view.getUint8(i).toString(16).padStart(2, '0');
      uuid += byte;
      // UUID 형식에 맞게 하이픈 추가
      if (i === 5 || i === 7 || i === 9 || i === 11) {
        uuid += '-';
      }
    }
    
    // Major, Minor 값 추출
    const major = view.getUint16(18);
    const minor = view.getUint16(20);
    
    // 전송 파워 추출
    const txPower = view.getInt8(22);
    
    return `UUID: ${uuid}, Major: ${major}, Minor: ${minor}, TX Power: ${txPower}dBm`;
  };

  // 블루투스 스캔 시작
  const startScan = async () => {
    try {
      setStatusMessage('스캔 중...');
      setIsScanning(true);
      
      // 광고 수신 이벤트 리스너
      const handleAdvertisement = (event) => {
        // 장치 정보 추출
        const device = {
          id: event.device.id,
          name: event.device.name || '이름 없음',
          rssi: event.rssi,
          manufacturerData: parseManufacturerData(event.manufacturerData),
          timestamp: new Date().toLocaleTimeString()
        };
        
        // 장치 맵 업데이트
        setDevices(prevDevices => {
          const newDevices = new Map(prevDevices);
          newDevices.set(device.id, device);
          return newDevices;
        });
      };
      
      // 이벤트 리스너 등록
      navigator.bluetooth.addEventListener('advertisementreceived', handleAdvertisement);
      
      // 스캔 시작
      const scan = await navigator.bluetooth.requestLEScan({
        acceptAllAdvertisements: true
      });
      
      // 스캐너가 작동 중인지 확인
      if (scan.active) {
        setStatusMessage('스캔 진행 중...');
      }
      
      // cleanup 함수 반환
      return () => {
        navigator.bluetooth.removeEventListener('advertisementreceived', handleAdvertisement);
      };
    } catch (error) {
      setStatusMessage(`오류: ${error.message}`);
      setIsScanning(false);
      console.error('스캔 오류:', error);
    }
  };

  // 블루투스 스캔 중지
  const stopScan = async () => {
    try {
      await navigator.bluetooth.stopLEScan();
      setStatusMessage('스캔 중지됨');
      setIsScanning(false);
    } catch (error) {
      console.error('스캔 중지 오류:', error);
    }
  };

  // 장치 목록이 변경될 때마다 업데이트
  useEffect(() => {
    updateDeviceList();
  }, [devices, updateDeviceList]);

  return (
    <Container>
      <Title>React Web Bluetooth 비콘 스캐너</Title>
      <Description>이 페이지는 Web Bluetooth API를 사용하여 주변의 BLE 비콘을 스캔합니다.</Description>
      
      <StatusBox>
        {statusMessage}
      </StatusBox>
      
      <ButtonGroup>
        <StartButton 
          onClick={startScan}
          disabled={isScanning || !isBluetoothSupported}
        >
          비콘 스캔 시작
        </StartButton>
        
        <StopButton 
          onClick={stopScan}
          disabled={!isScanning}
        >
          스캔 중지
        </StopButton>
      </ButtonGroup>
      
      <Subtitle>발견된 비콘</Subtitle>
      
      <Table>
        <thead>
          <Tr>
            <Th>장치 ID</Th>
            <Th>이름</Th>
            <Th>RSSI</Th>
            <Th>제조사 데이터</Th>
            <Th>마지막 발견 시간</Th>
          </Tr>
        </thead>
        <tbody>
          {deviceList.length > 0 ? (
            deviceList.map(device => (
              <Tr key={device.id}>
                <Td>{device.id}</Td>
                <Td>{device.name}</Td>
                <Td>{device.rssi} dBm</Td>
                <Td style={{ whiteSpace: 'pre-line' }}>{device.manufacturerData}</Td>
                <Td>{device.timestamp}</Td>
              </Tr>
            ))
          ) : (
            <EmptyRow>
              <Td colSpan="5" style={{ textAlign: 'center' }}>
                발견된 장치가 없습니다
              </Td>
            </EmptyRow>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default BeaconScanner;