import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  
  barcode: String,
  quantity: Number,   // مورد نیاز
  collected: { type: Number, default: 0 }, // تاکنون جمع شده
  name: String,
  model: String,
  box_num: String,
  box_code: String,
});

const invoiceSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    createdAt: {
      type: Date,        // ذخیره به صورت تاریخ میلادی
      default: Date.now
    },
    legacyCreatedAt: String, // برای حفظ سازگاری با تاریخ‌های قبلی
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'done', 'skipped'],
      default: 'pending',
    },
    
    items: [itemSchema],
  },
  { collection: 'invoices' }
);

// برای حفظ سازگاری با نسخه‌های قبلی 
// اگر createdAt به صورت رشته در دیتابیس ذخیره شده بود، آن را تبدیل می‌کنیم
invoiceSchema.pre('find', function(next) {
  this.lean(true);
  next();
});

invoiceSchema.post('find', function(docs) {
  if (!docs) return;
  
  docs.forEach(doc => {
    // اگر createdAt رشته بود، به legacyCreatedAt منتقل می‌کنیم
    if (doc.createdAt && typeof doc.createdAt === 'string') {
      doc.legacyCreatedAt = doc.createdAt;
    }
  });
});

export default mongoose.models.Invoice ||
  mongoose.model('Invoice', invoiceSchema);