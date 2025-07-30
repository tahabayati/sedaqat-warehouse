// components/NavBar.jsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBarcode } from "react-icons/fa6";
import { TbFileInvoice } from 'react-icons/tb';
import { LuWarehouse, LuHistory } from 'react-icons/lu';
import styles from './NavBar.module.css';

const links = [
  { href: '/barcode-generator', icon: FaBarcode, label: 'بارکد' },
  { href: '/upload-invoice',   icon: TbFileInvoice,    label: 'فاکتور' },
  { href: '/warehouse',        icon: LuWarehouse,      label: 'انبار' },
  { href: '/warehouse/history',icon: LuHistory,        label: 'تاریخچه' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {links.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname === href
              ? `${styles.link} ${styles.active}`
              : styles.link
          }
          aria-label={label}
        >
          <Icon size={24} />
        </Link>
      ))}
    </nav>
  );
}
