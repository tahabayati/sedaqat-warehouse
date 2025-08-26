import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Barcode from '../../../../lib/models/Barcode';

export async function GET(req) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const barcode = url.searchParams.get('barcode')?.trim();
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
  }

  await dbConnect();
  
  let query = {};
  let sort = {};
  
  // Build query based on search type
  if (barcode) {
    // Search by exact barcode
    if (!/^[0-9]{13}$/.test(barcode)) {
      return NextResponse.json({ error: 'Invalid barcode format' }, { status: 400 });
    }
    query.code = barcode;
  } else if (q && q.length >= 2) {
    // Search by product name (existing functionality)
    const regex = new RegExp(q, 'i');
    query.name = regex;
  }
  
      try {
      // Get total count for pagination
      const total = await Barcode.countDocuments(query);
      
      // Get paginated results with priority sorting
      const skip = (page - 1) * limit;
      let docs = await Barcode.find(query)
        .select('code box_code box_num name model single_num')
        .lean();
      
      // Sort by priority: products with names first, then by name alphabetically
      docs.sort((a, b) => {
        const aHasName = a.name && a.name.trim() !== '';
        const bHasName = b.name && b.name.trim() !== '';
        
        // First priority: products with names come before those without
        if (aHasName && !bHasName) return -1;
        if (!aHasName && bHasName) return 1;
        
        // If both have names, sort alphabetically
        if (aHasName && bHasName) {
          return a.name.localeCompare(b.name);
        }
        
        // If neither has name, sort by code
        return a.code.localeCompare(b.code);
      });
      
      // Apply pagination after sorting
      docs = docs.slice(skip, skip + limit);

    return NextResponse.json({ 
      results: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
