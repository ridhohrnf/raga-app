'use client';

import { ConfigProvider, App, theme } from 'antd';

export function Providers({ children }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2997ff',
          colorBgContainer: '#161617',
          colorBorder: '#333336',
          borderRadius: 8,
          colorText: '#ffffff',
          fontSize: 14,
        }
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}
