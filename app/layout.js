// app/layout.js
import NavBar from './components/NavBar';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
    title: 'H-Bisetun',
    statusBarStyle: 'default'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="H-Bisetun" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <ProtectedRoute>
            <NavBar/>
            {children}
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
