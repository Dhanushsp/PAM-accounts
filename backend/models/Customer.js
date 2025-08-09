import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  credit: { type: Number, required: true },
  joinDate: { type: Date, default: Date.now },
  lastPurchase: { type: Date, default: Date.now },
  // History of standalone payments received (outside of specific sale updates)
  payments: [
    {
      amount: { type: Number, required: true },
      otherAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
      description: { type: String, default: 'Amount received' },
      date: { type: Date, default: Date.now },
    }
  ],
  sales: [
    {
      saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
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

    }
  ]
});

// Indexes for faster lookups and sorting
customerSchema.index({ name: 1 });
customerSchema.index({ contact: 1 });
customerSchema.index({ lastPurchase: -1 });
customerSchema.index({ credit: -1 });

export default mongoose.model('Customer', customerSchema);
