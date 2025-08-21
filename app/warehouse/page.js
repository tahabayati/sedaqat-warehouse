'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Warehouse.module.css';
import { formatPersianDateTime } from '../../lib/persianDate';

export default function WarehouseListPage() {
  const [invoices, setInvoices] = useState([]);
  const router = useRouter();
  const [confirmId, setConfirmId] = useState(null);

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
            <button
              className={styles.deleteBtn}
              onClick={() => setConfirmId(inv._id)}
              title="حذف فاکتور"
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      {confirmId && (
        <div className={styles.popup} onClick={() => setConfirmId(null)}>
          <div className={styles.popupInner} onClick={(e) => e.stopPropagation()}>
            <h3>مطمئن هستید؟</h3>
            <div style={{display:'flex', gap:8, marginTop:12, justifyContent:'flex-end'}}>
              <button className={styles.cancelBtn} onClick={() => setConfirmId(null)}>نه</button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={async () => {
                  const id = confirmId;
                  setConfirmId(null);
                  await fetch(`/api/warehouse/invoices/${id}`, { method: 'DELETE' });
                  // refresh list
                  Promise.all([
                    fetch('/api/warehouse/invoices?status=pending', { cache: 'no-store' }),
                    fetch('/api/warehouse/invoices?status=in-progress', { cache: 'no-store' }),
                  ])
                    .then(([a, b]) => Promise.all([a.json(), b.json()]))
                    .then(([p, ip]) => setInvoices([...(p.invoices || []), ...(ip.invoices || [])]));
                }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}