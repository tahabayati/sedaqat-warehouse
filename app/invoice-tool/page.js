"use client";

import { useState, useRef } from 'react';
import styles from './styles.module.css';

export default function InvoiceToolPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');
  const abortRef = useRef(null);

  const onPickSources = (e) => {
    const files = Array.from(e.target.files || []);
    setSources(files);
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (!sources || sources.length === 0) { setLog('حداقل یک فایل لازم است'); return; }

    const fd = new FormData();
    for (const f of sources) fd.append('sources', f);

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setLog('در حال پردازش...');

    try {
      const res = await fetch('/api/invoice-process', {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok) {
        let msg = `خطا (${res.status})`;
        try { const j = await res.json(); if (j && j.error) msg = j.error; } catch {}
        setLog(msg);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'result.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLog('انجام شد. فایل دانلود شد.');
    } catch (err) {
      if (err.name === 'AbortError') setLog('لغو شد');
      else setLog(err.message || 'خطای غیرمنتظره');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onCancel() {
    if (abortRef.current) abortRef.current.abort();
  }

  return (
    <div className={styles.container} dir="rtl">
      <h1 className={styles.h1}>ابزار تبدیل فاکتور به قالب</h1>
      <p className={styles.note}>این صفحه در منو نمایش داده نمی‌شود؛ فقط با لینک مستقیم در دسترس است.</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>فایل‌های فاکتور (.xls / .xlsx)</label>
          <input type="file" multiple accept=".xls,.xlsx" onChange={onPickSources} />
          {sources.length > 0 && (
            <div className={styles.hint}>{sources.length} فایل انتخاب شد</div>
          )}
        </div>

        <div className={styles.actions}>
          {!loading && (
            <button type="submit" className={styles.button}>پردازش</button>
          )}
          {loading && (
            <button type="button" onClick={onCancel} className={styles.buttonSecondary}>لغو</button>
          )}
        </div>
      </form>

      {log && <pre className={styles.log}>{log}</pre>}

      <div className={styles.help}>
        <p>راهنما:</p>
        <ul>
          <li>یک یا چند فایل فاکتور (xls/xlsx) را انتخاب کنید.</li>
          <li>قالب اکسل ثابت است و به‌صورت خودکار استفاده می‌شود.</li>
          <li>روی «پردازش» بزنید تا فایل نتیجه دانلود شود.</li>
        </ul>
      </div>
    </div>
  );
}
