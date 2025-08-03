// app/layout.js
export const metadata = {
  title: 'H-Bisetun',
  description: 'Barcode & warehouse tools',
  themeColor: '#f15922',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png'
  },
  appleWebApp: {
    capable: true,
    title: 'Sedaqat Warehouse',
    statusBarStyle: 'default'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
