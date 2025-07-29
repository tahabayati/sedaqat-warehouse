import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import Invoice from '../../../../../../lib/models/Invoice';
import mongoose from 'mongoose';

export async function PATCH(_, { params }) {
  await dbConnect();

  const rawId = (params.id || '').trim();
  let query = { _id: rawId };

  // اگر ObjectId معتبر است، دو حالت را با $or چک می‌کنیم
  if (mongoose.Types.ObjectId.isValid(rawId)) {
    query = { $or: [{ _id: rawId }, { _id: new mongoose.Types.ObjectId(rawId) }] };
  }

  const updated = await Invoice.findOneAndUpdate(
    query,
    { status: 'in-progress' },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
