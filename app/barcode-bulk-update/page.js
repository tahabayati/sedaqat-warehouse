'use client';
import { useState } from 'react';
import styles from './BulkUpdate.module.css';
import BarcodeTabs from '../components/BarcodeTabs';
export default function BarcodeBulkUpdate() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    setReport(null);
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('excel', file);

    setLoading(true);
    try {
      const res = await fetch('/api/barcodes/bulk-update', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'خطا در سرور');
      } else {
        setReport(data);
      }
    } catch (err) {
      setError('اتصال ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <BarcodeTabs />
      <h2 className={styles.title}>به‌روزرسانی انبوه بارکدها (از اکسل)</h2>

      <input
        className={styles.file}
        type="file"
        accept=".xls,.xlsx"
        onChange={handleFile}
      />

      {loading && (
        <div className={styles.spinnerWrap}>
          <span className={styles.loader} />
          <p>در حال پردازش فایل…</p>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {report && (
        <div className={styles.report}>
          <div className={styles.grid}>
            <div><b>کل ردیف‌ها:</b> {report.totalRows}</div>
            <div><b>یافت‌شده در DB:</b> {report.matched}</div>
            <div><b>به‌روزشده:</b> {report.updated}</div>
            <div><b>ستون‌ها:</b> <code>{JSON.stringify(report.columnsDetected)}</code></div>
          </div>

          {report.missing?.length > 0 && (
            <>
              <h4 className={styles.missingTitle}>بارکدهای یافت‌نشده:</h4>
              <div className={styles.missingList}>
                {report.missing.map((c) => <span key={c}>{c}</span>)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
