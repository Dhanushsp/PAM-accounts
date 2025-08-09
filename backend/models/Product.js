import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        default: ''
    },
    pricePerPack: {
        type: Number,
        default: 0
    },
    kgsPerPack: {
        type: Number,
        default: 0
    },
    pricePerKg: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index commonly queried field
productSchema.index({ productName: 1 });

export default mongoose.model('Product', productSchema);
