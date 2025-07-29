import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import Invoice from '../../../../../../lib/models/Invoice';

export async function PATCH(req, { params }) {
  const { barcode, delta } = await req.json(); // delta = +1 یا -1
  await dbConnect();

  const inv = await Invoice.findOneAndUpdate(
    { _id: params.id, 'items.barcode': barcode },
    {
      $inc: { 'items.$.collected': delta },
    },
    { new: true }
  ).lean();

  if (!inv)
    return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ ok: true, items: inv.items });
}
