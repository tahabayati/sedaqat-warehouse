// app/api/create-invoice/route.js
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Invoice from '../../../lib/models/Invoice';
import { gregorianNowISO, persianNow } from '../../../lib/persianDate';

export const dynamic = 'force-dynamic'; // ⬅️ از کش شدن جلوگیری می‌کند

export async function POST(req) {
  try {
    // بدنهٔ JSON را می‌خوانیم
    const { items, name = '' } = await req.json(); 
    
    console.log(`[create-invoice] Request received:`, { 
      name, 
      itemsCount: items?.length,
      sampleItem: items?.[0]
    });
    
    // اعتبارسنجی ساده
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log(`[create-invoice] Validation failed: items is empty or invalid`);
      return NextResponse.json(
        { error: 'لیست آیتم‌ها خالی است' },
        { status: 400 }
      );
    }

    // اتصال به پایگاه‌داده
    await dbConnect();

    // ایجاد فاکتور در وضعیت «pending»
    const invoiceData = {
      createdAt: new Date(), // ذخیره تاریخ به صورت Date برای سهولت کوئری
      legacyCreatedAt: persianNow(), // برای حفظ سازگاری با نمایش قبلی
      status: 'pending',
      items,
      name,   
    };
    
    console.log(`[create-invoice] Creating invoice with data:`, invoiceData);
    
    const doc = await Invoice.create(invoiceData);
    
    console.log(`[create-invoice] Invoice created successfully:`, { 
      _id: doc._id, 
      name: doc.name,
      itemsCount: doc.items.length,
      sampleItem: doc.items[0]
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