//firebase emulators:start; npm run build; npm run dev
import axios from 'axios';
import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTheme } from '@mui/material/styles';

console.log("Heatmap Logging Start")

let map;
let infowindow;
let heatmap;
let searchDataMap = new Map();
let userTags = new Set();
let mapCenter;

// function linkUI() {
//     document
//         .getElementById("toggle-heatmap")
//         .addEventListener("click", toggleHeatmap);
//     document
//         .getElementById("change-gradient")
//         .addEventListener("click", toggeGradient);
//     document
//         .getElementById("change-opacity")
//         .addEventListener("click", toggleOpacity);
//     document
//         .getElementById("change-radius")
//         .addEventListener("click", toggeRadius);
//     document
//         .getElementById("update-heatmap")
//         .addEventListener("click", updateHeatmap);
// }

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

    // linkUI();
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

function updateHeatmap(tag) {
    //temp
    let center = mapCenter;

    // old code for searching up multiple tags
    // check user's tags against current tags
    // if new tags: search iterate thru new tags
    // if del tags: delete tags or remove from displaying
    // for (const tag of userTags) {
    //     console.log("searching: ", tag)
    //     searchForTagLocation(center, tag);
    // }
    searchForTagLocation(center, tag);
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
    })
        .then((response) => {
            // console.log(response.status);
            // console.log(response.data);
            const dataPoints = [];
            for (let i = 0; i < response.data.results.length; i++) {
                console.log(`%c${response.data.results[i].name}: %clat: ${response.data.results[i].geometry.location.lat} lng: ${response.data.results[i].geometry.location.lng}`,
                    "color:red", "color:green");
                // console.log(response.data.results[i].name);

                // const gMapLatLng = new google.maps.LatLng(response.data.results[i].geometry.location.lat, response.data.results[i].geometry.location.lng);
                dataPoints.push(new google.maps.LatLng(
                    response.data.results[i].geometry.location.lat,
                    response.data.results[i].geometry.location.lng));
            }

            // Collect datapoints into tag:data[]
            // map.setCenter(dataPoints[0].location);
            // searchDataMap.set(tag, dataPoints);
            // processHeatmapData();
            heatmap.setData(dataPoints);

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

function toggeGradient() {
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

function toggeRadius() {
    heatmap.set("radius", heatmap.get("radius") ? null : 20);
}

function toggleOpacity() {
    heatmap.set("opacity", heatmap.get("opacity") ? null : 0.2);
}

// const ButtonGroup = () => {

//     const handleButtonClick = (buttonName) => () => {
//         switch (buttonName) {
//             case "heatmap":
//                 toggleHeatmap();
//                 break;
//             case "radius":
//                 toggeRadius();
//                 break;
//             case "gradient":
//                 toggeGradient();
//                 break;
//             case "opacity":
//                 toggleOpacity();
//                 break;
//         }
//         console.log(`${buttonName} pressed`);
//     };

//     return (
//         <Stack spacing={1} direction="row">
//             {/* Buttons with individual onClick handlers */}
//             <Button variant="contained" onClick={handleButtonClick('heatmap')}>Toggle Heatmap</Button>
//             <Button variant="contained" onClick={handleButtonClick('radius')}>Change radius</Button>
//             <Button variant="contained" onClick={handleButtonClick('gradient')}>Change gradient</Button>
//             <Button variant="contained" onClick={handleButtonClick('opacity')}>Change opacity</Button>
//         </Stack>
//     );
// };


const CenterToggleButtonGroup = () => {
    const theme = useTheme();
    const [selectedButton, setSelectedButton] = useState("SanJose");

    const handleToggleButtonChange = (event, newButton) => {
        if (newButton !== null) {
            setSelectedButton(newButton);
        }
        console.log(`${newButton} pressed`);
    };

    return (
        <FormControl>
            <FormLabel id="tag-center-toggle" color="success" focused>2. Map Center</FormLabel>
            <ToggleButtonGroup
                value={selectedButton}
                exclusive
                onChange={handleToggleButtonChange}
                aria-label="City buttons group"
                color='success'
            >
                <ToggleButton value="SanJose" aria-label="San Jose">San Jose</ToggleButton>
                <ToggleButton value="NewYork" aria-label="New York">New York</ToggleButton>
                <ToggleButton value="Paris" aria-label="Paris">Paris</ToggleButton>
                <ToggleButton value="Tokyo" aria-label="Tokyo">Tokyo</ToggleButton>
            </ToggleButtonGroup>
        </FormControl>
    );
};


// const RadioButtonsGroup = () => {
//     // State to hold the selected radio button value
//     const [selectedOption, setSelectedOption] = useState('');

//     // Function to handle radio button change
//     const handleRadioChange = (event) => {
//         const value = event.target.value;
//         setSelectedOption(value);

//         // You can perform additional actions here based on the selected value
//         console.log(`%cSelected option: ${value}`, 'font-weight:bold');

//         updateHeatmap(value);
//     };

//     return (
//         <FormControl>
//             <FormLabel id="tag-row-radio-button-group-label">1. Location Type</FormLabel>
//             <RadioGroup
//                 row
//                 aria-labelledby="tag-row-radio-button-group-label"
//                 name="row-radio-buttons-group"
//             >
//                 <FormControlLabel
//                     value="restaurant"
//                     control={<Radio />}
//                     onChange={handleRadioChange}
//                     label="Restaurant" />

//                 <FormControlLabel
//                     value="bakery"
//                     control={<Radio />}
//                     onChange={handleRadioChange}
//                     label="Bakery" />

//                 <FormControlLabel
//                     value="cafe"
//                     control={<Radio />}
//                     onChange={handleRadioChange}
//                     label="Cafe" />

//                 <FormControlLabel
//                     value="bar"
//                     control={<Radio />}
//                     onChange={handleRadioChange}
//                     label="Bar" />

//             </RadioGroup>
//         </FormControl>
//     );
// }

const LocationToggleButtonsGroup = () => {
    // State to hold the selected toggle button value
    const [selectedOption, setSelectedOption] = useState('');

    // Function to handle toggle button change
    const handleToggleChange = (event, newOption) => {
        setSelectedOption(newOption);

        // You can perform additional actions here based on the selected value
        console.log(`Selected option: ${newOption}`);

        updateHeatmap(newOption);
    };

    return (
        <FormControl>
            <FormLabel id="tag-row-toggle-button-group-label" color="primary" focused>1. Location Type</FormLabel>
            <ToggleButtonGroup
                value={selectedOption}
                exclusive
                onChange={handleToggleChange}
                aria-labelledby="tag-row-toggle-button-group-label"
                name="row-toggle-buttons-group"
                color='primary'
            >
                <ToggleButton value="restaurant" aria-label="Restaurant">
                    Restaurant
                </ToggleButton>

                <ToggleButton value="bakery" aria-label="Bakery">
                    Bakery
                </ToggleButton>

                <ToggleButton value="cafe" aria-label="Cafe">
                    Cafe
                </ToggleButton>

                <ToggleButton value="bar" aria-label="Bar">
                    Bar
                </ToggleButton>
            </ToggleButtonGroup>
        </FormControl>
    );
};
const SwitchGroup = () => {
    const [switchStates, setSwitchStates] = useState({
        heatmap: true,
        radius: false,
        gradient: false,
        opacity: false,
    });

    const handleSwitchChange = (name) => (event) => {
        setSwitchStates({ ...switchStates, [name]: event.target.checked });

        // Print the status of the clicked switch
        switch (name) {
            case "heatmap":
                toggleHeatmap();
                break;
            case "radius":
                toggeRadius();
                break;
            case "gradient":
                toggeGradient();
                break;
            case "opacity":
                toggleOpacity();
                break;
        }
        console.log(`${name} Switch: ${event.target.checked ? 'ON' : 'OFF'}`);
    };

    return (
        <FormGroup row>
            <FormControlLabel
                control={<Switch checked={switchStates.heatmap} onChange={handleSwitchChange('heatmap')} />}
                label="Heatmap"
            />
            <FormControlLabel
                control={<Switch checked={switchStates.radius} onChange={handleSwitchChange('radius')} />}
                label="Radius"
            />
            <FormControlLabel
                control={<Switch checked={switchStates.gradient} onChange={handleSwitchChange('gradient')} />}
                label="Gradient"
            />
            <FormControlLabel
                control={<Switch checked={switchStates.opacity} onChange={handleSwitchChange('opacity')} />}
                label="Opacity"
            />
        </FormGroup>
    );
};

const root = createRoot(document.getElementById('root'));
// root.render(<h1>Hello, world</h1>);

root.render(
    <StrictMode>
        <h3>Select a <em>Location Type</em> to display heatmap</h3>
        <Stack spacing={2} direction="row">
            <LocationToggleButtonsGroup />
            <CenterToggleButtonGroup />
        </Stack>

        <SwitchGroup />
        <p />
    </StrictMode>
);

window.initMap = initMap;
