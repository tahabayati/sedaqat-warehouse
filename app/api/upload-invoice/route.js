import { NextResponse } from 'next/server';
import { parseExcelInvoice } from '../../../lib/parseExcelInvoice';
import dbConnect from '../../../lib/mongodb';
import Barcode from '../../../lib/models/Barcode';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('invoice');

  if (!file || typeof file === 'string')
    return NextResponse.json({ error: 'no file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseExcelInvoice(buffer);

  await dbConnect();
  const details = await Barcode.find({ code: { $in: parsed.map((i) => i.barcode) } }).lean();

  const enriched = parsed.map((p) => {
    const d = details.find((x) => x.code === p.barcode) || {};
    return { ...p, box_num: d.box_num || '', model: d.model || '', name: d.name || '' };
  });

  return NextResponse.json({ items: enriched });
}
