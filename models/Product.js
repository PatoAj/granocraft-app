const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },

    imageUrl: {
        type: String,
        required: false,
        trim: true,
        default: 'https://via.placeholder.com/200/cccccc/000000?text=NoImage'
    },
    
    origin: { type: String, required: true },
    producerName: { type: String, required: false, trim: true, default: 'Productor no especificado' },
    roastLevel: { type: String, enum: ['Claro', 'Medio', 'Oscuro'], default: 'Medio' },
    stock: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

