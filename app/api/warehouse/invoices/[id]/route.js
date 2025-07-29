import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Invoice from '../../../../../lib/models/Invoice';
import moment from 'moment-timezone';

export const dynamic = 'force-dynamic'; // disable cache

// GET /api/warehouse/invoices?status=pending|in-progress|done|skipped|all
//                            &from=1404-05-01&to=1404-05-31
export async function GET(req) {
  await dbConnect();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') || 'all';
  const from   = searchParams.get('from'); // 'YYYY-MM-DD' (هجری شمسی به میلادی تبدیل نشده)
  const to     = searchParams.get('to');

  const query = {};
  if (status !== 'all') query.status = status;

  // فیلتر تاریخ با استفاده از فیلد createdAt (که رشته است)
  if (from || to) {
    // تاریخ‌ها را به عدد قابل مقایسه تبدیل می‌کنیم (مثلاً 1404/05/07 → 14040507)
    const asNum = (s) => Number(s.replaceAll('/', '').slice(0, 8));
    if (from) query.$expr = { $gte: [asNum('$createdAt'), asNum(from.replaceAll('-', '/'))] };
    if (to) {
      const cond = { $lte: [asNum('$createdAt'), asNum(to.replaceAll('-', '/'))] };
      query.$expr = query.$expr ? { $and: [query.$expr, cond] } : cond;
    }
  }

  const invoices = await Invoice.find(query)
    .select('_id createdAt status items')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ invoices });
}
