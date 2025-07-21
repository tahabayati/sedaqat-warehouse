import './globals.css';

export const metadata = { title: 'Sedaqat Warehouse', description: '' };

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
