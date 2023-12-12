const mongoose = require('mongoose');

const db = "restaurant"
const uri = `mongodb+srv://admin:Tyfg8k3OaOMGxZ23@cluster0.bv3rotn.mongodb.net/${db}?retryWrites=true&w=majority`;

// Model
// const planetSchema = new mongoose.Schema({
//     name: { type: String, reqconnectuired: true },
//     orderFromSun: { type: Number, required: true },
//     hasRings: { type: Boolean, default: false },
//     mainAtmosphere: { type: [String], default: [] },
//     surfaceTemperatureC: {
//         min: { type: Number, required: true },
//         max: { type: Number, required: true },
//         mean: { type: Number, required: true }
//     }
// });
// const Planet = mongoose.model('planets', planetSchema);

const restaurantSchema = new mongoose.Schema({
    center: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    type: { type: String, required: true },
    locations: []
    // locations: {
    //     type: [{
    //         lat: { type: Number, required: true },
    //         lng: { type: Number, required: true }
    //     }],
    //     default: []
    // }
});
const Restaurant = mongoose.model('restaurants', restaurantSchema);

async function connect() {
    // Connect the client to the server	(optional starting in v4.7)
    await mongoose.connect(uri);
    // Send a ping to confirm a successful connection
    if (mongoose.connection.readyState) {
        console.log("Connected to MongoDB");
    } else {
        console.log("NO CONNECTION");
    }
}

// Query
async function query(lat, lng, tag) {
    console.log("MongoDB query:", lat, lng, tag);
    const results = await Restaurant.find({ "center.lat": lat, "center.lng": lng , "type": tag});

    // if (!results.length) {
        // console.log("empty, inserting test data")
        // === INSERT ===
        // Restaurant.create({
        //     center: { lat: -33.333, lng: -64.444 },
        //     type: "restaurant",
        //     locations: [{ lat: -33.333, lng: -64.444 }]
        // });
        // insert(-33.333, -64.444, tag, [{ lat: -33.333, lng: -64.444 }]);
    // }
    console.log("MongoDB query results:\n", results);    
    return results
}

async function insert(lat, lng, type, results){
    console.log("MongoDB inserting", lat, lng, type, results);
    await Restaurant.create({
        center: { lat: lat, lng: lng },
        type: type,
        locations: results
    });
}

async function close() {
    console.log("Disconnected to MongoDB");
    await mongoose.connection.close();
}

async function run() {
    try {
        await connect();
        
        const lat = -33.8670522;
        const lng = 151.1957362;
        const type = "restaurant"
        
        // query test
        const results = await query(lat, lng, type);
        // console.log(results[0].locations);

        // insert test
        const stuff = [ {
            business_status: 'OPERATIONAL',
            geometry: { location: [Object], viewport: [Object] },
            icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
            icon_background_color: '#FF9E67',
            icon_mask_base_uri: 'https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet',
            name: 'The Malaya',
            opening_hours: { open_now: false },
            photos: [ [Object] ],
            place_id: 'ChIJ4U8HhjiuEmsRyevJVTxWbFo',
            plus_code: {
              compound_code: '46J2+VM Sydney NSW, Australia',
              global_code: '4RRH46J2+VM'
            },
            price_level: 3,
            rating: 4.5,
            reference: 'ChIJ4U8HhjiuEmsRyevJVTxWbFo',
            scope: 'GOOGLE',
            types: [ 'restaurant', 'food', 'point_of_interest', 'establishment' ],
            user_ratings_total: 1626,
            vicinity: '39 Lime Street, Sydney'
          },   {
            business_status: 'OPERATIONAL',
            geometry: { location: [Object], viewport: [Object] },
            icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png',
            icon_background_color: '#FF9E67',
            icon_mask_base_uri: 'https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet',
            name: 'The Malaya',
            opening_hours: { open_now: false },
            photos: [ [Object] ],
            place_id: 'ChIJ4U8HhjiuEmsRyevJVTxWbFo',
            plus_code: {
              compound_code: '46J2+VM Sydney NSW, Australia',
              global_code: '4RRH46J2+VM'
            },
            price_level: 3,
            rating: 4.5,
            reference: 'ChIJ4U8HhjiuEmsRyevJVTxWbFo',
            scope: 'GOOGLE',
            types: [ 'restaurant', 'food', 'point_of_interest', 'establishment' ],
            user_ratings_total: 1626,
            vicinity: '39 Lime Street, Sydney'
          }];
        // await insert(-33.333, -64.444, "restaurant", stuff);

    } finally {
        await close();
    }
}

// run().catch(console.dir);

module.exports = {
    connect,
    query,
    insert,
    close
}