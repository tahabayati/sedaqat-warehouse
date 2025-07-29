import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  barcode: String,
  quantity: Number,   // مورد نیاز
  collected: { type: Number, default: 0 }, // تاکنون جمع شده
  name: String,
  model: String,
  box_num: String,
});

const invoiceSchema = new mongoose.Schema(
  {
    createdAt: String,           // «۱۴۰۴/۰۵/۰۷ ۱۵:۲۳:۱۰»
    status: {                    // وضعیت جاری
      type: String,
      enum: ['pending', 'in-progress', 'done', 'skipped'],
      default: 'pending',
    },
    items: [itemSchema],
  },
  { collection: 'invoice' }
);

export default mongoose.models.Invoice ||
  mongoose.model('Invoice', invoiceSchema);
