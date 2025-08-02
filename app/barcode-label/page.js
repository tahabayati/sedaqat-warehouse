'use client';
import { useState, useEffect } from 'react';
import { svgAsPngUri } from 'save-svg-as-png';
import BarcodeTabs from '../components/BarcodeTabs';
import styles from './BarcodeLabel.module.css';

export default function BarcodeLabel() {
  const [query, setQuery] = useState('');
  const [suggest, setSuggest] = useState([]);
  const [selected, setSelected] = useState(null); 
  const [svgs, setSvgs] = useState({ prod: '', carton: '' });

  /* debounce search */
  useEffect(() => {
    if (query.length < 2) return setSuggest([]);
    const id = setTimeout(() => {
      fetch('/api/barcodes/search?q=' + encodeURIComponent(query))
        .then((r) => r.json())
        .then((d) => setSuggest(d.results || []));
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

    /* ساخت لیبل */
  const buildLabels = async () => {
    if (!selected) return;
    
    const base = '/api/barcode-label?';
    const mk = (obj) =>
      Object.entries(obj).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');

    const pProd = fetch(base + mk({
      code: selected.code,
      name: selected.name,
      model: selected.model,
      carton:'0'
    })).then(r=>r.json());

    const pCart = fetch(base + mk({
      code: selected.box_code,
      name: selected.name,
      model: selected.model,
      carton:'1'
    })).then(r=>r.json());

    const [a,b] = await Promise.all([pProd, pCart]);
    setSvgs({ prod:a.svg, carton:b.svg });
  };

  /* دانلود helper */
  const dl = (name, svg) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* دانلود PNG helper - تبدیل SVG به PNG در مرورگر */
  const dlAsPng = async (name, svgString) => {
    try {
      // یک DOM SVG موقت می‌سازیم
      const wrapper = document.createElement('div');
      wrapper.innerHTML = svgString;
      const svgNode = wrapper.firstElementChild;
      document.body.appendChild(svgNode);           // لازم برای رندر در DOM

      const uri = await svgAsPngUri(svgNode, {
        scale: 3,                  // ≈ 300 dpi برای لیبل 100×60mm
        encoderOptions: 1,
      });
      document.body.removeChild(svgNode);

      const link = document.createElement('a');
      link.href = uri;
      link.download = name + '.png';
      link.click();
    } catch (error) {
      console.error('خطا در تبدیل SVG به PNG:', error);
      alert('خطا در تبدیل به PNG. لطفاً SVG را دانلود کنید.');
    }
  };

  return (
    <div className={styles.container}>
      <BarcodeTabs />

      <input
        className={styles.search}
        type="text"
        placeholder="نام محصول…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {suggest.length > 0 && (
        <ul className={styles.suggest}>
          {suggest.map((s) => (
            <li key={s.code} onClick={() => { setSelected(s); setQuery(''); setSuggest([]); }}>
              {s.name} – {s.model}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className={styles.details}>
          <p>{selected.name}</p>
          <p>{selected.model}</p>
          <button className={styles.build} onClick={buildLabels}>ساخت لیبل</button>
        </div>
      )}

      {svgs.prod && (
        <div className={styles.result}>
          <h3>بارکد محصول</h3>
          <div className={styles.BarcodeImage} dangerouslySetInnerHTML={{ __html: svgs.prod }} />
          <div className={styles.buttons}>
            <button className={styles.dl} onClick={() => dl(selected.name, svgs.prod)}>دانلود SVG</button>
            <button className={styles.dl} onClick={() => dlAsPng(selected.name, svgs.prod)}>دانلود PNG</button>
          </div>
        </div>
      )}

      {svgs.carton && (
        <div className={styles.result}>
          <h3>لیبل کارتن</h3>
          <div className={styles.BarcodeImage} dangerouslySetInnerHTML={{ __html: svgs.carton }} />
          <div className={styles.buttons}>
            <button className={styles.dl} onClick={() => dl('کارتن ' + selected.name, svgs.carton)}>دانلود SVG</button>
            <button className={styles.dl} onClick={() => dlAsPng('کارتن ' + selected.name, svgs.carton)}>دانلود PNG</button>
          </div>
        </div>
      )}
    </div>
  );
}
