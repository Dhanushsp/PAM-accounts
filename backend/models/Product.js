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

export default mongoose.model('Product', productSchema);
