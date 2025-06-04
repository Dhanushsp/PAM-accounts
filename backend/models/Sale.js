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

export default mongoose.model('Sale', saleSchema);
