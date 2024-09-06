const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    detalles: {
        type: String,
        required: true
    },
    videoURL: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Guide', guideSchema);
