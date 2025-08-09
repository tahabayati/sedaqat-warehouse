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

  // TOP quantity input (total items user wants to print)
  const [totalQty, setTotalQty] = useState(1);

  // utils
  const ensureProlog = (s='') =>
    s.startsWith('<?xml') ? s : `<?xml version="1.0" encoding="UTF-8"?>\n` + s;

  const parseBoxNum = (x) => {
    if (x === 0 || x === '0') return 0;
    const n = Number(String(x ?? '').replace(/[^\d]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  // computed copies
  const prodCopies  = Math.max(1, Number(totalQty) || 1);
  const boxNum      = parseBoxNum(selected?.box_num);
  const cartonCopies = boxNum ? Math.floor(prodCopies / boxNum) : 0;

  /* debounce search */
  useEffect(() => {
    if (query.length < 2) return setSuggest([]);
    const id = setTimeout(() => {
      fetch('/api/barcodes/search?q=' + encodeURIComponent(query))
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((d) => setSuggest(d.results || []))
        .catch(() => setSuggest([]));
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  /* ساخت لیبل */
  const buildLabels = async () => {
    if (!selected) return;

    const base = '/api/barcode-label?';
    const mk = (obj) =>
      Object.entries(obj)
        .map(([k, v]) => k + '=' + encodeURIComponent(v ?? ''))
        .join('&');

    const pProd = fetch(
      base +
        mk({
          code: selected.code,
          name: selected.name,
          model: selected.model,
          carton: '0',
        })
    )
      .then((r) => (r.ok ? r.json() : { svg: '' }))
      .catch(() => ({ svg: '' }));

    const pCart = fetch(
      base +
        mk({
          code: selected.box_code,
          name: selected.name,
          model: selected.model,
          carton: '1',
        })
    )
      .then((r) => (r.ok ? r.json() : { svg: '' }))
      .catch(() => ({ svg: '' }));

    const [a, b] = await Promise.all([pProd, pCart]);
    setSvgs({ prod: a.svg || '', carton: b.svg || '' });
  };

  /* دانلود SVG */
  const dl = (name, svg) => {
    if (!svg) return;
    const clean = ensureProlog(svg);
    const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* دانلود PNG (SVG → PNG در مرورگر) */
  const dlAsPng = async (name, svgString) => {
    try {
      if (!svgString) return;
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-99999px';
      wrapper.innerHTML = ensureProlog(svgString);
      const svgNode = wrapper.firstElementChild;
      document.body.appendChild(wrapper);

      const uri = await svgAsPngUri(svgNode, {
        scale: 3,
        encoderOptions: 1,
        backgroundColor: 'white',
      });

      document.body.removeChild(wrapper);

      const link = document.createElement('a');
      link.href = uri;
      link.download = name + '.png';
      link.click();
    } catch (error) {
      console.error('خطا در تبدیل SVG به PNG:', error);
      alert('خطا در تبدیل به PNG. لطفاً SVG را دانلود کنید.');
    }
  };

  // ========== PRINT ==========
  const stripXmlProlog = (svg = '') =>
    svg.replace(/^<\?xml[\s\S]*?\?>\s*/, '').trim();

  const makePrintHtml = (svgString, copies = 1) => {
    const labelW = '100mm';
    const labelH = '60mm';
    const inner = stripXmlProlog(svgString || '');
    const count = Math.max(1, Number(copies) || 1);

    const pages = Array.from({ length: count }, () => `
      <section class="label">
        <div class="fit">${inner}</div>
      </section>
    `).join('\n');

    return `<!doctype html>
<html dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>Print Labels</title>
  <style>
    @page { size: ${labelW} ${labelH}; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .label {
      width: ${labelW};
      height: ${labelH};
      page-break-after: always;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .fit, .fit svg { width: 100%; height: 100%; }
    .fit svg { preserveAspectRatio: xMidYMid meet; }
  </style>
</head>
<body>
${pages}
<script>
  setTimeout(() => { window.print(); }, 60);
  window.onafterprint = () => window.close();
</script>
</body>
</html>`;
  };

  const printSvgCopies = (svgString, copies) => {
    if (!svgString) return;
    const html = makePrintHtml(svgString, copies);
    const w = window.open('', 'printwin', 'width=900,height=700');
    if (!w) { alert('Popup blocked. Please allow popups to print.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  return (
    <div className={styles.container}>
      <BarcodeTabs />

      {/* TOP quantity input */}
      <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center', marginTop:8 }}>
        <label style={{ fontFamily:'yekanbakh' }}>تعداد کل:</label>
        <input
          type="number"
          min={1}
          value={totalQty}
          onChange={(e) => setTotalQty(e.target.value)}
          style={{
            width: 100,
            textAlign: 'center',
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontFamily: 'yekanbakh',
          }}
          placeholder="تعداد"
          title="تعداد کل"
        />
       
      </div>
      {selected && (
          <small style={{ fontFamily:'yekanbakh', color:'#666' }}>
            {boxNum
              ? `کارتن: ${cartonCopies} (بر اساس ${boxNum} عدد در کارتن)`
              : 'کارتن: نامشخص (box_num ندارد)'}
          </small>
        )}
      {/* search */}
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
            <li
              key={s.code}
              onClick={() => {
                setSelected(s);
                setQuery('');
                setSuggest([]);
              }}
            >
              {s.name} – {s.model}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className={styles.details}>
          <p>{selected.name}</p>
          <p>{selected.model}</p>
          <p style={{ marginTop:4, color:'#666', fontSize:'.9rem' }}>
            {boxNum
              ? `هر کارتن: ${boxNum} عدد`
              : 'تعداد در کارتن نامشخص'}
          </p>
          <button className={styles.build} onClick={buildLabels}>
            ساخت لیبل
          </button>
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

          <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}>
            <button 
              className={styles.dl} 
              onClick={() => printSvgCopies(svgs.prod, prodCopies)}
              style={{ minWidth: '120px' }}
            >
              چاپ {prodCopies} لیبل محصول
            </button>
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

          <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}>
            <button
              className={styles.dl}
              onClick={() => printSvgCopies(svgs.carton, cartonCopies)}
              disabled={!boxNum}
              style={{ 
                opacity: boxNum ? 1 : 0.5,
                minWidth: '120px'
              }}
            >
              {boxNum ? `چاپ ${cartonCopies} لیبل کارتن` : 'چاپ کارتن'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
