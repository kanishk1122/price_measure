const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
    name: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    flag: { type: Boolean, default: false }, // City flag to determine email requirement
});

const City = mongoose.model("City", citySchema);

module.exports = City;
