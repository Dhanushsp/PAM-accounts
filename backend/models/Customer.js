import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  credit: { type: Number, required: true },
  date: { type: Date, default: Date.now },
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

export default mongoose.model('Customer', customerSchema);
