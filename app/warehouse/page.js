'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Warehouse.module.css';       // CSS Module

export default function WarehouseHome() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // دریافت فاکتورهای در انتظار
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/warehouse/invoices?status=pending');
      const data = await res.json();
      setList(data.invoices || []);
      setLoading(false);
    };
    load();
  }, []);

  const startInvoice = async (id) => {
    await fetch(`/api/warehouse/invoices/${id}/start`, { method: 'PATCH' });
    router.push(`/warehouse/${id}`); // رفتن به صفحهٔ جزئیات
  };

  return (
    <div className={styles.wrapper}>
      <h2>فاکتورهای در انتظار</h2>

      {loading ? (
        <p>در حال بارگذاری…</p>
      ) : list.length === 0 ? (
        <p>هیچ فاکتور در انتظاری وجود ندارد ✅</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>تاریخ ایجاد</th>
              <th>اقدام</th>
            </tr>
          </thead>
          <tbody>
            {list.map((inv) => (
              <tr key={inv._id}>
                <td>{inv._id}</td>
                <td>{inv.createdAt}</td>
                <td>
                  <button
                    className={styles.startBtn}
                    onClick={() => startInvoice(inv._id)}
                  >
                    شروع
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
