const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    type: { type: String, required: true }, // e.g., Luxury, Comfort
    baseAmount: { type: Number, required: true },
    baseKms: { type: Number, required: true },
    amountPerHour: { type: Number, required: true },
    amountPerKm: { type: Number, required: true },
    airportFees: { type: Number, default: 0 },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
});


module.exports = mongoose.model("Vehicle", vehicleSchema);
