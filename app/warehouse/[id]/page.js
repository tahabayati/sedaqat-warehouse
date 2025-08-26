'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import styles from './Invoice.module.css';
import { IoOpenOutline } from "react-icons/io5";
import { formatPersianDateTime } from '../../../lib/persianDate';

export default function InvoiceProcess() {
  const { id }          = useParams();
  const router          = useRouter();
  const scannerRef      = useRef(null);

  const [inv, setInv]   = useState(null);
  const [loading, setL] = useState(true);
  const [toast, setT]   = useState('');
  const [popup, setPopup] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  
  const showToast = (m) => { 
    setT(m); 
    setTimeout(() => setT(''), 3000); 
  };

  const showErrorPopup = (message) => {
    setErrorPopup(message);
    setTimeout(() => setErrorPopup(null), 4000);
  };

  /* fetch invoice */
  const load = useCallback(async () => {
    const res  = await fetch(`/api/warehouse/invoices/${id}`, { cache: 'no-store' });
    const data = await res.json();
    setInv(data.invoice);
    setL(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { scannerRef.current?.focus(); }, []);

  /* barcode handler – 1 ⇒ محصول ، 2 ⇒ کارتن */
  const onScannerChange = async (e) => {
    const v = e.target.value.trim();
    if (v.length < 13) return;
    e.target.value = '';

    if (!/^[12][0-9]{12}$/.test(v)) return showErrorPopup('فرمت بارکد نادرست');
    if (!inv) return;

    const isCarton   = v.startsWith('2');
    const productBC  = isCarton ? '1' + v.slice(1) : v;

    const item = inv.items.find((i) => i.barcode === productBC);
    if (!item) return showErrorPopup('بارکد در فاکتور نیست');

    const delta = isCarton
      ? Number(item.box_num) || 1
      : (Number(item.single_num) || 1);
    if (item.collected + delta > item.quantity)
      return showErrorPopup('از حد مجاز بیشتر است');

    await fetch(`/api/warehouse/invoices/${id}/update-line`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: productBC, delta }),
    });
    load();
    showToast(`+${delta}`);
  };

  /* -۱ */
  const decrease = async (barcode) => {
    await fetch(`/api/warehouse/invoices/${id}/update-line`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode, delta: -1 }),
    });
    load();
  };

  /* finish / skip */
  const finish = async (mode) => {
    const res = await fetch(`/api/warehouse/invoices/${id}/finish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (res.ok) router.push('/warehouse');
    else {
      const errorData = await res.json();
      showErrorPopup(errorData.error);
    }
  };

  /* handle completion with error options */
  const handleComplete = async () => {
    const res = await fetch(`/api/warehouse/invoices/${id}/finish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'done' }),
    });
    if (res.ok) router.push('/warehouse');
    else {
      const errorData = await res.json();
      setErrorPopup({
        message: errorData.error,
        showOptions: true
      });
    }
  };

  const handleSkipWithError = async () => {
    await finish('skipped');
    setErrorPopup(null);
  };

  const closeErrorPopup = () => {
    setErrorPopup(null);
  };

  // تبدیل تاریخ به فرمت شمسی نمایشی (همیشه از فرمت‌کننده‌ی مرکزی استفاده می‌کنیم)
  const formatDate = (date) => {
    return formatPersianDateTime(date);
  };

  if (loading)  return <p className={styles.wrapper}>در حال بارگذاری…</p>;
  if (!inv)     return <p className={styles.wrapper}>فاکتور یافت نشد 🚫</p>;

  const readOnly = inv.status === 'done';
  const createdAtFormatted = formatDate(inv.legacyCreatedAt || inv.createdAt);

  return (
    <div className={styles.wrapper}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <h2>{inv.name || `فاکتور ${id}`}</h2>
      {/* تاریخ نمایش داده نمی‌شود */}

      {!readOnly && (
        <input
          ref={scannerRef}
          type="text"
          className={styles.scanner}
          placeholder="بارکد را اسکن یا تایپ کنید"
          onChange={onScannerChange}
          autoFocus
        />
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th></th>{/* آیکن */}
            <th>نام</th>
            <th>مدل</th>
            <th>تعداد</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it) => (
            <tr key={it.barcode} className={it.collected === it.quantity ? styles.doneRow : ''} onClick={!readOnly ? () => setPopup(it) : undefined}>
              <td className={styles.iconCell} style={{fontSize:'1.5rem'}}><IoOpenOutline/></td>
              <td>{it.name}</td>
              <td>{it.model}</td>
              <td>{it.collected} / {it.quantity}</td>
            </tr>
          ))}
          {/* مجموع */}
          {(() => {
            const totalCollected = inv.items.reduce((acc, it) => acc + (Number(it.collected) || 0), 0);
            const totalQty = inv.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
            const complete = totalCollected === totalQty && totalQty > 0;
            return (
              <tr className={complete ? styles.doneRow : ''}>
                <td className={styles.iconCell}></td>
                <td colSpan={2} style={{fontWeight:'bold'}}>مجموع</td>
                <td style={{fontWeight:'bold'}}>{totalCollected} / {totalQty}</td>
              </tr>
            );
          })()}
        </tbody>
      </table>

      {/* پاپ‑آپ */}
      {popup && (
        <div className={styles.popup} onClick={() => setPopup(null)}>
          <div className={styles.popupInner} onClick={(e) => e.stopPropagation()}>
            <button className={styles.close} onClick={() => setPopup(null)}>✕</button>
            <h3>{popup.name}</h3>
            <p className={styles.barcode}>{popup.barcode}</p>
            <p>{popup.collected} / {popup.quantity}</p>
            {!readOnly && (
              <button
                className={`${styles.btn} ${styles.bigDec}`}
                onClick={() => decrease(popup.barcode)}
              >
                -۱
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Popup */}
      {errorPopup && (
        <div className={styles.errorPopup} onClick={() => setErrorPopup(null)}>
          <div className={styles.errorPopupInner} onClick={(e) => e.stopPropagation()}>
            <div className={styles.errorMessage}>
              {typeof errorPopup === 'string' ? errorPopup : errorPopup.message}
            </div>
            {typeof errorPopup === 'object' && errorPopup.showOptions && (
              <div className={styles.errorActions}>
                <button className={`${styles.btn} ${styles.skip}`} onClick={handleSkipWithError}>
                  انتقال به رسید موقت
                </button>
                <button className={`${styles.btn} ${styles.ok}`} onClick={closeErrorPopup}>
                  تایید
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!readOnly && (
        <div className={styles.actions} style={{marginBottom:'60px'}}>
          <button className={`${styles.btn} ${styles.ok}`} onClick={handleComplete}>اتمام</button>
        </div>
      )}
    </div>
  );
}