import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import dbConnect from '../../../lib/mongodb';
import Barcode from '../../../lib/models/Barcode';

export async function POST(req) {
  try {
    /* ── read upload ─────────────────────────────────────────────── */
    const fd   = await req.formData();
    const file = fd.get('invoice');
    if (!file || typeof file === 'string')
      return NextResponse.json({ error: 'no file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb     = XLSX.read(buffer, { type: 'buffer' });

    /* ── find sheet+header row with Persian headers ──────────────── */
    let sheet   = null, rowIdx = null, colBC = null, colQty = null;

    outer: for (const name of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
      for (let r = 0; r < Math.min(rows.length, 20); r++) {
        const row = rows[r];
        const iBC  = row.indexOf('بارکد');
        const iQTY = row.indexOf('مقدار اصلی');
        if (iBC !== -1 && iQTY !== -1) {
          sheet = name; rowIdx = r; colBC = iBC; colQty = iQTY;
          break outer;
        }
      }
    }

    /* ── branch A: پـیش‌فاکتور detected ─────────────────────────── */
    if (sheet) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: '' });

      // Step 1 – extract bc+qty rows
      const itemsRaw = [];
      for (let r = rowIdx + 1; r < rows.length; r++) {
        const bc  = rows[r][colBC];
        const qty = rows[r][colQty];
        if (bc && qty) itemsRaw.push({ barcode: String(bc).trim(), quantity: qty });
      }

      // 🔸 Step 2 – look up details in Mongo
      await dbConnect();
      const details = await Barcode.find({
        code: { $in: itemsRaw.map(i => i.barcode) }
      }).lean();

      // 🔸 Step 3 – merge
      const items = itemsRaw.map(p => {
        const d = details.find(x => x.code === p.barcode) || {};
        const item = {
          ...p,
          box_num: d.box_num || '',
          model:   d.model   || '',
          name:    d.name    || '',
          box_code:d.box_code|| '', 
        };
        console.log(`[upload] Item processed:`, { barcode: p.barcode, item });
        return item;
      });

      console.log(`[upload] Total items processed: ${items.length}`);
      console.log(`[upload] Sample item:`, items[0]);

      return NextResponse.json({ items });
    }

    /* ── branch B: fallback (old template) ───────────────────────── */
    const defaultRows = XLSX.utils.sheet_to_json(
      wb.Sheets[wb.SheetNames[0]],
      { defval: '' }
    );

    await dbConnect();
    const details = await Barcode.find({
      code: { $in: defaultRows.map(r => r.barcode) }
    }).lean();

    const enriched = defaultRows.map(p => {
      const d = details.find(x => x.code === p.barcode) || {};
      const item = {
        ...p,
        box_num: d.box_num || '',
        model:   d.model   || '',
        name:    d.name    || '',
        box_code:d.box_code|| '', 
      };
      console.log(`[upload-fallback] Item processed:`, { barcode: p.barcode, item });
      return item;
    });

    console.log(`[upload-fallback] Total items processed: ${enriched.length}`);
    console.log(`[upload-fallback] Sample item:`, enriched[0]);

    return NextResponse.json({ items: enriched });

  } catch (err) {
    console.error('[upload] ERROR', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
