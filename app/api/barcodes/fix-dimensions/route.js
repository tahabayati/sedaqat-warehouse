import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Barcode from '../../../../lib/models/Barcode';

export async function POST(req) {
  try {
    const { barcode, correctedName, correctedModel } = await req.json();
    
    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      );
    }
    
    if (!correctedName && !correctedModel) {
      return NextResponse.json(
        { error: 'At least one field (name or model) must be provided' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Find the barcode record
    const barcodeDoc = await Barcode.findOne({ code: barcode });
    if (!barcodeDoc) {
      return NextResponse.json(
        { error: 'Barcode not found' },
        { status: 404 }
      );
    }

    // Update the product fields
    const updates = {};
    const oldValues = {};
    
    if (correctedName) {
      oldValues.oldName = barcodeDoc.name;
      barcodeDoc.name = correctedName;
      updates.name = correctedName;
    }
    
    if (correctedModel) {
      oldValues.oldModel = barcodeDoc.model;
      barcodeDoc.model = correctedModel;
      updates.model = correctedModel;
    }
    
    await barcodeDoc.save();

    console.log(`[FIX_DIMENSIONS] Updated product: ${barcode}`);
    if (correctedName) {
      console.log(`   Old name: "${oldValues.oldName}" -> New name: "${correctedName}"`);
    }
    if (correctedModel) {
      console.log(`   Old model: "${oldValues.oldModel}" -> New model: "${correctedModel}"`);
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      updates,
      oldValues
    });

  } catch (error) {
    console.error('Error fixing dimensions:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to find products with potential dimension issues
export async function GET(req) {
  try {
    const { limit = 50 } = req.nextUrl.searchParams;
    
    await dbConnect();
    
    // Find products with dimensions that might be incorrect
    const barcodes = await Barcode.find({
      name: { $regex: /\d{1,2}[×xX]\d{1,2}/ }
    })
    .limit(parseInt(limit))
    .select('code name model')
    .lean();

    const issues = [];
    
    for (const barcode of barcodes) {
      // Check if dimensions look suspicious (both numbers < 20)
      const dimensionMatch = barcode.name.match(/(\d{1,2})[×xX](\d{1,2})/);
      if (dimensionMatch) {
        const num1 = parseInt(dimensionMatch[1], 10);
        const num2 = parseInt(dimensionMatch[2], 10);
        
        if (num1 < 20 && num2 < 20) {
          issues.push({
            code: barcode.code,
            name: barcode.name,
            model: barcode.model,
            dimensions: dimensionMatch[0],
            mightBeReversed: true
          });
        }
      }
    }

    return NextResponse.json({
      issues,
      total: issues.length,
      message: 'Products with potential dimension issues found'
    });

  } catch (error) {
    console.error('Error finding dimension issues:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
