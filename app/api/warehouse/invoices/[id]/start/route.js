import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import Invoice from '../../../../../../lib/models/Invoice';
import mongoose from 'mongoose';

export async function PATCH(_, { params }) {
  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: 'Bad ID' }, { status: 400 });

  await dbConnect();
  await Invoice.updateOne({ _id: id }, { $set: { status: 'in-progress' } });
  return NextResponse.json({ ok: true });
}
