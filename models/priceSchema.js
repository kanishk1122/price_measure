const pricingSchema = new mongoose.Schema({
    city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    price: { type: Number, required: true }, // Total price calculated
});

module.exports = mongoose.model("Pricing", pricingSchema);
