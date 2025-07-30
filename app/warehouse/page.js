'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Warehouse.module.css';

export default function WarehouseListPage() {
  const [invoices, setInvoices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/warehouse/invoices?status=pending', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setInvoices(data.invoices || []));
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>فاکتورهای جدید</h1>
      <div className={styles.list}>
        {invoices.map(inv => (
          <div key={inv._id} className={styles.card}>
            <div className={styles.cardInfo}>
              <span>شناسه: {inv._id}</span>
              <span>تاریخ: {inv.createdAt}</span>
            </div>
            <button
              className={styles.startBtn}
              onClick={() => router.push(`/warehouse/${inv._id}`)}
            >
              شروع
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
