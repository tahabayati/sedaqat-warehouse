'use client';
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { useState } from 'react';
import styles from './Barcode.module.css';   // renamed file
import BarcodeTabs from "../components/BarcodeTabs";
export default function BarcodeGenerator() {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generate = async () => {
    setMsg('');
    setIsLoading(true);
    const r = await fetch('/api/barcode', { method: 'POST' });
    if (r.ok) {
      const d = await r.json();
      setCode(d.code);
    } else setMsg('error');
    setIsLoading(false);
  };

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setMsg('copied');
    setTimeout(() => setMsg(''), 1500);
  };

  return (
    <>
    <BarcodeTabs />

    <div className={styles.wrapper}>

      {/* <h1 className={styles.title}>صداقت</h1> */}
      <button className={styles.gen} onClick={generate} disabled={isLoading}>
        <p>تولید بارکد</p>
      </button>

      {isLoading && <span className={styles.loader} />}

      {code && !isLoading && (
        <>
          <div className={styles.code}>{code}</div>
          <button className={styles.copy} onClick={copy}>
            {msg ? <FaCheck /> : <FaRegCopy />}
            <p>{msg ? "شد" : "کپی"}</p>
          </button>
        </>
      )}

    </div>

  </>
  );
}
