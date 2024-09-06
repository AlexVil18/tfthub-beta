const mongoose = require('mongoose');

// Define el esquema para las noticias
const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true // Asegura que el título sea requerido
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, // Referencia al modelo de Category
        ref: 'Category',
        required: true // Asegura que la categoría sea requerida
    },
    summary: {
        type: String,
        required: true // Asegura que el resumen sea requerido
    },
    image: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now // Establece la fecha de creación por defecto
    }
});

// Crea el modelo de News basado en el esquema
const News = mongoose.model('News', newsSchema);

module.exports = News;
