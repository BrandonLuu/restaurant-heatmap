//firebase emulators:start; npm test
// import axios from 'axios';
// import react from 'react-dom';
// import "@babel/register";

console.log("Heatmap Logging Start")

let thingsRef;
let unsubscribe;
let map;
let service;
let infowindow;
let heatmap;
let searchDataMap = new Map();
let userTags = new Set();
let mapCenter;


// // Clear the existing HTML content
// document.body.innerHTML = '<div id="app"></div>';

// // // Render your React component instead
// const root = createRoot(document.getElementById('app'));
// root.render(<h1>Hello, world</h1>);

function linkUI() {
    document
        .getElementById("toggle-heatmap")
        .addEventListener("click", toggleHeatmap);
    document
        .getElementById("change-gradient")
        .addEventListener("click", changeGradient);
    document
        .getElementById("change-opacity")
        .addEventListener("click", changeOpacity);
    document
        .getElementById("change-radius")
        .addEventListener("click", changeRadius);
    document
        .getElementById("update-heatmap")
        .addEventListener("click", updateHeatmap);
}

function initMap() {
    // const sydney = new google.maps.LatLng(-33.867, 151.195);
    setCenter();

    infowindow = new google.maps.InfoWindow();
    map = new google.maps.Map(document.getElementById("map"), {
        center: mapCenter,
        zoom: 14,
    });

    heatmap = new google.maps.visualization.HeatmapLayer({
        map: map,
    });

    linkUI();
}

function setCenter() {
    mapCenter = new google.maps.LatLng(-33.8670522, 151.1957362); //sydney
}

function getCenter() {
    return mapCenter;
}

function getUserCheckbox() {
    let foodTags = document.getElementById("foodTagForm");

    for (let i = 0; i < foodTags.length; i++) {
        if (foodTags[i].checked) {
            userTags.add(foodTags[i].value);
        } else {
            userTags.delete(foodTags[i].value);
            searchDataMap.delete(foodTags[i].value);
        }
    }
}

function updateHeatmap() {
    //temp
    let center = mapCenter;

    // read user checkbox data tags
    getUserCheckbox();

    // check user's tags against current tags
    // if new tags: search iterate thru new tags
    // if del tags: delete tags or remove from displaying
    for (const tag of userTags) {
        console.log("searching: ", tag)
        searchForTagLocation(center, tag);
    }

    // update heatmap with new data
    // console.log(userTags);
    //processHeatmapData();
}

/*
Example results:
{
  geometry: {
    location: { ... },
    viewport: { ... }
  },
  html_attributions: [],
  icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/geocode-71.png",
  icon_background_color: "#7B9EB0",
  icon_mask_base_uri: "https://maps.gstatic.com/mapfiles/place_api/icons/v2/generic_pinlet",
  name: "Sydney",
  photos: [{
  getUrl: (...g)=>Gfb(f,e.width,...g),
  height: 2922,
  html_attributions: ["&lt;a href=\&quot;https://maps.google.com/maps/contrib/103312383445637053560\&quot;&gt;Elena Gallo&lt;/a&gt;"],
  width: 4344
}],
  place_id: "ChIJP3Sa8ziYEmsRUKgyFmh9AQM",
  reference: "ChIJP3Sa8ziYEmsRUKgyFmh9AQM",
  scope: "GOOGLE",
  types: ["colloquial_area", "locality", "political"],
  vicinity: "Sydney"
}
types:
cafe, restaurant, bakery, 

amusement_park	activity
aquarium	activity
art_gallery	activity
bowling_alley	activity
movie_theater	activity
museum	activity
night_club	activity
park	activity
tourist_attraction	activity
zoo	activity
*/

