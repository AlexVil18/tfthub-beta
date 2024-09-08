// models/News.js
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String } // Opcional
}, {
    timestamps: true
});

module.exports = mongoose.model('News', newsSchema);
