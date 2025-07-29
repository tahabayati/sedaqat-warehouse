import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    box_num: String,
    model: String,
    name: String,
  },
  { collection: 'barcodes' }
);
export default mongoose.models.Barcode || mongoose.model('Barcode', schema);
