// app/api/create-invoice/route.js
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Invoice from '../../../lib/models/Invoice';
import { persianNow } from '../../../lib/persianNow';

export const dynamic = 'force-dynamic'; // ⬅️ از کش شدن جلوگیری می‌کند

export async function POST(req) {
  try {
    // بدنهٔ JSON را می‌خوانیم
    const { items } = await req.json();

    // اعتبارسنجی ساده
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'لیست آیتم‌ها خالی است' },
        { status: 400 }
      );
    }

    // اتصال به پایگاه‌داده
    await dbConnect();

    // ایجاد فاکتور در وضعیت «pending»
    const doc = await Invoice.create({
      createdAt: persianNow(), // زمان به‌صورت منطقهٔ تهران
      status: 'pending',
      items,
    });

    // پاسخ با شناسهٔ فاکتور
    return NextResponse.json({ _id: doc._id });
  } catch (err) {
    console.error('create-invoice error:', err);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
