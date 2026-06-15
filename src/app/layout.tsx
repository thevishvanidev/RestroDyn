import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RestroDyn - Future of Restaurant Management',
  description: 'Revolutionizing Restaurant Experience with Smart Digital Dining',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}