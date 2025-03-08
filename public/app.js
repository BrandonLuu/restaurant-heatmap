// React imports are handled by the script tags in index.html
const { useState, useEffect } = React;

const isDev = false; // Set false to false in production
const baseUrl = isDev ? 'http://localhost:8080' : '';

// Predefined coordinates for each city
const locationCoordinates = {
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'Tokyo': { lat: 35.6795, lng: 139.7700 },
    'Paris': { lat: 48.8566, lng: 2.3522 }
};

// Colors for different types
const locationTypes = {
    'Restaurant': '#FF0000', // Red
    'Cafe': '#00FF00',       // Green
    'Bar': '#0000FF',        // Blue
    'Bakery': '#FFA500'      // Orange
};

// Function to generate a 'Jet' style gradient for the heatmap
const getGradient = () => {
    return [
        'rgba(0, 0, 255, 0)',   // Blue, transparent
        'rgba(0, 0, 255, 1)',   // Blue
        'rgba(0, 255, 255, 1)', // Cyan
        'rgba(0, 255, 0, 1)',   // Green
        'rgba(255, 255, 0, 1)', // Yellow
        'rgba(255, 0, 0, 1)'    // Red
    ];
};

// Main App Component
const App = () => {
    const [selectedLocation, setSelectedLocation] = useState('Los Angeles'); // Set LA as default
    const [selectedType, setSelectedType] = useState('Restaurant');
    const [map, setMap] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [dots, setDots] = useState('');

    // Initialize map when component mounts
    useEffect(() => {
        const initializeMap = async () => {
            // Request needed libraries.
            const { Map } = await google.maps.importLibrary("maps");
            const { HeatmapLayer } = await google.maps.importLibrary("visualization");

            // The map, centered at the default location
            const mapInstance = new Map(document.getElementById("map"), {
                center: locationCoordinates['Los Angeles'], // Use default location
                zoom: 13,
                mapId: "DEMO_MAP_ID",
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });

            // Initialize empty heatmap layer with reusable gradient
            const heatmapLayer = new HeatmapLayer({
                map: mapInstance,
                radius: 30,
                gradient: getGradient() // Use the reusable gradient function
            });

            setMap(mapInstance);
            setHeatmap(heatmapLayer);
        };
        initializeMap()
    }, []);

    // Update map when type changes without changing center
    useEffect(() => {
        if (map && selectedType) {
            fetchPlacesForHeatmap();
        }
    }, [selectedType, map]);

    // Update map when location or type changes
    useEffect(() => {
        if (map && selectedLocation) {
            map.setCenter(locationCoordinates[selectedLocation]);
            fetchPlacesForHeatmap();
        }
    }, [selectedLocation, map]);

    // Fetch places and update heatmap
    const fetchPlacesForHeatmap = async () => {
        if (!map || !heatmap) return;

        setIsLoading(true);
        setLoadingStatus('Loading data');

        // Start the dots animation
        const interval = setInterval(() => {
            setDots(prevDots => (prevDots.length < 3 ? prevDots + '.' : ''));
        }, 500);

        if (isDev) {
            console.log("baseUrl", baseUrl);
        }
        try {
            // Call the combined endpoint
            const response = await fetch(`${baseUrl}/api/places/${selectedLocation}/${selectedType}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error fetching data:', errorText);
                setLoadingStatus('Error fetching data');
                setIsLoading(false);
                clearInterval(interval); // Stop the dots animation
                return;
            }

            const { data: placesData } = await response.json();

            if (placesData.length > 0) {
                setLoadingStatus('Data loaded successfully');
            } else {
                setLoadingStatus('No data found');
            }

            // Convert data back to LatLng objects
            const heatmapData = placesData.map(place => ({
                location: new google.maps.LatLng(
                    place.location.lat,
                    place.location.lng
                ),
                weight: place.weight
            }));

            heatmap.setData(heatmapData);
            heatmap.setOptions({
                gradient: getGradient()
            });

            setIsLoading(false);
            clearInterval(interval); // Stop the dots animation

        } catch (error) {
            console.error('Error:', error);
            setLoadingStatus('Error occurred while fetching data');
            setIsLoading(false);
            clearInterval(interval); // Stop the dots animation
        }
    };

    // Helper function to convert hex color to RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) :
            '0,0,0';
    };

    // Handler for location button clicks
    const handleLocationClick = (location) => {
        setSelectedLocation(location);
    };

    // Handler for location type button clicks
    const handleTypeClick = (type) => {
        setSelectedType(type);
    };

    return (
        <div className="flex h-screen w-full">
            {/* Sidebar - 25% width */}
            <div className="w-1/4 bg-gray-100 p-4 flex flex-col shadow-md">
                <div className="mb-4">
                    <h2 className="text-xl font-bold mb-2">Heatmap Overview</h2>
                    <p className="text-md">This heatmap visualizes the density of selected location types (e.g., Restaurants, Cafes) in a 10 km × 10 km square in various cities.
                        The data is obtained through the <a href="https://developers.google.com/maps/documentation/places/web-service/search-nearby" className="text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Google Maps Nearby Search API</a>.
                        <br></br>
                        <br></br>
                        Use the buttons below to change the city and type of location displayed on the map. The heatmap will update to reflect the density of the selected type in the chosen city.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-4">City</h2>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {['Los Angeles', 'New York', 'Tokyo', 'Paris'].map((location) => (
                            <button
                                key={location}
                                onClick={() => handleLocationClick(location)}
                                className={`py-2 px-4 rounded ${selectedLocation === location
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                            >
                                {location}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-4">Location Type</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.keys(locationTypes).map((type) => (
                            <button
                                key={type}
                                onClick={() => handleTypeClick(type)}
                                className={`py-2 px-4 rounded text-center ${selectedType === type
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                            >
                                <span>{type}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {<div className="mt-4">
                    {isLoading && (
                        <p className="mt-2 text-blue-600">{loadingStatus}{dots}</p>
                    )}
                </div>}

                <div className="mt-auto">
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="font-bold mb-2">Heatmap Legend</h3>
                        <p className="text-sm mb-2">Higher density areas appear brighter.</p>
                        <div className="h-6 w-full rounded" style={{
                            background: 'linear-gradient(to right, rgba(0, 0, 255, 0), rgba(0, 0, 255, 1), rgba(0, 255, 255, 1), rgba(0, 255, 0, 1), rgba(255, 255, 0, 1), rgba(255, 0, 0, 1))'
                        }}></div>
                        <div className="flex justify-between text-xs mt-1">
                            <span>Low density</span>
                            <span>High density</span>
                        </div>
                    </div>
                </div>
                <div className="footer">
                    <p>Made with MERN + Tailwind by <a href="https://github.com/brandonluu" className="text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Brandon Luu</a></p>
                </div>

            </div>

            {/* Google Maps Container - 75% width */}
            <div className="w-3/4 h-full" id="map"></div>
        </div>
    );
};

// Render the App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
