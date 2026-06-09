import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Goal Tracker - Daily Habits & Time Manager',
  description: 'A premium, responsive, local-first dashboard to track your habits and log task timings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
