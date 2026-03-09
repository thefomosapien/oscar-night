import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Oscar Night — 98th Academy Awards',
  description: '3-player Oscar prediction game for the 98th Academy Awards',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
