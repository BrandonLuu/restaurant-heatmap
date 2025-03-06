const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

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

// Function to fetch places data with pagination
const fetchPlacesData = async (location, type) => {
    const locationCoordinates = {
        'Los Angeles': '34.0522,-118.2437',
        'New York': '40.7128,-74.0060',
        'Tokyo': '35.6795,139.7700',
        'Paris': '48.8566,2.3522'
    };

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    let placesData = [];
    let nextPageToken = null;
    let totalResults = 0;
    const maxResults = 60; // Limit to 60 results

    do {
        const response = await axios.get(url, {
            params: {
                location: locationCoordinates[location],
                radius: '5000',
                type: type.toLowerCase(),
                key: process.env.GOOGLE_MAPS_API_KEY,
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

        placesData.push(...results);
        totalResults += results.length;

        nextPageToken = response.data.next_page_token;

        // Google Maps API requires a short delay before requesting the next page
        if (nextPageToken && totalResults < maxResults) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        console.log("nextPageToken", nextPageToken);
        console.log("Total results:", totalResults);
    } while (nextPageToken && totalResults < maxResults);
    return placesData;
};

// Combined endpoint for cache and Google Maps API
app.get('/api/places/:location/:type', async (req, res) => {
    try {
        const { location, type } = req.params;

        // Check if the cache entry exists
        const cachedData = await Place.findOne({ location, type });

        if (cachedData) {
            return res.json({ data: cachedData.data });
        }

        console.log("Fetching data from Google Maps API");
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

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});