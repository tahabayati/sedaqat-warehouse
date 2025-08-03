import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/mongodb';
import Barcode from '@/lib/models/Barcode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// --- Normalize Persian/Arabic letters and collapse whitespace
const faNorm = (s = '') =>
  String(s)
    .replace(/\s+/g, '')         // remove all spaces/newlines
    .replace(/ي/g, 'ی')          // Arabic Yeh -> Persian Yeh
    .replace(/ك/g, 'ک')          // Arabic Kaf -> Persian Kaf
    .trim();

// Try to detect headers in first ~20 rows; returns { idxRow, cols: {barcode, name, model, boxNum, inStock} }
function detectHeaders(rows) {
  let best = null;

  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const row = rows[r] || [];
    const cols = {};
    row.forEach((cell, i) => {
      const h = faNorm(cell);

      if (!cols.barcode && /بارکد/.test(h)) cols.barcode = i;
      if (!cols.name && /(نامکالا|ناممحصول|نام)/.test(h)) cols.name = i;
      if (!cols.model && /مدل/.test(h)) cols.model = i;
      if (!cols.boxNum && /(تعداددرکارتن|تعدادکارتن|تعداددرجعبه|جعبه|کارتن)/.test(h)) cols.boxNum = i;

      // "موجودي اصلي" may include extra whitespace or newline; normalize handles it.
      if (!cols.inStock && /(موجودیاصلی|موجودياصلي|موجودي|موجودی)/.test(h)) cols.inStock = i;
    });

    if (cols.barcode != null) {
      best = { idxRow: r, cols };
      break;
    }
  }
  return best;
}

export async function POST(req) {
  try {
    const fd = await req.formData();
    const file = fd.get('excel');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'no file' }, { status: 400 });
    }

    // Read Excel to rows (header:1)
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { header: 1, defval: '' });

    const hdr = detectHeaders(rows);
    if (!hdr || hdr.cols.barcode == null) {
      return NextResponse.json({ error: 'header not found (barcode)' }, { status: 400 });
    }

    // Build items from rows
    const items = [];
    for (let r = hdr.idxRow + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const barcode = String(row[hdr.cols.barcode] ?? '').trim();
      if (!barcode) continue;

      const name = hdr.cols.name != null ? String(row[hdr.cols.name] ?? '').trim() : '';
      const model = hdr.cols.model != null ? String(row[hdr.cols.model] ?? '').trim() : '';
      const box_num_raw = hdr.cols.boxNum != null ? row[hdr.cols.boxNum] : '';
      const in_stock_raw = hdr.cols.inStock != null ? row[hdr.cols.inStock] : '';

      // Normalize types
      const box_num = box_num_raw === '' || box_num_raw == null ? '' : String(box_num_raw).trim();
      // Prefer number for in_stock when possible
      let in_stock = null;
      if (in_stock_raw !== '' && in_stock_raw != null) {
        const n = Number(String(in_stock_raw).replace(/[,،]/g, '').trim());
        in_stock = Number.isFinite(n) ? n : String(in_stock_raw).trim();
      }

      const update = {};
      if (name) update.name = name;
      if (model) update.model = model;
      if (box_num !== '') update.box_num = box_num;
      if (in_stock !== null) update.in_stock = in_stock;

      items.push({ code: barcode, update });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'no data rows found' }, { status: 400 });
    }

    await dbConnect();

    // Update only existing docs (no upsert)
    const ops = items
      .filter(it => Object.keys(it.update).length > 0)
      .map(it => ({
        updateOne: {
          filter: { code: it.code },
          update: { $set: it.update },
          upsert: false,
        },
      }));

    let result = { matchedCount: 0, modifiedCount: 0 };
    if (ops.length > 0) {
      const res = await Barcode.bulkWrite(ops, { ordered: false });
      result = {
        matchedCount: res.matchedCount ?? 0,
        modifiedCount: res.modifiedCount ?? 0,
      };
    }

    // find missing (not found) for reporting
    const codes = items.map(i => i.code);
    const foundDocs = await Barcode.find({ code: { $in: codes } }).select('code').lean();
    const foundSet = new Set(foundDocs.map(d => d.code));
    const missing = codes.filter(c => !foundSet.has(c));

    return NextResponse.json({
      ok: true,
      totalRows: items.length,
      matched: result.matchedCount,
      updated: result.modifiedCount,
      missing,             // barcodes that didn’t exist in DB
      columnsDetected: hdr.cols,
    });
  } catch (err) {
    console.error('[bulk-update] ERROR', err);
    return NextResponse.json({ error: 'server', detail: String(err?.message || err) }, { status: 500 });
  }
}
