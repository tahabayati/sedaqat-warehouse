import fs from 'fs/promises';
import path from 'path';
import bwipjs from 'bwip-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/* ---------- تنظیمات ثابت ---------- */
const FONT_PATH = path.join(process.cwd(), 'public', 'font', 'yekanbakh.TTF');
const WIDTH_MM = 100;
const HEIGHT_MM = 60;
const PLUS = { offset: 5, arm: 1.5, stroke: 0.6 };   // mm / pt

/* ---------- helpers ---------- */
async function fontBase64() {
  const bytes = await fs.readFile(FONT_PATH);
  return Buffer.from(bytes).toString('base64');
}

async function barcodePngB64(code) {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: code,
    scale: 6,               // کیفیت بالا
    includetext: true,
    textsize: 14,
    textyoffset: 8,
    backgroundcolor: 'FFFFFF',
    paddingwidth: 2,
    paddingheight: 2,
  });
  return Buffer.from(png).toString('base64');
}

function plus(x, y, { arm, stroke }) {
  const x1 = x - arm, x2 = x + arm;
  const y1 = y - arm, y2 = y + arm;
  return `
    <line x1="${x1}mm" y1="${y}mm" x2="${x2}mm" y2="${y}mm"
          stroke="black" stroke-width="${stroke}"/>
    <line x1="${x}mm" y1="${y1}mm" x2="${x}mm" y2="${y2}mm"
          stroke="black" stroke-width="${stroke}"/>
  `;
}

// Function to split text into RTL and LTR parts for proper rendering
function splitTextForRendering(text) {
  if (!text) return '';
  
  // Split text by dimensions pattern (e.g., "50×60", "60×50")
  const dimensionPattern = /(\d+[×xX]\d+)/g;
  const parts = text.split(dimensionPattern);
  
  let result = '';
  parts.forEach((part, index) => {
    if (dimensionPattern.test(part)) {
      // This is a dimension - render as LTR to preserve number order
      result += `<tspan class="ltr-text">${part}</tspan>`;
    } else if (part.trim()) {
      // This is regular text - render as RTL
      result += `<tspan class="rtl-text">${part}</tspan>`;
    }
  });
  
  return result || text;
}

/* ---------- GET handler ---------- */
// /api/barcode-label?code=112...&name=آتلانتیک&model=کروم&carton=0|1
export async function GET(req) {
   const p = req.nextUrl.searchParams;
   const code  = p.get('code')?.trim();
   const name  = p.get('name')?.trim() || '';
   const model = p.get('model')?.trim() || '';
   const isCarton = p.get('carton') === '1';
 
   if (!/^[0-9]{13}$/.test(code))
     return NextResponse.json({ error: 'bad code' }, { status: 400 });
 
   try {
     const [font64, png64] = await Promise.all([fontBase64(), barcodePngB64(code)]);

     const svg = `
 <svg xmlns="http://www.w3.org/2000/svg"
      width="100mm" height="60mm" viewBox="0 0 100 60">
   <defs>
     <style>
       @font-face{
         font-family:'yekanbakh';
         src:url(data:font/ttf;base64,${font64}) format('truetype');
       }
       text{
         font-family:'yekanbakh';
         text-align: center;
       }
       .rtl-text {
         direction: rtl;
         unicode-bidi: bidi-override;
       }
       .ltr-text {
         direction: ltr;
         unicode-bidi: normal;
       }
     </style>
   </defs>
 
   <rect width="100%" height="100%" fill="#ffffff"/>
 
   <!-- متن‌های بالا -->
   <text x="50" y="12" font-size="5pt" font-weight="bold"
         text-anchor="middle">
     ${isCarton ? 'کارتن ' : ''}${splitTextForRendering(name)}
   </text>
   ${model ? `
   <text x="50" y="21" font-size="5pt" font-weight="bold"
         text-anchor="middle">
         ${splitTextForRendering(model)}
   </text>` : ''}
 
   <!-- بارکد -->
   <image href="data:image/png;base64,${png64}"
          x="5" y="25" width="90" height="27"/>
 
   <!-- نام برند پایین -->
   <text x="50" y="55" font-size="3pt"
         text-anchor="middle"
         class="rtl-text">
     هیبرید بیستون
   </text>
 </svg>`;
 
     return NextResponse.json({ svg });
   } catch (e) {
     console.error(e);
     return NextResponse.json({ error: 'server' }, { status: 500 });
   }
 }
 