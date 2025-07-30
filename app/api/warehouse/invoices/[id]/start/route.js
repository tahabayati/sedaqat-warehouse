import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import Invoice from '../../../../../../lib/models/Invoice';
import mongoose from 'mongoose';

export async function PATCH(req, context) {
  const { params } = context;
  const rawId = (await params).id.trim();   // ⬅️ await

  await dbConnect();

  // فقط ObjectId معتبر را می‌پذیریم
  if (!mongoose.Types.ObjectId.isValid(rawId))
    return NextResponse.json({ error: 'Bad ID' }, { status: 400 });

  const inv = await Invoice.findByIdAndUpdate(
    rawId,
    { status: 'in-progress' },
    { new: true }
  ).lean();

  if (!inv)
    return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
