// React imports are handled by the script tags in index.html
const { useState, useEffect } = React;

// Main App Component
const App = () => {
    const [selectedLocation, setSelectedLocation] = useState('Los Angeles'); // Set LA as default
    const [selectedType, setSelectedType] = useState('Restaurant');
    const [map, setMap] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [dots, setDots] = useState('');

    const isDev = false; // Set this to false in production
    const baseUrl = isDev ? 'http://localhost:8080' : '';

    // Predefined coordinates for each city
    const locationCoordinates = {
        'Los Angeles': { lat: 34.0522, lng: -118.2437 },
        'New York': { lat: 40.7128, lng: -74.0060 },
        'Tokyo': { lat: 35.6795, lng: 139.7700 },
        'Paris': { lat: 48.8566, lng: 2.3522 }
    };

    // Colors for different types
    const typeColors = {
        'Restaurant': '#FF0000', // Red
        'Bar': '#0000FF',        // Blue
        'Cafe': '#00FF00',       // Green
        'Bakery': '#FFA500'      // Orange
    };

    // Function to generate gradient based on selected type
    const getGradient = (type) => {
        return [
            'rgba(0, 0, 0, 0)',
            `rgba(${hexToRgb(typeColors[type])}, 0.5)`,
            `rgba(${hexToRgb(typeColors[type])}, 0.7)`,
            `rgba(${hexToRgb(typeColors[type])}, 0.9)`,
            `rgba(${hexToRgb(typeColors[type])}, 1)`
        ];
    };

    // Initialize Google Maps
    useEffect(() => {
        const mapInstance = new google.maps.Map(document.getElementById("map"), {
            center: locationCoordinates['Los Angeles'], // Use default location
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });

        // Initialize empty heatmap layer with reusable gradient
        const heatmapLayer = new google.maps.visualization.HeatmapLayer({
            map: mapInstance,
            radius: 30,
            gradient: getGradient(selectedType) // Use the reusable gradient function
        });

        setMap(mapInstance);
        setHeatmap(heatmapLayer);
    }, []);

    // Update map when location or type changes
    useEffect(() => {
        if (map && selectedLocation) {
            map.setCenter(locationCoordinates[selectedLocation]);
            fetchPlacesForHeatmap();
        }
    }, [selectedLocation, selectedType, map]);

    // Fetch places and update heatmap
    const fetchPlacesForHeatmap = async () => {
        if (!map || !heatmap) return;

        setIsLoading(true);
        setLoadingStatus('Checking cache in database');

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
                gradient: getGradient(selectedType)
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
                <h2 className="text-xl font-bold mb-4">Locations</h2>
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

                <h2 className="text-xl font-bold mb-4">Location Types</h2>
                <div className="grid grid-cols-2 gap-2">
                    {Object.keys(typeColors).map((type) => (
                        <button
                            key={type}
                            onClick={() => handleTypeClick(type)}
                            className={`py-2 px-4 rounded flex items-center justify-between ${selectedType === type
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                        >
                            <span>{type}</span>
                            <span
                                className="w-4 h-4 rounded-full ml-2"
                                style={{ backgroundColor: typeColors[type] }}
                            ></span>
                        </button>
                    ))}
                </div>

                <div className="mt-4">
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="font-bold mb-2">Heatmap Legend</h3>
                        <p className="text-sm mb-2">Higher density areas appear brighter.</p>
                        <div className="h-6 w-full rounded" style={{
                            background: `linear-gradient(to right, rgba(${hexToRgb(typeColors[selectedType])}, 0.1), rgba(${hexToRgb(typeColors[selectedType])}, 1))`
                        }}></div>
                        <div className="flex justify-between text-xs mt-1">
                            <span>Low density</span>
                            <span>High density</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="bg-gray-200 p-4 rounded">
                        <p className="font-bold">Selected Location:</p>
                        <p>{selectedLocation}</p>
                        <p className="font-bold mt-2">Selected Type:</p>
                        <p>{selectedType}</p>
                        {isLoading && (
                            <p className="mt-2 text-blue-600">{loadingStatus}{dots}</p>
                        )}
                    </div>
                    <p>Created by <a href="https://github.com/brandonluu" className="text-blue-600 dark:text-blue-500 hover:underline">Brandon Luu</a></p>
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
