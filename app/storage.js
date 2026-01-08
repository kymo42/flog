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
        useYards: false,
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
    const course = {
        id: Date.now().toString(),
        name: name,
        holes: [],
        createdAt: Date.now(),
        lastPlayed: null
    };

    // Initialize 18 holes
    for (let i = 1; i <= 18; i++) {
        course.holes.push(createHole(i));
    }

    // Save it
    const courses = loadCourses();
    courses.push(course);
    saveCourses(courses);

    return course;
}

/**
 * Create a new hole
 * @param {number} number - Hole number (1-18)
 * @returns {Object} New hole object
 */
export function createHole(number) {
    return {
        number: number,
        latitude: null, // Using simplified coordinate names
        longitude: null,
        par: 4
    };
}

/**
 * Load a single course by ID
 * @param {string} id 
 * @returns {Object|null}
 */
export function loadCourse(id) {
    const courses = loadCourses();
    return courses.find(c => c.id === id) || null;
}

/**
 * Update a hole's data in a specific course
 * @param {string} courseId 
 * @param {number} holeNumber 
 * @param {Object} data 
 */
export function updateHole(courseId, holeNumber, data) {
    const courses = loadCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);

    if (courseIndex !== -1) {
        const holeIndex = courses[courseIndex].holes.findIndex(h => h.number === holeNumber);
        if (holeIndex !== -1) {
            courses[courseIndex].holes[holeIndex] = {
                ...courses[courseIndex].holes[holeIndex],
                ...data
            };
            saveCourses(courses);
        }
    }
}

