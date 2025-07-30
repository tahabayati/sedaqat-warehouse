'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import styles from './Invoice.module.css';

export default function InvoiceProcess() {
  const { id } = useParams();
  const router = useRouter();

  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const res  = await fetch(`/api/warehouse/invoices/${id}`, { cache: 'no-store' });
    const data = await res.json();
    setInv(data.invoice);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* --- barcode handler --- */
  const handleBarcode = async (e) => {
    const code = e.target.value.trim();
    if (code.length < 13) return;     // wait till scanner finishes
    e.target.value = '';              // clear for next scan

    if (!/^[1][0-9]{12}$/.test(code)) {
      alert('بارکد نامعتبر است');
      return;
    }
    if (!inv) return;

    const item = inv.items.find((i) => i.barcode === code);
    if (!item)          return alert('این بارکد در فاکتور نیست');
    if (item.collected >= item.quantity)
      return alert('تعداد این کالا تکمیل است');

    await fetch(`/api/warehouse/invoices/${id}/update-line`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: code, delta: 1 }),
    });
    load();
  };

  /* --- decrease button --- */
  const decrease = async (barcode) => {
    const item = inv.items.find((i) => i.barcode === barcode);
    if (!item || item.collected === 0) return;
    if (!confirm('یک عدد کم شود؟')) return;
    await fetch(`/api/warehouse/invoices/${id}/update-line`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode, delta: -1 }),
    });
    load();
  };

  /* --- finish / skip --- */
  const finish = async (mode) => {
    const res = await fetch(`/api/warehouse/invoices/${id}/finish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (res.ok) router.push('/warehouse');
    else alert((await res.json()).error);
  };

  if (loading) return <p className={styles.wrapper}>در حال بارگذاری…</p>;
  if (!inv)     return <p className={styles.wrapper}>فاکتور یافت نشد 🚫</p>;

  return (
    <div className={styles.wrapper}>
      <h2>فاکتور {id}</h2>

      {/* barcode textbox */}
      <input
        type="text"
        className={styles.scanner}
        placeholder="بارکد را اسکن یا تایپ کنید"
        onChange={handleBarcode}
        autoFocus
      />

      <table className={styles.table}>
        <thead>
          <tr>
            <th>بارکد</th>
            <th>نام</th>
            <th>مدل</th>
            <th>تعداد</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it) => (
            <tr key={it.barcode} className={it.collected === it.quantity ? styles.doneRow : ''}>
              <td>{it.barcode}</td>
              <td>{it.name}</td>
              <td>{it.model}</td>
              <td>{it.collected} / {it.quantity}</td>
              <td>
                <button
                  className={`${styles.btn} ${styles.dec}`}
                  onClick={() => decrease(it.barcode)}
                >
                  -۱
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.ok}`}   onClick={() => finish('done')}>اتمام</button>
        <button className={`${styles.btn} ${styles.skip}`} onClick={() => finish('skipped')}>مشکلی نیست</button>
      </div>
    </div>
  );
}
