import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Barcode from '../../../lib/models/Barcode';
import { generateCandidate } from '../../../lib/generateBarcode';

export async function POST() {
  await dbConnect();
  for (let i = 0; i < 5; i++) {
    const code = generateCandidate();
    try {
      const doc = await Barcode.create({ code });
      return NextResponse.json({
        code: doc.code,
        generatedAt: doc.generatedAt,
      });
    } catch (e) {
      if (e.code !== 11000)
        return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
  }
  return NextResponse.json(
    { error: 'unique code not found' },
    { status: 500 }
  );
}
