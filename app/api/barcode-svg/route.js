import { NextResponse } from 'next/server';
import bwipjs from 'bwip-js';

export const dynamic = 'force-dynamic'; // بدلیل SVG

export async function GET(req) {
  const code = req.nextUrl.searchParams.get('code');
  if (!/^[0-9]{13}$/.test(code))
    return NextResponse.json({ error: 'bad code' }, { status: 400 });

  try {
    const svg = bwipjs.toSVG({
      bcid: 'code128',          // نوع بارکد
      text: code,               // داده
      scale: 3,
      includetext: true,
      textxalign: 'center',
      textsize: 12,
      paddingwidth: 6,
      paddingheight: 6,
      backgroundcolor: 'FFFFFF',
      monochrome: true,
    });
    return NextResponse.json({ svg });
  } catch (e) {
    return NextResponse.json({ error: 'bwip error' }, { status: 500 });
  }
}


