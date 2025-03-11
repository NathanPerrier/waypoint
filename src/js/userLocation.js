export async function getUserLocation() {
    if (navigator.geolocation) {
        return navigator.geolocation.getCurrentPosition((position) => {
            return {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
        }
        );
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}
