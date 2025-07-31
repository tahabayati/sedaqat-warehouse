'use client';
import { useState } from 'react';
import BarcodeTabs from '../components/BarcodeTabs';
import styles from './BarcodeLabel.module.css';

export default function BarcodeLabelPage() {
  const [code, setCode] = useState('');
  const [svg,  setSvg]  = useState('');

  const generate = async () => {
    if (!/^[12][0-9]{12}$/.test(code)) return alert('بارکد ۱۳ رقمی وارد کنید');
    // پیشنهاد: فراخوانی API داخلی برای تولید SVG
    const res = await fetch(`/api/barcode-svg?code=${code}`);
    const { svg } = await res.json();
    setSvg(svg);
  };

  return (
    <div className={styles.container}>
      <BarcodeTabs />

      <h2 className={styles.title}>ساخت لیبل بارکد</h2>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="۱۳ رقم بارکد"
        className={styles.input}
      />
      <button onClick={generate} className={styles.btn}>تولید لیبل</button>

      {svg && (
        <div className={styles.preview} dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
