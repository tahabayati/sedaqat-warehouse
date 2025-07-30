'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import styles from './Invoice.module.css';

/**
 * صفحهٔ پردازش فاکتور برای انباردار
 * 1. فاکتور in‑progress را می‌گیرد.
 * 2. جدول آیتم‌ها را نمایش می‌دهد.
 * 3. رویداد Paste را برای اسکن بارکد می‌شنود.
 * 4. امکان کم‌کردن دستی یک عدد، پایان و Skip دارد.
 */
export default function InvoiceProcess() {
  /* ---------------- params & router ---------------- */
  const { id } = useParams();          // هشدار Promise حل شد
  const router = useRouter();

  /* ---------------- state ---------------- */
  const [inv, setInv]   = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- fetch invoice ---------------- */
  const load = useCallback(async () => {
    if (!id) return;                   // در اولین رندر ممکن است id undefined باشد
    const res  = await fetch(`/api/warehouse/invoices/${id}`, {
      cache: 'no-store',              // کش را بی‌اثر می‌کنیم
    });
    const data = await res.json();
    setInv(data.invoice);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* ---------------- paste listener ---------------- */
  useEffect(() => {
    if (!inv) return;

    const onPaste = async (e) => {
      const text = (e.clipboardData || window.clipboardData)
        .getData('text')
        .trim();
      if (!/^[1][0-9]{12}$/.test(text)) return;           // بارکد معتبر؟
      const item = inv.items.find((i) => i.barcode === text);
      if (!item || item.collected >= item.quantity) return;

      await fetch(`/api/warehouse/invoices/${id}/update-line`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: text, delta: 1 }),
      });
      load(); // بروزرسانی مجدد
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [inv, id, load]);

  /* ---------------- decrease button ---------------- */
  const decrease = async (barcode) => {
    const item = inv.items.find((i) => i.barcode === barcode);
    if (!item || item.collected === 0) return;
    const ok = confirm('یک عدد کم شود؟');
    if (!ok) return;
    await fetch(`/api/warehouse/invoices/${id}/update-line`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode, delta: -1 }),
    });
    load();
  };

  /* ---------------- finish / skip ---------------- */
  const finish = async (mode) => {
    const res = await fetch(`/api/warehouse/invoices/${id}/finish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),   // 'done' یا 'skipped'
    });
    const body = await res.json();
    if (res.ok) router.push('/warehouse');
    else alert(body.error || 'خطا');
  };

  /* ---------------- render ---------------- */
  if (loading) return <p className={styles.wrapper}>در حال بارگذاری…</p>;
  if (!inv)     return <p className={styles.wrapper}>فاکتور یافت نشد 🚫</p>;

  return (
    <div className={styles.wrapper}>
      <h2>فاکتور {id}</h2>
      <p className={styles.note}>برای اسکن، بارکدها را با دستگاه بچسبانید.</p>

      {/* جدول آیتم‌ها */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>بارکد</th>
            <th>نام کالا</th>
            <th>مدل</th>
            <th>جعبه</th>
            <th>جمع‌آوری شده / کل</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it) => (
            <tr key={it.barcode} className={it.collected === it.quantity ? styles.doneRow : undefined}>
              <td>{it.barcode}</td>
              <td>{it.name}</td>
              <td>{it.model}</td>
              <td>{it.box_num}</td>
              <td>
                {it.collected} / {it.quantity}
              </td>
              <td>
                <button onClick={() => decrease(it.barcode)} className={`${styles.btn} ${styles.dec}`}>-۱</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* دکمه‌های پایان / Skip */}
      <div className={styles.actions}>
        <button onClick={() => finish('done')}    className={`${styles.btn} ${styles.ok}`}>اتمام</button>
        <button onClick={() => finish('skipped')} className={`${styles.btn} ${styles.skip}`}>مشکلی نیست</button>
      </div>
    </div>
  );
}
