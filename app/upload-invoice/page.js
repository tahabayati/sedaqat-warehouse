'use client';
import { useState } from 'react';
import Lottie from 'lottie-react';
import successAnimation from '../../public/animations/success.json';
import styles from './UploadInvoice.module.css';

export default function UploadInvoice() {
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(false);
  const [invName, setInvName] = useState('');
  const [loading, setLoading] = useState(false);   // 🔸 اسپینر

  /* ---------- handle file ---------- */
  const handleFile = async (e) => {
    setSaved(false);
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);               // ⬅️ نمایش اسپینر
    const fd = new FormData();
    fd.append('invoice', file);

    const res  = await fetch('/api/upload-invoice', { method: 'POST', body: fd });
    const data = await res.json();
    setRows(data.items || []);
    setLoading(false);              // ⬅️ پنهان کردن اسپینر
  };

  /* ---------- create invoice ---------- */
  const createInvoice = async () => {
    const res = await fetch('/api/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: rows,
        name:  invName.trim(), 
       }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>بارگذاری فاکتور اکسل</h2>

      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={handleFile}
        className={styles.fileInput}
      />

      {/* ── اسپینر ─────────────────── */}
      {loading && (
        <div className={styles.loaderWrapper}>
          <span className={styles.loader}></span>
        </div>
      )}

      {rows.length > 0 && !loading && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>بارکد</th>
                  <th>تعداد</th>
                  <th>نام کالا</th>
                  <th>مدل</th>
                  <th>شماره جعبه</th>
                  <th>بارکد کارتن</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.barcode}>
                    <td>{r.barcode}</td>
                    <td>{r.quantity}</td>
                    <td>{r.name}</td>
                    <td>{r.model}</td>
                    <td>{r.box_num}</td>
                    <td>{r.box_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                 {/* فیلد نام فاکتور */}
            <input
              type="text"
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              placeholder="نام دلخواه فاکتور"
              className={styles.nameInput}
            />
          <button onClick={createInvoice} className={styles.button}>
            ایجاد فاکتور
          </button>
        </>
      )}

      {/* ── لاتی موفقیت ─────────────── */}
      {saved && (
        <div className={styles.popupOverlay}>
          <div className={styles.lottieWrapper}>
            <Lottie
              animationData={successAnimation}
              loop={false}
              style={{ width: 150, height: 150 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
