import './globals.css';
import NavBar from './components/NavBar';

export const metadata = { title: 'Sedaqat Warehouse', description: '' };

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
