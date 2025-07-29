import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import Invoice from '../../../../../../lib/models/Invoice';

export async function PATCH(req, { params }) {
  const { mode } = await req.json(); // 'done' یا 'skipped'
  await dbConnect();

  const inv = await Invoice.findById(params.id);
  if (!inv) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // اگر mode==='done' باید همهٔ collected == quantity باشد
  if (mode === 'done') {
    const wrong = inv.items.find((i) => i.collected !== i.quantity);
    if (wrong)
      return NextResponse.json(
        { error: `آیتم ${wrong.barcode} تکمیل نیست` },
        { status: 400 }
      );
  }

  inv.status = mode === 'skipped' ? 'skipped' : 'done';
  await inv.save();
  return NextResponse.json({ ok: true });
}
