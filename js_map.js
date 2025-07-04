// js_map.js
let map = null;
const mapContainer = document.getElementById('map-container');

function initializeMap() {
    if (map || !mapContainer) return; // Don't re-initialize

    // Get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map = L.map('map-container').setView([latitude, longitude], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Add a marker for the user's location
            L.marker([latitude, longitude]).addTo(map)
                .bindPopup('You are here.')
                .openPopup();

            loadSellersOnMap();

        }, () => {
            // Handle error or user denying location
            // Default to a fallback location
            map = L.map('map-container').setView([20.5937, 78.9629], 5); // Fallback to center of India
             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            alert("Could not get your location. Showing all sellers.");
            loadSellersOnMap();
        });
    }
}

async function loadSellersOnMap() {
    if (!map) return;
    showLoader();
    try {
        // Fetch sellers who have location data
        const { data: sellers, error } = await supabase
            .from('profiles')
            .select('id, shop_name, latitude, longitude')
            .eq('user_type', 'Seller')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

        if (error) throw error;

        sellers.forEach(seller => {
            L.marker([seller.latitude, seller.longitude]).addTo(map)
                .bindPopup(`<b>${seller.shop_name}</b><br><a href="#">View Menu</a>`);
        });

    } catch (error) {
        console.error("Error loading sellers on map:", error);
    } finally {
        hideLoader();
    }
}
// Note: For this to work, you need to add latitude and longitude columns to your `profiles` table.
// Run this in your Supabase SQL Editor:
// ALTER TABLE public.profiles ADD COLUMN latitude NUMERIC;
// ALTER TABLE public.profiles ADD COLUMN longitude NUMERIC;
