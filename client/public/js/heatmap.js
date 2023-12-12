//firebase emulators:start; npm test
import axios from 'axios';
import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

console.log("Heatmap Logging Start")

let map;
let infowindow;
let heatmap;
let searchDataMap = new Map();
let userTags = new Set();
let mapCenter;

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

    // check user's tags against current tags
    // if new tags: search iterate thru new tags
    // if del tags: delete tags or remove from displaying
    for (const tag of userTags) {
        console.log("searching: ", tag)
        searchForTagLocation(center, tag);
    }
}

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
}

// collects all heatmap tag datapoints into a single array for display
function processHeatmapData() {
    let searchTags = new Set(searchDataMap.keys());

    // set equality helper method
    const eqSet = (xs, ys) =>
        xs.size === ys.size &&
        [...xs].every((x) => ys.has(x));
    
    // error checking
    if (!eqSet(userTags, searchTags)) {
        console.log("unmatched: user:", userTags, " search:", searchTags);
        return;
    }

    // collect all datapoints into array and setData()
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

window.initMap = initMap;

const ButtonGroup = () => {
    // Function for Button 1 click
    const handleButton1Click = () => {
        console.log('Button 1 clicked!');
        toggleHeatmap();
    };

    // Function for Button 2 click
    const handleButton2Click = () => {
        console.log('Button 2 clicked!');
        changeGradient();
    };

    // Function for Button 3 click
    const handleButton3Click = () => {
        console.log('Button 3 clicked!');
        changeRadius();
    };

    // Function for Button 4 click
    const handleButton4Click = () => {
        console.log('Button 4 clicked!');
        changeOpacity();
    };

    return (
        <div>
            {/* Buttons with individual onClick handlers */}
            <button onClick={handleButton1Click}>Toggle Heatmap</button>
            <button onClick={handleButton2Click}>Change gradient</button>
            <button onClick={handleButton3Click}>Change radius</button>
            <button onClick={handleButton4Click}>Change opacity</button>
        </div>
    );
};

const CheckboxGroup = () => {
    // State to hold checkbox values
    const [checkboxValues, setCheckboxValues] = useState({
        restaurant: false,
        bakery: false,
        cafe: false,
        bar: false,
    });

    // Function to handle checkbox change
    const handleCheckboxChange = (checkboxName) => {
        setCheckboxValues((prevValues) => ({
            ...prevValues,
            [checkboxName]: !prevValues[checkboxName],
        }));

        // You can perform additional actions here based on the checkbox value
        // console.log(`Checkbox ${checkboxName} toggled! New value: ${!checkboxValues[checkboxName]}`);        
    };

    // Function to handle button click
    const handleButtonClick = () => {
        // Print checkbox values
        console.log('Checkbox Values:', checkboxValues);

        // Using Object.entries()
        Object.entries(checkboxValues).forEach(([checkbox, value]) => {
            // console.log(`Checkbox ${checkbox} is ${value ? 'checked' : 'unchecked'}`);
            if (value) {
                userTags.add(checkbox);
            } else {
                userTags.delete(checkbox);
                searchDataMap.delete(checkbox);
            }
        });

        console.log(userTags);
        updateHeatmap();
    };

    return (
        <div>
            {/* Checkboxes with onChange event */}
            <label>
                <input
                    type="checkbox"
                    checked={checkboxValues.restaurant}
                    onChange={() => handleCheckboxChange('restaurant')}
                />
                restaurant
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={checkboxValues.bakery}
                    onChange={() => handleCheckboxChange('bakery')}
                />
                bakery
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={checkboxValues.cafe}
                    onChange={() => handleCheckboxChange('cafe')}
                />
                cafe
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={checkboxValues.bar}
                    onChange={() => handleCheckboxChange('bar')}
                />
                bar
            </label>

            {/* Button to print checkbox values */}
            <button onClick={handleButtonClick}>Update</button>

            {/* Display the checkbox values
            <p>
                Checkbox Values:{' '}
                {Object.keys(checkboxValues)
                    .map((checkbox) => `${checkbox}: ${checkboxValues[checkbox] ? 'checked' : 'unchecked'}`)
                    .join(', ')}
            </p> */}
        </div>
    );
};

// Clear the existing HTML content
// document.body.innerHTML = '<div id="app"></div>';

// Render your React component instead
const root = createRoot(document.getElementById('root'));
// root.render(<h1>Hello, world</h1>);

root.render(
    <StrictMode>
        <ButtonGroup />
        <CheckboxGroup />
    </StrictMode>
);