import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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

const ListContainer = styled.div`
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 4px;
  margin-top: 20px;
`;

const BeaconScanner = () => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // BLE 데이터 수신 시 리스트 업데이트하는 함수
    window.onReceiveBLEData = (devices) => {
      console.log('📡 BLE 데이터 수신:', devices);
      setDevices(devices);
    };
  }, []);

  return (
    <Container>
      <Title>React Web Bluetooth 비콘 스캐너</Title>

      <ListContainer>
        <h2>발견된 장치 목록</h2>
        <ul id="ble-list">
          {devices.map((device, index) => (
            <li key={index}>{device.name || '이름 없음'} ({device.id})</li>
          ))}
        </ul>
      </ListContainer>

      {/* onReceiveBLEData() 함수를 HTML에 직접 삽입 */}
      <div dangerouslySetInnerHTML={{
        __html: `
          <script>
            function onReceiveBLEData(devices) {
              console.log('BLE 데이터 수신:', devices);
              document.getElementById('ble-list').innerHTML = devices.map(
                d => '<li>' + (d.name || '이름 없음') + ' (' + d.id + ')</li>'
              ).join('');
            }
          </script>
        `
      }} />
    </Container>
  );
};

export default BeaconScanner;
