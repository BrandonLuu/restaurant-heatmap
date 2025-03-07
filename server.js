const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// For populate data
const populateData = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection using environment variable
mongoose.connect(process.env.MONGODB_URI);

// MongoDB Schema
const placeSchema = new mongoose.Schema({
    location: String,
    type: String,
    data: Array,
    timestamp: { type: Date, default: Date.now }
});

const Place = mongoose.model('Place', placeSchema);

// Centralized locations data
const locationCoordinates = {
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Tokyo': { lat: 35.6795, lng: 139.7700 },
    'Paris': { lat: 48.8566, lng: 2.3522 }
};

const isDev = false; // Set false to false in production

const apiKey = isDev ? process.env.GOOGLE_MAPS_API_KEY_LOCAL : process.env.GOOGLE_MAPS_API_KEY;

// Function to fetch places data with pagination
const fetchPlacesData = async (location, type) => {
    const [centerLat, centerLng] = [locationCoordinates[location].lat, locationCoordinates[location].lng];

    // Generate search points in a grid pattern around the center
    const generateSearchPoints = (centerLat, centerLng, radius) => {
        const points = [];
        const offset = (radius / 111320) / 2; // Adjust offset for 50% coverage

        for (let i = -2; i <= 2; i++) { // Increase range to ensure coverage
            for (let j = -2; j <= 2; j++) {
                points.push({
                    lat: centerLat + (i * offset),
                    lng: centerLng + (j * offset * Math.cos(centerLat * Math.PI / 180))
                });
            }
        }
        return points;
    };

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    let placesData = new Set(); // Use Set to avoid duplicates
    const maxResultsPerPoint = 60; // Max results Google Maps API allows per point
    const searchRadius = 2000; // Reduced radius for better coverage

    const searchPoints = generateSearchPoints(centerLat, centerLng, 5000);

    // Search from each point
    for (const point of searchPoints) {
        let nextPageToken = null;
        let pointResults = 0;

        do {
            const response = await axios.get(url, {
                params: {
                    location: `${point.lat},${point.lng}`,
                    radius: searchRadius.toString(),
                    type: type.toLowerCase(),
                    key: apiKey,
                    pagetoken: nextPageToken
                }
            });

            const results = response.data.results.map(place => ({
                location: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                },
                weight: place.rating || 1
            }));

            // Add results to Set using stringified version for deduplication
            results.forEach(result => {
                placesData.add(JSON.stringify(result));
            });
            pointResults += results.length;

            nextPageToken = response.data.next_page_token;

            if (nextPageToken && pointResults < maxResultsPerPoint) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            if (isDev) {
                console.log(`Search point (${point.lat}, ${point.lng}): ${pointResults} results`);
            }
        } while (nextPageToken && pointResults < maxResultsPerPoint);
    }

    // Convert Set back to array of objects
    return Array.from(placesData).map(item => JSON.parse(item));
};

// Combined endpoint for cache and Google Maps API
app.get('/api/places/:location/:type', async (req, res) => {
    try {
        const { location, type } = req.params;

        // Check if the cache entry exists
        const cachedData = await Place.findOne({ location, type });
        // const cachedData = NaN;

        if (cachedData) {
            return res.json({ data: cachedData.data });
        }

        if (isDev) {
            console.log("Fetching data from Google Maps API");
        }
        // If no cache, fetch from Google Maps API with pagination
        const placesData = await fetchPlacesData(location, type);

        // Create new cache entry
        await Place.create({
            location,
            type,
            data: placesData,
            timestamp: new Date()
        });

        res.json({ data: placesData });
    } catch (error) {
        console.error('Error handling places request:', error);
        res.status(500).json({ error: 'Failed to fetch places data' });
    }
});

// Function to preload data in the database for all locations and types
const loadDatabaseData = async () => {
    const locations = Object.keys(locationCoordinates);
    const types = ['Restaurant', 'Bar', 'Cafe', 'Bakery'];

    for (const location of locations) {
        for (const type of types) {
            let cachedData = await Place.findOne({ location, type });
            if (cachedData) {
                if (isDev) {
                    console.log(`Data for ${location} - ${type} is loaded in the database.`);
                }
            } else {
                if (isDev) {
                    console.log(`Data for ${location} - ${type} is missing in the database. Fetching data...`);
                }
                try {
                    const placesData = await fetchPlacesData(location, type);
                    await Place.create({
                        location,
                        type,
                        data: placesData,
                        timestamp: new Date()
                    });
                    if (isDev) {
                        console.log(`Data for ${location} - ${type} has been fetched and stored.`);
                    }
                } catch (error) {
                    console.error(`Failed to fetch data for ${location} - ${type}:`, error);
                }
            }
        }
    }
};

// Call the preload function
if (populateData) {
    loadDatabaseData();
}

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    if (isDev) {
        console.log(`Server is running on port ${PORT}`);
    }
});