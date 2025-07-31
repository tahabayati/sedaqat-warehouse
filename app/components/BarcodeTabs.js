// app/components/BarcodeTabs.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BarcodeTabs.module.css';

export default function BarcodeTabs() {
  const path = usePathname();
  const isGen   = path.startsWith('/barcode-generator');
  const isLabel = path.startsWith('/barcode-label');

  return (
    <div className={styles.tabs}>

      <div className={styles.BarcodeTabs} style={{borderLeft:"2px solid #c7c7c760"}}>
         <Link href="/barcode-generator" className={`${styles.tab} ${isGen   ? styles.active : ''}`}>
         تولید بارکد
         </Link>
      </div>
      <div className={styles.BarcodeTabs}>
         <Link href="/barcode-label" className={`${styles.tab} ${isLabel ? styles.active : ''}`}>
         لیبل بارکد
         </Link>
      </div>
     
    </div>
  );
}
