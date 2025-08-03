'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment-jalaali';
import 'moment/locale/fa';
import styles from './History.module.css';

export default function HistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus]     = useState('all');
  const [from, setFrom]         = useState(''); // jYYYY/MM/DD
  const [to,   setTo]           = useState('');
  const router = useRouter();

  /* تبدیل شمسی → میلادی 'YYYY-MM-DD' */
  const toGregorian = (j) =>
    j ? moment.from(j, 'fa', 'jYYYY/jMM/jDD').format('YYYY-MM-DD') : '';

  const fetchInvoices = () => {
    const qs = new URLSearchParams();
    if (status !== 'all') qs.set('status', status);
    if (from) qs.set('from', toGregorian(from));
    if (to)   qs.set('to',   toGregorian(to));

    fetch(`/api/warehouse/invoices?${qs.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices || []));
  };

  useEffect(fetchInvoices, [status]); // بار اول و هنگام تغییر تب

  const applyDate = () => fetchInvoices();

  const btnLabel = (st) => (st === 'done' ? 'مشاهده' : 'ادامه');

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>تاریخچه فاکتورها</h1>

      {/* ---- نوار فیلتر ---- */}
      <div className={styles.filters}>
        {['all', 'pending', 'in-progress', 'skipped', 'done'].map((s) => (
          <button
            key={s}
            className={`${styles.fBtn} ${status === s ? styles.active : ''}`}
            onClick={() => setStatus(s)}
          >
            {s === 'all'
              ? 'همه فاکتورها'
              : s === 'pending'
              ? 'در انتظار انجام'
              : s === 'in-progress'
              ? 'در حال انجام'
              : s === 'skipped'
              ? 'رسید های موقت'
              : 'تمام‌ شده'}
          </button>
        ))}
      </div>

      {/* ---- فیلتر تاریخ ---- */}
      <div className={styles.dateRange}>
        <input
          type="text"
          value={from}
          placeholder="از ۱۴۰۴/۰۵/۰۱"
          onChange={(e) => setFrom(e.target.value)}
        />
        <span>تا</span>
        <input
          type="text"
          value={to}
          placeholder="۱۴۰۴/۰۵/۳۰"
          onChange={(e) => setTo(e.target.value)}
        />
        <button className={styles.apply} onClick={applyDate}>اعمال</button>
      </div>

      {/* ---- لیست کارت‌ها ---- */}
      <div className={styles.list}>
        {invoices.map((inv, idx) => (
          <div key={inv._id} className={`${styles.card} ${idx % 2 ? styles.alt : ''}`}>
            <div className={styles.meta}>
              <span className={styles.name}>{inv.name || 'بدون نام'}</span>
              <span className={`${styles.status} ${styles[inv.status]}`}>
                {inv.status === 'pending'
                  ? 'درانتظار'
                  : inv.status === 'in-progress'
                  ? 'درحال انجام'
                  : inv.status === 'skipped'
                  ? 'رسید موقت'
                  : 'تمام‌شده'}
              </span>
              <span className={styles.date}>{inv.createdAt}</span>
            </div>
            <button
              className={styles.btn}
              onClick={() => router.push(`/warehouse/${inv._id}`)}
            >
              {btnLabel(inv.status)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
