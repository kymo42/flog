import { geolocation } from "geolocation";
import { me } from "appbit";

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
    // Always update callbacks FIRST, even if GPS already running
    gpsCallback = onPosition;
    gpsErrorCallback = onError;

    if (watchId !== null) {
        console.log("GPS already running - callbacks updated");
        return;
    }

    console.log("Starting GPS...");

    // Check if geolocation API is available
    if (!geolocation) {
        console.error("GPS: geolocation API not available on this device");
        if (gpsErrorCallback) gpsErrorCallback("GPS not available on this device");
        return;
    }

    // Check access_location permission
    try {
        if (me.permissions && !me.permissions.granted("access_location")) {
            console.error("GPS: access_location permission DENIED by OS");
            if (gpsErrorCallback) gpsErrorCallback("PERMISSION_DENIED");
            return;
        }
        console.log("GPS: permission OK, starting watchPosition");
    } catch (e) {
        console.log("GPS: permission check skipped -", e);
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
                // Error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
                const codeNames = { 1: "PERMISSION_DENIED", 2: "POSITION_UNAVAILABLE", 3: "TIMEOUT" };
                console.error(`GPS Error ${error.code} (${codeNames[error.code] || "UNKNOWN"}): ${error.message}`);

                // Reset watchId so GPS can be retried on next wrist-raise
                watchId = null;

                if (gpsErrorCallback) {
                    gpsErrorCallback(`${codeNames[error.code] || error.code}: ${error.message}`);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 120000,     // 2 minutes - give GPS ample time to acquire
                maximumAge: 60000    // Accept cached positions up to 60s old
            }
        );
        console.log("GPS: watchPosition started, watchId =", watchId);
    } catch (error) {
        console.error("GPS: Failed to start watchPosition:", error);
        if (gpsErrorCallback) gpsErrorCallback("Failed to start GPS");
    }
}

/**
 * Stop GPS tracking
 */
export function stopGPS() {
    if (watchId !== null) {
        geolocation.clearWatch(watchId);
        watchId = null;
        currentPosition = null;
        console.log("GPS stopped");
    }
}

/**
 * Get current GPS position
 */
export function getCurrentPosition() {
    return currentPosition;
}

/**
 * Check if GPS is active
 */
export function isGPSActive() {
    return watchId !== null;
}

/**
 * Get GPS accuracy status string
 */
export function getGPSStatus() {
    if (!currentPosition) return "Searching...";
    const accuracy = currentPosition.accuracy;
    if (accuracy < 10) return "Excellent";
    if (accuracy < 20) return "Good";
    if (accuracy < 50) return "Fair";
    return "Poor";
}
