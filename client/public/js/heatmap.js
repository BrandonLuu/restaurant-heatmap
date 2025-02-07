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
let currTag;

function initMap() {
    //Default center Los Angeles
    // [34.0522, -118.2437]
    mapCenter = new google.maps.LatLng(34.0522, -118.2437);

    infowindow = new google.maps.InfoWindow();
    map = new google.maps.Map(document.getElementById("map"), {
        center: mapCenter,
        zoom: 13,
    });

    heatmap = new google.maps.visualization.HeatmapLayer({
        map: map,
        radius: 20
    });

}

function setCenter(center) {
    let lat, lng;

    switch (center) {
        case "LosAngeles":
            [lat, lng] = [34.0522, -118.2437]
            break;
        case "NewYork":
            [lat, lng] = [40.7128, -74.0060];
            break;
        case "Paris":
            [lat, lng] = [48.8566, 2.3522];
            break;
        case "Tokyo":
            [lat, lng] = [35.6795, 139.7700];
            break;
        default: //sydney
            [lat, lng] = [34.0522, -118.2437];
    }

    console.log("Selected center:", center, lat, lng);
    mapCenter = new google.maps.LatLng(lat, lng);
    map.setCenter(mapCenter);
    heatmap.setMap(map);

    // mapCenter = new google.maps.LatLng(-33.8670522, 151.1957362); //sydney
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
    const requestLocation = `${req.location.lat()}%2C${req.location.lng()}`;

    // Search using Custom Endpoint
    // axios.get(`http://localhost:8081/search/location=${requestLocation}&radius=${req.radius}&type=${req.type}&key=${key}`, {
    axios.get(`https://search-dot-absolute-realm-165220.wl.r.appspot.com/search/location=${requestLocation}&radius=${req.radius}&type=${req.type}&key=${key}`, {
    })
        .then((response) => {
            const dataPoints = [];
            for (let i = 0; i < response.data.results.length; i++) {
                console.log(`%c${response.data.results[i].name}: %clat: ${response.data.results[i].geometry.location.lat} lng: ${response.data.results[i].geometry.location.lng}`,
                    "color:red", "color:green");
                // console.log(response.data.results[i].name);

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

function toggleGradient() {
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

function toggleRadius() {
    heatmap.set("radius", heatmap.get("radius") ? null : 20);
}

function toggleOpacity() {
    heatmap.set("opacity", heatmap.get("opacity") ? null : 0.2);
}

const LocationToggleButtonsGroup = () => {
    // State to hold the selected toggle button value
    const [selectedOption, setSelectedOption] = useState('');

    // Function to handle toggle button change
    const handleToggleChange = (event, newTag) => {
        if (newTag !== null) {
            setSelectedOption(newTag);
            currTag = newTag
            updateHeatmap(currTag);
        }
        // You can perform additional actions here based on the selected value
        console.log(`Selected option: ${newTag}`);
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
                <ToggleButton value="restaurant" aria-label="Restaurant">Restaurant</ToggleButton>
                <ToggleButton value="bakery" aria-label="Bakery">Bakery</ToggleButton>
                <ToggleButton value="cafe" aria-label="Cafe">Cafe</ToggleButton>
                <ToggleButton value="bar" aria-label="Bar">Bar</ToggleButton>
            </ToggleButtonGroup>
        </FormControl>
    );
};

const CenterToggleButtonGroup = () => {
    const theme = useTheme();
    const [selectedButton, setSelectedButton] = useState("LosAngeles");

    const handleToggleButtonChange = (event, city) => {
        if (city !== null) {
            setSelectedButton(city);
            setCenter(city);
            updateHeatmap(currTag);
        }
        console.log(`${city} pressed`);
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
                <ToggleButton value="LosAngeles" aria-label="Los Angeles">Los Angeles</ToggleButton>
                <ToggleButton value="NewYork" aria-label="New York">New York</ToggleButton>
                <ToggleButton value="Paris" aria-label="Paris">Paris</ToggleButton>
                <ToggleButton value="Tokyo" aria-label="Tokyo">Tokyo</ToggleButton>
            </ToggleButtonGroup>
        </FormControl>
    );
};


const SwitchGroup = () => {
    const [switchStates, setSwitchStates] = useState({
        heatmap: true,
        radius: true,
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
                toggleRadius();
                break;
            case "gradient":
                toggleGradient();
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


window.mobileCheck = function () {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

const MobileDesktopHandler = () => {
    // Call the mobileCheck function to determine the device type
    const isMobile = window.mobileCheck();

    return (
        <div>
            {isMobile ? (
                <StrictMode>
                    <Stack spacing={2}>
                        <LocationToggleButtonsGroup />
                        <CenterToggleButtonGroup />
                    </Stack>
                    <SwitchGroup />
                    <p />
                </StrictMode>
            ) : (
                <StrictMode>
                    <Stack spacing={2} direction="row">
                        <LocationToggleButtonsGroup />
                        <CenterToggleButtonGroup />
                    </Stack>
                    <SwitchGroup />
                    <p />
                </StrictMode>
            )}
        </div>
    );
};


root.render(
    <MobileDesktopHandler />
);

window.initMap = initMap;
