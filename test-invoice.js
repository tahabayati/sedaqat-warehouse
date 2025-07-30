// Test file to debug invoice creation
import dbConnect from './lib/mongodb.js';
import Invoice from './lib/models/Invoice.js';
import { persianNow } from './lib/persianNow.js';

async function testInvoiceCreation() {
  try {
    await dbConnect();
    
    const testItems = [
      {
        barcode: "1410622069641",
        quantity: 7,
        collected: 0,
        name: "راموند شيري كروم",
        model: "روشويي ثابت",
        box_num: "4",
        box_code: "TEST_BOX_001" // این فیلد باید اضافه شود
      }
    ];
    
    const invoiceData = {
      createdAt: persianNow(),
      status: 'pending',
      items: testItems,
      name: 'تست لاگ'
    };
    
    console.log('Creating test invoice with data:', JSON.stringify(invoiceData, null, 2));
    
    const doc = await Invoice.create(invoiceData);
    
    console.log('Invoice created successfully:', {
      _id: doc._id,
      name: doc.name,
      itemsCount: doc.items.length,
      items: doc.items
    });
    
    // Check if box_code exists in the created document
    const createdDoc = await Invoice.findById(doc._id);
    console.log('Retrieved document:', JSON.stringify(createdDoc.toObject(), null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testInvoiceCreation(); 