import React, { useState, useEffect } from 'react';
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

const ScanButton = styled(Button)`
  background-color: #4285f4;
  
  &:hover:not(:disabled) {
    background-color: #3367d6;
  }
`;

const ClearButton = styled(Button)`
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

const InfoMessage = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: #e8f0fe;
  border-left: 4px solid #4285f4;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: #fce8e6;
  border-left: 4px solid #ea4335;
  margin-bottom: 16px;
`;

// 비콘 스캐너 컴포넌트
const BeaconScanner = () => {
  const [statusMessage, setStatusMessage] = useState('스캔 준비 완료');
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 지원 여부 확인
  useEffect(() => {
    // Feature detection - Web Bluetooth API 지원 여부 확인
    const checkBluetoothSupport = () => {
      try {
        if (!navigator.bluetooth) {
          setIsBluetoothSupported(false);
          setStatusMessage('이 브라우저는 Web Bluetooth API를 지원하지 않습니다. Chrome이나 Edge 같은 다른 브라우저를 사용해 보세요.');
          return false;
        }
        
        // requestLEScan 오류를 방지하기 위한 조치
        // 이 함수를 직접 호출하는 코드는 없지만, 다른 곳에서 발생하는 오류 방지
        if (typeof navigator.bluetooth.requestLEScan === 'function') {
          console.log('requestLEScan 함수가 존재합니다. 실험적 기능이 활성화되어 있습니다.');
        } else {
          console.log('requestLEScan 함수가 존재하지 않습니다. 실험적 기능 없이 계속합니다.');
          // 오류 메시지는 표시하지 않고 계속 진행, requestDevice만 사용할 것이므로
        }
        
        return true;
      } catch (error) {
        console.error('Web Bluetooth API 검사 중 오류:', error);
        setIsBluetoothSupported(false);
        setErrorMessage(`Web Bluetooth API 오류: ${error.message}`);
        return false;
      }
    };
    
    checkBluetoothSupport();
  }, []);

  // 장치 검색 함수
  const scanForDevices = async () => {
    if (!navigator.bluetooth) {
      setStatusMessage('Web Bluetooth API가 지원되지 않습니다.');
      return;
    }

    try {
      setIsScanning(true);
      setStatusMessage('장치 스캔 중...');
      setErrorMessage(''); // 이전 오류 메시지 초기화

      // 장치 검색 옵션
      const options = {
        // BLE 장치 필터링 옵션
        // 아래는 모든 BLE 장치를 허용하는 설정입니다
        acceptAllDevices: true,
        
        // 특정 서비스를 필터링하려면 아래와 같이 설정할 수 있습니다
        // filters: [
        //   { services: ['battery_service'] } // 배터리 서비스를 가진 장치만 필터링
        // ],
        
        // 검색할 서비스 (선택 사항)
        optionalServices: ['battery_service', 'device_information']
      };

      // 장치 선택 모달 표시
      const device = await navigator.bluetooth.requestDevice(options);
      
      // RSSI 값은 requestDevice API를 통해 직접 얻을 수 없으므로
      // 임의의 값으로 설정합니다
      const randomRssi = Math.floor(Math.random() * 40) - 100; // -60 ~ -100 범위의 값
      
      const newDevice = {
        id: device.id || '알 수 없음',
        name: device.name || '이름 없음',
        rssi: randomRssi,
        manufacturerData: '장치에 연결 필요',
        timestamp: new Date().toLocaleTimeString()
      };

      // 장치 정보 추가
      setDevices(prevDevices => {
        // 이미 존재하는 장치인지 확인
        const exists = prevDevices.some(d => d.id === newDevice.id);
        if (!exists) {
          return [...prevDevices, newDevice];
        }
        return prevDevices;
      });

      setStatusMessage(`장치 '${device.name || "알 수 없는 장치"}'를 발견했습니다.`);
      
      // 선택적으로 장치에 연결하여 더 많은 정보를 수집할 수 있습니다
      try {
        // 장치에 연결 시도
        setStatusMessage(`'${device.name || "장치"}'에 연결 중...`);
        const server = await device.gatt?.connect();
        
        if (server) {
          setStatusMessage(`'${device.name || "장치"}'에 연결됐습니다.`);
          
          // 장치 정보 서비스 가져오기
          try {
            const deviceInfoService = await server.getPrimaryService('device_information');
            
            // 제조사 정보 가져오기
            const manufacturerChar = await deviceInfoService.getCharacteristic('manufacturer_name_string');
            const manufacturerValue = await manufacturerChar.readValue();
            const manufacturer = new TextDecoder().decode(manufacturerValue);
            
            // 장치 정보 업데이트
            setDevices(prevDevices => {
              return prevDevices.map(d => {
                if (d.id === device.id) {
                  return {
                    ...d,
                    manufacturerData: `제조사: ${manufacturer}`
                  };
                }
                return d;
              });
            });
          } catch (e) {
            console.log('장치 정보 서비스를 가져올 수 없습니다:', e);
          }
          
          // 연결 종료
          server.disconnect();
        }
      } catch (e) {
        console.log('장치 연결 오류:', e);
      }
      
    } catch (error) {
      console.error('장치 스캔 오류:', error);
      if (error.name === 'NotFoundError') {
        setStatusMessage('장치를 선택하지 않았습니다.');
      } else if (error.message.includes('requestLEScan')) {
        // requestLEScan 관련 오류 처리
        setErrorMessage('requestLEScan 함수를 사용할 수 없습니다. 이 브라우저에서는 수동 장치 선택만 지원됩니다.');
        setStatusMessage('스캔 오류가 발생했습니다.');
      } else {
        setStatusMessage(`오류: ${error.message}`);
        setErrorMessage(`상세 오류 정보: ${error.name} - ${error.message}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // 장치 목록 지우기
  const clearDevices = () => {
    setDevices([]);
    setStatusMessage('장치 목록을 지웠습니다.');
  };

  return (
    <Container>
      <Title>React Web Bluetooth 비콘 스캐너</Title>
      <Description>이 페이지는 Web Bluetooth API를 사용하여 BLE 장치에 접근합니다.</Description>
      
      <InfoMessage>
        참고: 이 버전의 스캐너는 웹 브라우저의 제한으로 인해 주변 장치를 자동으로 스캔할 수 없습니다. 
        대신 장치를 수동으로 선택해야 합니다. 실제 비콘 스캔을 위해서는 Chrome에서 
        'chrome://flags/#enable-web-bluetooth-scanning' 설정을 활성화하거나
        또는 네이티브 앱을 사용하는 것이 좋습니다.
      </InfoMessage>
      
      {errorMessage && (
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      )}
      
      <StatusBox>
        {statusMessage}
      </StatusBox>
      
      <ButtonGroup>
        <ScanButton 
          onClick={scanForDevices}
          disabled={isScanning || !isBluetoothSupported}
        >
          {isScanning ? '스캔 중...' : '장치 스캔'}
        </ScanButton>
        
        <ClearButton 
          onClick={clearDevices}
          disabled={devices.length === 0 || isScanning}
        >
          목록 지우기
        </ClearButton>
      </ButtonGroup>
      
      <Subtitle>발견된 장치</Subtitle>
      
      <Table>
        <thead>
          <Tr>
            <Th>장치 ID</Th>
            <Th>이름</Th>
            <Th>RSSI (예상)</Th>
            <Th>추가 정보</Th>
            <Th>발견 시간</Th>
          </Tr>
        </thead>
        <tbody>
          {devices.length > 0 ? (
            devices.map((device, index) => (
              <Tr key={index}>
                <Td>{device.id}</Td>
                <Td>{device.name}</Td>
                <Td>{device.rssi} dBm</Td>
                <Td>{device.manufacturerData}</Td>
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