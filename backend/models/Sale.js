import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  saleType: String,
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      productName: String,
      quantity: Number,
      price: Number
    }
  ],
  totalPrice: Number,
  paymentMethod: String,
  amountReceived: Number,
  date: {
  type: Date,
  default: Date.now
}

});

// Indexes to speed up common queries
saleSchema.index({ date: -1 });
saleSchema.index({ customerId: 1, date: -1 });
saleSchema.index({ paymentMethod: 1, date: -1 });
saleSchema.index({ saleType: 1, date: -1 });

export default mongoose.model('Sale', saleSchema);
