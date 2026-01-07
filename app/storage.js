import * as fs from "fs";

const COURSES_FILE = "courses.cbor";
const SETTINGS_FILE = "settings.cbor";
const CURRENT_ROUND_FILE = "current_round.cbor";

/**
 * Save courses to file storage
 * @param {Array} courses - Array of course objects
 */
export function saveCourses(courses) {
    try {
        fs.writeFileSync(COURSES_FILE, courses, "cbor");
    } catch (error) {
        console.error("Error saving courses:", error);
    }
}

/**
 * Load courses from file storage
 * @returns {Array} Array of course objects
 */
export function loadCourses() {
    try {
        return fs.readFileSync(COURSES_FILE, "cbor") || [];
    } catch (error) {
        console.log("No courses found, starting fresh");
        return [];
    }
}

/**
 * Save user settings
 * @param {Object} settings - Settings object
 */
export function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, settings, "cbor");
    } catch (error) {
        console.error("Error saving settings:", error);
    }
}

/**
 * Load user settings
 * @returns {Object} Settings object with defaults
 */
export function loadSettings() {
    try {
        const settings = fs.readFileSync(SETTINGS_FILE, "cbor");
        return settings || getDefaultSettings();
    } catch (error) {
        return getDefaultSettings();
    }
}

/**
 * Get default settings
 * @returns {Object} Default settings
 */
function getDefaultSettings() {
    return {
        useYards: true,
        gpsAccuracy: "high",
        vibrationEnabled: true,
        autoAdvanceHole: false
    };
}

/**
 * Save current round data
 * @param {Object} roundData - Current round information
 */
export function saveCurrentRound(roundData) {
    try {
        fs.writeFileSync(CURRENT_ROUND_FILE, roundData, "cbor");
    } catch (error) {
        console.error("Error saving round:", error);
    }
}

/**
 * Load current round data
 * @returns {Object|null} Current round data or null
 */
export function loadCurrentRound() {
    try {
        return fs.readFileSync(CURRENT_ROUND_FILE, "cbor");
    } catch (error) {
        return null;
    }
}

/**
 * Clear current round
 */
export function clearCurrentRound() {
    try {
        fs.unlinkSync(CURRENT_ROUND_FILE);
    } catch (error) {
        // File doesn't exist, that's fine
    }
}

/**
 * Create a new course
 * @param {string} name - Course name
 * @returns {Object} New course object
 */
export function createCourse(name) {
    return {
        id: Date.now().toString(),
        name: name,
        holes: [],
        createdAt: Date.now(),
        lastPlayed: null
    };
}

/**
 * Create a new hole
 * @param {number} number - Hole number (1-18)
 * @returns {Object} New hole object
 */
export function createHole(number) {
    return {
        number: number,
        tee: null,
        front: null,
        middle: null,
        back: null,
        hazards: [],
        par: 4
    };
}
