import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Barcode from '../../../../lib/models/Barcode';

export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  await dbConnect();
  const regex = new RegExp(q, 'i'); // case-insensitive
  const docs = await Barcode.find({ name: regex })
    .limit(20)
    .select('code box_code box_num name model')
    .lean();

  return NextResponse.json({ results: docs });
}
