import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Invoice from '../../../../lib/models/Invoice';

export const dynamic = 'force-dynamic'; 

export async function GET(req) {
   
  const status = req.nextUrl.searchParams.get('status') || 'pending';
  await dbConnect();
  const invoices = await Invoice.find({ status }).select('_id createdAt').lean();
  return NextResponse.json({ invoices });
}
