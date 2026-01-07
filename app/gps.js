import { geolocation } from "geolocation";
import { me as device } from "device";

let watchId = null;
let currentPosition = null;
let gpsCallback = null;
let gpsErrorCallback = null;

/**
 * Start GPS tracking
 * @param {Function} onPosition - Callback for position updates
 * @param {Function} onError - Callback for errors
 */
export function startGPS(onPosition, onError) {
    gpsCallback = onPosition;
    gpsErrorCallback = onError;

    if (watchId !== null) {
        console.log("GPS already running");
        return;
    }

    console.log("Starting GPS...");

    // Check if geolocation is available
    if (!geolocation) {
        if (gpsErrorCallback) {
            gpsErrorCallback("GPS not available on this device");
        }
        return;
    }

    try {
        watchId = geolocation.watchPosition(
            (position) => {
                currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                console.log(`GPS: ${currentPosition.latitude}, ${currentPosition.longitude} (±${currentPosition.accuracy}m)`);

                if (gpsCallback) {
                    gpsCallback(currentPosition);
                }
            },
            (error) => {
                console.error("GPS Error:", error.code, error.message);
                if (gpsErrorCallback) {
                    gpsErrorCallback(error.message);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 60000, // 60 seconds
                maximumAge: 5000 // 5 seconds
            }
        );
    } catch (error) {
        console.error("Failed to start GPS:", error);
        if (gpsErrorCallback) {
            gpsErrorCallback("Failed to start GPS");
        }
    }
}

/**
 * Stop GPS tracking
 */
export function stopGPS() {
    if (watchId !== null) {
        geolocation.clearWatch(watchId);
        watchId = null;
        console.log("GPS stopped");
    }
}

/**
 * Get current GPS position
 * @returns {Object|null} Current position or null
 */
export function getCurrentPosition() {
    return currentPosition;
}

/**
 * Check if GPS is active
 * @returns {boolean} True if GPS is running
 */
export function isGPSActive() {
    return watchId !== null;
}

/**
 * Get GPS accuracy status
 * @returns {string} Status message
 */
export function getGPSStatus() {
    if (!currentPosition) {
        return "Searching...";
    }

    const accuracy = currentPosition.accuracy;
    if (accuracy < 10) {
        return "Excellent";
    } else if (accuracy < 20) {
        return "Good";
    } else if (accuracy < 50) {
        return "Fair";
    } else {
        return "Poor";
    }
}
