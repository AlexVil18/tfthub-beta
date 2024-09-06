const mongoose = require('mongoose');

const composSchema = new mongoose.Schema({
    title: String,
    category: String,
    summary: String,
    image: String,
    createdAt: { type: Date, default: Date.now }
});

const Compos = mongoose.model('Compos', composSchema);

module.exports = Compos;
