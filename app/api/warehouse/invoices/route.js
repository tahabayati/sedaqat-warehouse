import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Invoice from '../../../../lib/models/Invoice';

export const dynamic = 'force-dynamic'; // disable cache

// GET /api/warehouse/invoices?status=pending|in-progress|done|skipped|all
export async function GET(req) {
  await dbConnect();

  const status = req.nextUrl.searchParams.get('status') || 'all';
  const serial = (req.nextUrl.searchParams.get('serial') || '').trim();
  const query  = status === 'all' ? {} : { status };
  if (serial) {
    query.serial = String(serial).replace(/[^0-9]/g, '');
  }

  const invoices = await Invoice.find(query)
    .select('_id name serial createdAt status items') 
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ invoices });
}
