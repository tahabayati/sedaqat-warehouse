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

      // Step 1 – extract bc+qty rows with proper validation
      const itemsRaw = [];
      for (let r = rowIdx + 1; r < rows.length; r++) {
        const bc  = rows[r][colBC];
        const qty = rows[r][colQty];
        
        // Skip rows that don't have both barcode and quantity
        if (!bc || !qty) continue;
        
        // Convert to string and trim
        const barcodeStr = String(bc).trim();
        const quantityStr = String(qty).trim();
        
        // Skip if barcode is not a valid 13-digit number
        if (!/^\d{13}$/.test(barcodeStr)) {
          console.log(`[upload] Skipping invalid barcode: "${barcodeStr}"`);
          continue;
        }
        
        // Skip if quantity is not a valid number
        if (isNaN(Number(quantityStr))) {
          console.log(`[upload] Skipping invalid quantity: "${quantityStr}" for barcode: ${barcodeStr}`);
          continue;
        }
        
        // Skip if the row contains Persian header text
        if (barcodeStr === 'بارکد' || quantityStr === 'مقدار اصلی' || 
            barcodeStr.includes('بارکد') || quantityStr.includes('مقدار اصلی')) {
          console.log(`[upload] Skipping header row: barcode="${barcodeStr}", quantity="${quantityStr}"`);
          continue;
        }
        
        itemsRaw.push({ 
          barcode: barcodeStr, 
          quantity: Number(quantityStr) 
        });
      }

      console.log(`[upload] Valid items found: ${itemsRaw.length}`);

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

    // Filter out invalid rows and header rows
    const validRows = defaultRows.filter(row => {
      const barcode = String(row.barcode || '').trim();
      const quantity = row.quantity;
      
      // Skip if barcode is not a valid 13-digit number
      if (!/^\d{13}$/.test(barcode)) {
        console.log(`[upload-fallback] Skipping invalid barcode: "${barcode}"`);
        return false;
      }
      
      // Skip if quantity is not a valid number
      if (isNaN(Number(quantity))) {
        console.log(`[upload-fallback] Skipping invalid quantity: "${quantity}" for barcode: ${barcode}`);
        return false;
      }
      
      // Skip if the row contains Persian header text
      if (barcode === 'بارکد' || String(quantity).includes('مقدار اصلی') || 
          barcode.includes('بارکد') || String(quantity).includes('مقدار اصلی')) {
        console.log(`[upload-fallback] Skipping header row: barcode="${barcode}", quantity="${quantity}"`);
        return false;
      }
      
      return true;
    });

    console.log(`[upload-fallback] Valid rows found: ${validRows.length}`);

    await dbConnect();
    const details = await Barcode.find({
      code: { $in: validRows.map(r => r.barcode) }
    }).lean();

    const enriched = validRows.map(p => {
      const d = details.find(x => x.code === p.barcode) || {};
      const item = {
        ...p,
        quantity: Number(p.quantity), // Ensure quantity is a number
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
