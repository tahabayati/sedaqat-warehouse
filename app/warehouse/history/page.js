'use client';

import { useEffect, useState } from 'react';
import styles from './History.module.css';

const STATUS_LABEL = {
  pending: 'در انتظار',
  'in-progress': 'در حال انجام',
  done: 'انجام شده',
  skipped: 'رد شده',
  all: 'همه',
};

export default function HistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState('all');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (from)   params.append('from', from);
    if (to)     params.append('to', to);

    const res = await fetch(`/api/warehouse/invoices?${params.toString()}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    setInvoices(data.invoices || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // بارگذاری اولیه

  const onFilter = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className={styles.wrapper}>
      <h2>تاریخچهٔ فاکتورها</h2>

      {/* فیلترها */}
      <form onSubmit={onFilter} className={styles.filters}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.keys(STATUS_LABEL).map((k) => (
            <option key={k} value={k}>{STATUS_LABEL[k]}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="از تاریخ"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="تا تاریخ"
        />
        <button type="submit" className={styles.btn}>اعمال فیلتر</button>
      </form>

      {/* جدول */}
      {loading ? (
        <p>در حال بارگذاری…</p>
      ) : invoices.length === 0 ? (
        <p>هیچ فاکتوری یافت نشد.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>شناسه</th>
              <th>تاریخ</th>
              <th>وضعیت</th>
              <th>تعداد آیتم‌ها</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className={styles[inv.status]}>
                <td>{inv._id}</td>
                <td>{inv.createdAt}</td>
                <td>{STATUS_LABEL[inv.status]}</td>
                <td>{inv.items.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
