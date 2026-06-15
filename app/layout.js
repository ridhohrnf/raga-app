import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from './providers';
import "./globals.css";

export const metadata = {
  title: "Raga - Volume & Progressive Overload",
  description: "Aplikasi mobile-first pelacak latihan gym premium, volume, PR, progres fisik, dan progressive overload.",
  icons: {
    icon: "/raga_logo.png",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
