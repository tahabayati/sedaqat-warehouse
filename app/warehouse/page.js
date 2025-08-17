'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Warehouse.module.css';
import { formatPersianDateTime } from '../../lib/persianDate';

export default function WarehouseListPage() {
  const [invoices, setInvoices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // دو درخواست موازی: pending و in‑progress
    Promise.all([
      fetch('/api/warehouse/invoices?status=pending',     { cache: 'no-store' }),
      fetch('/api/warehouse/invoices?status=in-progress', { cache: 'no-store' }),
    ])
      .then(([a, b]) => Promise.all([a.json(), b.json()]))
      .then(([p, ip]) => setInvoices([...(p.invoices || []), ...(ip.invoices || [])]));
  }, []);

  // تبدیل تاریخ به فرمت شمسی نمایشی
  const formatDate = (date) => {
    // اگر تاریخ از قبل به صورت رشته فارسی ذخیره شده باشد
    if (typeof date === 'string' && !date.includes('T')) {
      return date;
    }
    return formatPersianDateTime(date);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>فاکتورهای جاری</h1>
      <div className={styles.list}>
        {invoices.map((inv, idx) => (
          <div key={inv._id} className={`${styles.card} ${idx % 2 ? styles.alt : ''}`}>
            <div className={styles.cardInfo}>
              <span className={styles.invName}>{inv.name || 'بدون نام'}</span>
              <span className={styles.date}>
                {formatDate(inv.legacyCreatedAt || inv.createdAt)}
              </span>
            </div>
            <button
              className={styles.startBtn}
              onClick={() => router.push(`/warehouse/${inv._id}`)}
            >
              {inv.status === 'pending' ? 'شروع' : 'ادامه'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}