    const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['producer', 'admin'],
        default: 'producer',
    },
    
    producerNamePublic: {
        type: String, 
        trim: true,
        default: 'Productor Anónimo'
    },
    bio: { // Pequeña descripción pública
        type: String, 
        trim: true,
        default: ''
    },
    contact: { // Datos dinámicos de contacto
        whatsapp: { type: String, trim: true },
        instagram: { type: String, trim: true },
        facebook: { type: String, trim: true },
        showEmail: { type: Boolean, default: false }
    },
    // ---  FOTO DE PERFIL/LOGO ---
    profileImage: { 
        type: String, 
        trim: true 
    },
    
    // ---  GALERÍA (CARRUSEL) ---
    galleryImages: [{
        type: String,
        trim: true
    }],
    
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

    const User = mongoose.model('User', userSchema);

    module.exports = User;