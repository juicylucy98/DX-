import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DX 리터러시 향상 교육 만족도 조사',
  description: 'POSCO International DX 리터러시 향상 교육 만족도 조사',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
