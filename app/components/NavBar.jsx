'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './NavBar.module.css';

const links = [
  { href: '/',                label: 'خانه' },
  { href: '/barcode-generator', label: 'ساخت بارکد' },
  { href: '/upload-invoice',  label: 'آپلود فاکتور' },
  { href: '/warehouse',       label: 'فاکتورهای جدید' },
  { href: '/warehouse/history', label: 'تاریخچه' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`${styles.link} ${
            pathname === l.href ? styles.active : ''
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
