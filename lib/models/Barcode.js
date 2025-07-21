import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    generatedAt: { type: Date, default: () => new Date() },
  },
  { collection: 'barcodes' }
);

export default mongoose.models.Barcode ||
  mongoose.model('Barcode', schema);
