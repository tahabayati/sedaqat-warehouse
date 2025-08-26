import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    box_num: String,
    model: String,
    box_code: String,
    name: String,
    single_num: { type: Number, default: 1 },
  },
  { collection: 'barcodes' }
);
export default mongoose.models.Barcode || mongoose.model('Barcode', schema);
