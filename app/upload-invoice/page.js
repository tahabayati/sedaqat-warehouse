'use client';
import { useState } from 'react';

export default function UploadInvoice() {
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(false);

  const handleFile = async (e) => {
    setSaved(false);
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('invoice', file);

    const res = await fetch('/api/upload-invoice', { method: 'POST', body: fd });
    const data = await res.json();
    setRows(data.items || []);
  };

  const createInvoice = async () => {
    const res = await fetch('/api/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: rows }),
    });
    if (res.ok) setSaved(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>بارگذاری فاکتور اکسل</h2>
      <input type="file" accept=".xls,.xlsx" onChange={handleFile} />

      {rows.length > 0 && (
        <>
          <table border="1" cellPadding="6" style={{ marginTop: '2rem', width: '100%', direction: 'rtl' }}>
            <thead>
              <tr>
                <th>بارکد</th>
                <th>تعداد</th>
                <th>نام کالا</th>
                <th>مدل</th>
                <th>شماره جعبه</th>
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
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={createInvoice} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem' }}>
            ایجاد فاکتور
          </button>
          {saved && <p style={{ color: 'green' }}>ذخیره شد ✅</p>}
        </>
      )}
    </div>
  );
}
