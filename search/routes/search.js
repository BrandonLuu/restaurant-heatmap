const express = require("express")
const router = express.Router()
const axios = require('axios');
const db = require("../public/mongoose.js");

router.use(logger);

// router.use(cors({origin: 'https://maps.googleapis.com'}));
let corsOption = {
    origin: 'https://maps.googleapis.com',
    optionsSuccessStatus: 200
}

router.get("/", (req, res) => {
    console.log(req.query.name)
    res.send(`API Info:
        https://maps.googleapis.com/maps/api/place/nearbysearch/output?parameters
        https://maps.googleapis.com/maps/api/place/nearbysearch/json
        ?keyword=cruise
        &location=-33.8670522%2C151.1957362
        &radius=1500
        &type=restaurant
        &key=YOUR_API_KEY`);
});

router.get("/new", (req, res) => {
    res.render("users");
    // res.send(`api ${req.params.id}`);
});

router.post("/", (req, res) => {
    const isValid = false
    if (isValid) {
        users.push({ firstName: req.body.firstName })
        res.redirect(`/users/${users.length - 1}`)
    } else {
        console.log("Error")
        res.render("users/new", { firstName: req.body.firstName })
    }
});

http://localhost:8081/search/location=-33.8670522%2C151.1957362&radius=1500&type=restaurant&key=AIzaSyA49c2e-kWx5zUhzHdNT7CwPYJ-ojvrtEs
https://search-dot-absolute-realm-165220.wl.r.appspot.com/search/location=-33.8670522%2C151.1957362&radius=1500&type=restaurant&key=AIzaSyA49c2e-kWx5zUhzHdNT7CwPYJ-ojvrtEs

router.get("/location=:location&radius=:radius&type=:type&key=:key", async (req, res) => {
    try {
        console.log("search")

        const loc = req.params.location.split(",");
        const lat = loc[0];
        const lng = loc[1];

        // Query DB 
        await db.connect()
        const result = await db.query(lat, lng, req.params.type);

        let returnResults;

        // Handle query results
        if (result.length) { // Results found in DB
            console.log("results found");
            returnResults = {results:result[0].locations};

        } else { // No results, query Maps
            console.log("no results, querying gmaps");

            const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${req.params.location}&radius=${req.params.radius}&type=${req.params.type}&key=${req.params.key}`);
            returnResults = response.data;

            await db.insert(lat, lng, req.params.type, response.data.results);
        }
        
        // Return JSON
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(returnResults);
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
    finally {
        await db.close();
    }
});

// router
//   .route("/:id")
//   .get((req, res) => {
//     console.log(req.user)
//     res.send(`Get User With ID ${req.params.id}`)
//   })
//   .put((req, res) => {
//     res.send(`Update User With ID ${req.params.id}`)
//   })
//   .delete((req, res) => {
//     res.send(`Delete User With ID ${req.params.id}`)
//   })

// const users = [{ name: "Kyle" }, { name: "Sally" }]
// router.param("id", (req, res, next, id) => {
//     req.user = users[id]
//     next()
// });

function logger(req, res, next) {
    console.log(req.originalUrl)
    next()
};

module.exports = router