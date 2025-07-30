import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import Invoice from '../../../../../../lib/models/Invoice';
import mongoose from 'mongoose';

export async function PATCH(req, { params }) {
  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: 'Bad ID' }, { status: 400 });

  const { mode } = await req.json(); // 'done' | 'skipped'
  if (!['done', 'skipped'].includes(mode))
    return NextResponse.json({ error: 'Bad mode' }, { status: 400 });

  await dbConnect();
  const inv = await Invoice.findById(id);
  if (!inv) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (mode === 'done') {
    const unfilled = inv.items.find((i) => i.collected !== i.quantity);
    if (unfilled)
      return NextResponse.json(
        { error: `آیتم ${unfilled.barcode} تکمیل نیست` },
        { status: 400 }
      );
  }

  inv.status = mode;
  await inv.save();
  return NextResponse.json({ ok: true });
}
