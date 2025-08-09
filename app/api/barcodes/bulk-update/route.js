import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/mongodb';
import Barcode from '@/lib/models/Barcode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ----------------------- utils ----------------------- */

// Normalize Persian/Arabic letters + remove all whitespaces/newlines
const faNorm = (s = '') =>
  String(s)
    .replace(/\s+/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();

// Headers we consider as product name (and we exclude admin columns)
const NAME_HEADERS_ALLOW = /(نامکالا|ناممحصول|شرحکالا|شرحمحصول|شرح|عنوانکالا|عنوانمحصول)/;
const NAME_HEADERS_DENY  = /(مرکز|نامانبار|انبار|واحد|مشتری|فروشنده|طرف|حساب)/;

// Try to detect headers within first ~20 rows; returns { idxRow, cols }
function detectHeaders(rows) {
  let best = null;

  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const row = rows[r] || [];
    const cols = {};

    row.forEach((cell, i) => {
      const h = faNorm(cell);

      if (!cols.barcode && /(بارکد)/.test(h)) cols.barcode = i;
      if (!cols.model && /(مدلکالا|مدل)/.test(h)) cols.model = i;
      if (!cols.boxNum && /(تعداددرکارتن|تعدادکارتن|تعداددرجعبه|جعبه|کارتن)/.test(h)) cols.boxNum = i;

      // موجودی اصلی (handle whitespace/newline variants)
      if (!cols.inStock && /(موجودیاصلی|موجودياصلي|موجودي|موجودی)/.test(h)) cols.inStock = i;

      // product name (strict allow + deny)
      if (!cols.name) {
        const isNameHeader = NAME_HEADERS_ALLOW.test(h) && !NAME_HEADERS_DENY.test(h);
        if (isNameHeader) cols.name = i;
      }
    });

    // extra: if "نام کالا" not found yet but there is generic "نام" without deny words
    if (cols.name == null) {
      row.forEach((cell, i) => {
        const h = faNorm(cell);
        if (!cols.name && /(^|[^آ-ی])نام($|[^آ-ی])/.test(h) && !NAME_HEADERS_DENY.test(h)) {
          cols.name = i;
        }
      });
    }

    if (cols.barcode != null) {
      // sanity-check the chosen name col (avoid picking "نام انبار")
      if (cols.name != null) {
        let bad = 0, seen = 0;
        for (let k = r + 1; k < Math.min(rows.length, r + 8); k++) {
          const v = String(rows[k]?.[cols.name] ?? '').trim();
          if (!v) continue;
          seen++;
          const nv = faNorm(v);
          if (/(مرکز|انبار|واحد|اداره|بخش)/.test(nv)) bad++;
        }
        if (seen > 0 && bad / seen > 0.6) {
          cols.name = undefined;
        }
      }

      best = { idxRow: r, cols };
      break;
    }
  }

  return best;
}

// Safety net for product name values (don’t save obvious non-product admin values)
const isBadNameValue = (name) => {
  const nv = faNorm(name);
  return /(مرکز|انبار|واحد|اداره|بخش)/.test(nv);
};

// Optional: get small sample set for debugging
function sampleColumn(rows, idxRow, colIdx, limit = 5) {
  const out = [];
  if (colIdx == null) return out;
  for (let r = idxRow + 1; r < Math.min(rows.length, idxRow + 1 + limit); r++) {
    const v = rows[r]?.[colIdx];
    if (v != null && v !== '') out.push(String(v));
  }
  return out;
}

/* ----------------------- route ----------------------- */

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get('debug') === '1';

    const fd = await req.formData();
    const file = fd.get('excel');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'no file' }, { status: 400 });
    }

    // Read Excel to rows (header:1)
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    // You can hard-map a specific template here if you want (uncomment):
    // const firstSheet = wb.SheetNames[0];
    // const rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { header: 1, defval: '' });
    // const hdr = { idxRow: 0, cols: { barcode: 8, name: 5, model: 6, inStock: 16 } };

    // Auto-detect (default)
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

      const name  = hdr.cols.name  != null ? String(row[hdr.cols.name]  ?? '').trim() : '';
      const model = hdr.cols.model != null ? String(row[hdr.cols.model] ?? '').trim() : '';
      const box_num_raw   = hdr.cols.boxNum   != null ? row[hdr.cols.boxNum]   : '';
      const in_stock_raw  = hdr.cols.inStock  != null ? row[hdr.cols.inStock]  : '';

      // Normalize types
      const box_num =
        box_num_raw === '' || box_num_raw == null ? '' : String(box_num_raw).trim();

      let in_stock = null;
      if (in_stock_raw !== '' && in_stock_raw != null) {
        const n = Number(String(in_stock_raw).replace(/[,،]/g, '').trim());
        in_stock = Number.isFinite(n) ? n : String(in_stock_raw).trim();
      }

      const update = {};
      // Safety: avoid writing admin-ish values as product name
      if (name && !isBadNameValue(name)) update.name = name;
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
      .filter((it) => Object.keys(it.update).length > 0)
      .map((it) => ({
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
    const codes = items.map((i) => i.code);
    const foundDocs = await Barcode.find({ code: { $in: codes } })
      .select('code')
      .lean();
    const foundSet = new Set(foundDocs.map((d) => d.code));
    const missing = codes.filter((c) => !foundSet.has(c));

    const json = {
      ok: true,
      totalRows: items.length,
      matched: result.matchedCount,
      updated: result.modifiedCount,
      missing,
      columnsDetected: hdr.cols,
    };

    // Debug payload (optional): samples from chosen columns to verify correctness
    if (debug) {
      json.debug = {
        headerRow: hdr.idxRow,
        sample: {
          barcode: sampleColumn(rows, hdr.idxRow, hdr.cols.barcode),
          name:    sampleColumn(rows, hdr.idxRow, hdr.cols.name),
          model:   sampleColumn(rows, hdr.idxRow, hdr.cols.model),
          inStock: sampleColumn(rows, hdr.idxRow, hdr.cols.inStock),
          boxNum:  sampleColumn(rows, hdr.idxRow, hdr.cols.boxNum),
        },
      };
    }

    return NextResponse.json(json);
  } catch (err) {
    console.error('[bulk-update] ERROR', err);
    return NextResponse.json(
      { error: 'server', detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
