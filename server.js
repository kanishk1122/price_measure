const express = require("express");
const axios = require("axios");
const City = require("./models/citySchema");
const mongoose = require("mongoose");
const VehiclePricing = require("./models/vichleSchema");

const app = express();
app.use(express.json());

// OSRM API URL
const OSRM_API_URL = "https://router.project-osrm.org/route/v1/driving";

//
const NodeGeocoder = require("node-geocoder");

const geocoder = NodeGeocoder({
    provider: "openstreetmap", // Using OpenStreetMap
});


app.post("/api/check-price", async (req, res) => {
    const { fromCity, toCity, price , vehicleType } = req.body;

    // Input validation
    if (!fromCity || !toCity || price === undefined || price === null) {
        return res.status(400).json({ error: "Invalid payload" });
    }

    try {
        // Get coordinates for the "fromCity"
        const fromLocationgetfromdatbase = await City.findOne({ name: fromCity })  ;
        const fromLocation = fromLocationgetfromdatbase ? [{ latitude: fromLocationgetfromdatbase.latitude, longitude: fromLocationgetfromdatbase.longitude }] : await geocoder.geocode(fromCity);

        const { latitude: fromLat, longitude: fromLng } = fromLocation[0];

        // Get coordinates for the "toCity"
        const toLocationgetfromdatbase = await City.findOne({ name: toCity })  ;
        const toLocation = toLocationgetfromdatbase ? [{ latitude: toLocationgetfromdatbase.latitude, longitude: toLocationgetfromdatbase.longitude }] : await geocoder.geocode(toCity);

        const { latitude: toLat, longitude: toLng } = toLocation[0];

        // Fetch distance using OSRM API
        const osrmResponse = await axios.get(
            `${OSRM_API_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
        );

        if (!osrmResponse.data || !osrmResponse.data.routes || osrmResponse.data.routes.length === 0) {
            return res.status(404).json({ error: "No route found" });
        }

        const distance = osrmResponse.data.routes[0].distance / 1000; // Convert distance to km

        // Fetch the pricing details for the vehicle type in the "fromCity"
        const vehiclePricing = fromLocationgetfromdatbase ? await VehiclePricing.findOne({ city: fromLocationgetfromdatbase._id, type: vehicleType }) :  res.status(404).json({ error: `Pricing not found for vehicle type "${vehicleType}" in ${fromCity}` });
        // const vehiclePricing = await VehiclePricing.findOne({ city: fromCity, vehicleType });
        if (!vehiclePricing) {
            return res.status(404).json({ error: `Pricing not found for vehicle type "${vehicleType}" in ${fromCity}` });
        }

        const { baseAmount, baseKms, airportFee, amountPerHour, amountPerKm } = vehiclePricing;

        // Calculate the total price
        let totalPrice = price + airportFee;

        // Logic to determine if email is required based on distance, price, and airport fee
        let requiresEmail = false;

        // Check if the distance exceeds the baseKms, or if the total price is below baseAmount
        if (distance > baseKms || totalPrice < baseAmount) {
            requiresEmail = true;
        }

        // For distances greater than 1000 km, return message "Too far to offer ride"
        if (distance > 1000) {
            return res.status(200).json({ result: true, message: "Too far to offer ride" });
        }


        if (distance > 1000) {
            return res.status(200).json({ result: true, message: "Too far to offer ride" });
        }

        requiresEmail = distance > 30 || price < 50;

        return res.status(200).json({ result: requiresEmail });
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/price_measure", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});



const seedCities = async () => {
    const cities = [
        { name: "Berlin", latitude: 52.52, longitude: 13.405, flag: false },
        { name: "London", latitude: 51.5074, longitude: -0.1278, flag: true },
        { name: "Paris", latitude: 48.8566, longitude: 2.3522, flag: true },
        { name: "Barcelona", latitude: 41.3851, longitude: 2.1734, flag: false },
        { name: "Amsterdam", latitude: 52.3676, longitude: 4.9041, flag: false },
    ];

    
    await City.deleteMany({});
    await City.insertMany(cities);
};

const seedDatabase = async () => {
    try {
        // Seed cities first
        await seedCities().catch(err => {
            console.error("Error while seeding cities:", err.message);
        }
        );

        // Fetch all cities to get their IDs
        const cities = await City.find({});

        // Create a map of city names to their IDs
        const cityMap = {};
        cities.forEach(city => {
            cityMap[city.name] = city._id;
        });

        // Update vehicle pricing data with city IDs
        const vehiclePricingData = [
            { city: cityMap["London"], type: "Luxury", baseAmount: 89, baseKms: 10, airportFee: 0.1, amountPerHour: 135, amountPerKm: 2.5 },
            { city: cityMap["London"], type: "Comfort", baseAmount: 43, baseKms: 10, airportFee: 0.1, amountPerHour: 55, amountPerKm: 1.25 },
            { city: cityMap["London"], type: "Business Van", baseAmount: 70, baseKms: 10, airportFee: 0.1, amountPerHour: 75, amountPerKm: 1.7 },
            { city: cityMap["London"], type: "Mini Van", baseAmount: 55, baseKms: 10, airportFee: 0.1, amountPerHour: 60, amountPerKm: 1.35 },
            { city: cityMap["London"], type: "Business", baseAmount: 58, baseKms: 10, airportFee: 0.1, amountPerHour: 65, amountPerKm: 1.5 },
            { city: cityMap["London"], type: "Coach", baseAmount: 0, baseKms: 0, airportFee: 0, amountPerHour: 0, amountPerKm: 0 },
            { city: cityMap["London"], type: "Minibus", baseAmount: 0, baseKms: 0, airportFee: 0, amountPerHour: 0, amountPerKm: 0 },
            { city: cityMap["London"], type: "Economy", baseAmount: 39, baseKms: 10, airportFee: 0.1, amountPerHour: 50, amountPerKm: 1.15 }
        ];

        // Clear any existing vehicle pricing data
        await VehiclePricing.deleteMany({});

        // Insert new vehicle pricing data
        await VehiclePricing.insertMany(vehiclePricingData);
        console.log("Database seeded successfully");
    } catch (error) {
        console.error("Error while seeding database:", error.message);
    }
};



seedDatabase().catch(err => {
    console.error("Error while seeding database:", err.message);
});
