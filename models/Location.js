// GranoCraft/models/Location.js

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        unique: false
    },
    locationName: { 
        type: String,
        required: [true, 'El nombre de la Finca/Café es obligatorio.'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'La dirección es obligatoria.'],
        trim: true
    },
    schedule: {
        type: String,
        required: false,
        default: 'Consultar horarios'
    },
    specialty: {
        type: String,
        required: false,
        default: 'Café de especialidad'
    },
    latitude: {
        type: Number,
        required: [true, 'La latitud es obligatoria (selecciona en el mapa).'] 
    },
    longitude: {
        type: Number,
        required: [true, 'La longitud es obligatoria (selecciona en el mapa).'] 
    },
    imageUrl: {
        type: String,
        required: false, 
        trim: true
    }
}, {
    timestamps: true
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;