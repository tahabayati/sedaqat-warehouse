import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import Invoice from '../../../../../../lib/models/Invoice';
import mongoose from 'mongoose';

export async function PATCH(req, { params }) {
  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: 'Bad ID' }, { status: 400 });

  const { barcode, delta } = await req.json();
  if (!barcode || typeof delta !== 'number')
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });

  await dbConnect();
  const updated = await Invoice.findOneAndUpdate(
    { _id: id, 'items.barcode': barcode },
    { $inc: { 'items.$.collected': delta } },
    { new: true }
  ).lean();

  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