function searchForTagLocation(center, tag) {
    var req = {
        location: center,
        radius: '1600', //1600:1, 4900:2, 8000:5
        type: [tag]
    };
    const key = "AIzaSyA49c2e-kWx5zUhzHdNT7CwPYJ-ojvrtEs";
    // const requestLocation = "-33.8670522%2C151.1957362";
    const requestLocation = `${req.location.lat()}%2C${req.location.lng()}`;
    // console.log(requestLocation);



    // Search using Custom Endpoint
    // axios.get(`https://localhost:8081/search/location=${requestLocation}&radius=${req.radius}&type=${req.type}&key=${key}`, {
    axios.get(`https://search-dot-absolute-realm-165220.wl.r.appspot.com/search/location=${requestLocation}&radius=${req.radius}&type=${req.type}&key=${key}`, {
        // headers: {
        //     'Access-Control-Allow-Origin': '*',
        // }
    })
        .then((response) => {
            // console.log(response.status);
            // console.log(response.data);
            const dataPoints = [];
            for (let i = 0; i < response.data.results.length; i++) {
                console.log(response.data.results[i].geometry.location);
                // const gMapLatLng = new google.maps.LatLng(response.data.results[i].geometry.location.lat, response.data.results[i].geometry.location.lng);
                dataPoints.push(new google.maps.LatLng(
                    response.data.results[i].geometry.location.lat,
                    response.data.results[i].geometry.location.lng));
            }
            // map.setCenter(dataPoints[0].location);
            searchDataMap.set(tag, dataPoints);
            processHeatmapData();
        })
        .catch((error) => {
            console.log(error);
        })

    // === NearbySearch using Google Maps API ===
    // service = new google.maps.places.PlacesService(map);
    // service.nearbySearch(req, (results, status) => {
    //     if (status !== google.maps.places.PlacesServiceStatus.OK || !results) return;
    //     const dataPoints = [];
    //     for (let i = 0; i < results.length; i++) {
    //         // createMarker(results[i]);
    //         console.log(results[i].geometry.location.toString());
    //         dataPoints.push(results[i].geometry.location);
    //     }
    //     // map.setCenter(results[0].geometry.location);
    //     searchDataMap.set(tag, dataPoints);
    //     processHeatmapData();
    // });
}

// collects all heatmap tag datapoints into a single array for display
function processHeatmapData() {
    let searchTags = new Set(searchDataMap.keys());

    const eqSet = (xs, ys) =>
        xs.size === ys.size &&
        [...xs].every((x) => ys.has(x));

    if (!eqSet(userTags, searchTags)) {
        console.log("unmatched: user:", userTags, " search:", searchTags);
        return;
    }

    let heatMapData = [];

    for (let val of searchDataMap.values()) {
        heatMapData = heatMapData.concat(val);
    }

    heatmap.setData(heatMapData);
    console.log("data: ", heatMapData.length);
}


function toggleHeatmap() {
    heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
    const gradient = [
        "rgba(0, 255, 255, 0)",
        "rgba(0, 255, 255, 1)",
        "rgba(0, 191, 255, 1)",
        "rgba(0, 127, 255, 1)",
        "rgba(0, 63, 255, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(0, 0, 223, 1)",
        "rgba(0, 0, 191, 1)",
        "rgba(0, 0, 159, 1)",
        "rgba(0, 0, 127, 1)",
        "rgba(63, 0, 91, 1)",
        "rgba(127, 0, 63, 1)",
        "rgba(191, 0, 31, 1)",
        "rgba(255, 0, 0, 1)",
    ];

    heatmap.set("gradient", heatmap.get("gradient") ? null : gradient);
}

function changeRadius() {
    heatmap.set("radius", heatmap.get("radius") ? null : 20);
}

function changeOpacity() {
    heatmap.set("opacity", heatmap.get("opacity") ? null : 0.2);
}

function createMarker(place) {
    if (!place.geometry || !place.geometry.location) return;

    const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
    });

    google.maps.event.addListener(marker, "click", () => {
        infowindow.setContent(place.name || "");
        infowindow.open(map);
    });
}

// auth.onAuthStateChanged(user => {
//     if (user) {
//         // signed in
//         whenSignedIn.hidden = false;
//         whenSignedOut.hidden = true;
//         userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3> <p>User ID: ${user.uid}</p>`;

//         // Database Reference
//         thingsRef = db.collection('things')

//         createThing.onclick = () => {

//             const { serverTimestamp } = firebase.firestore.FieldValue;
//             const fakeName = faker.commerce.productName()
//             thingsRef.add({
//                 uid: user.uid,
//                 name: fakeName,
//                 createdAt: serverTimestamp()
//             });
//             console.log(fakeName)
//         }

//         unsubscribe = thingsRef.where('uid', '==', user.uid)
//             .onSnapshot(querySnapshot => {
//                 // Map results to an array of li elements
//                 const items = querySnapshot.docs.map(doc => {
//                     return `<li>${doc.data().name}</li>`
//                 });
//                 thingsList.innerHTML = items.join('');
//             });

//     } else {
//         // not signed in
//         whenSignedIn.hidden = true;
//         whenSignedOut.hidden = false;
//         userDetails.innerHTML = '';

//         // Unsubscribe when the user signs out
//         unsubscribe && unsubscribe();
//     }
// });


window.initMap = initMap;