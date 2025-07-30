import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Invoice from '../../../../../lib/models/Invoice';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(_, { params }) {
  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: 'Bad ID' }, { status: 400 });

  await dbConnect();
  const inv = await Invoice.findById(id).lean();
  if (!inv) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ invoice: inv });
}
