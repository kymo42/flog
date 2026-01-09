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
    // return courses.find(c => c.id === id) || null;
    for (let i = 0; i < courses.length; i++) {
        if (courses[i].id === id) {
            return courses[i];
        }
    }
    return null;
}

/**
 * Update a hole's data in a specific course
 * @param {string} courseId 
 * @param {number} holeNumber 
 * @param {Object} data 
 */
export function updateHole(courseId, holeNumber, data) {
    try {
        // 1. Load
        let courses;
        try {
            courses = loadCourses();
            if (!courses) throw new Error("Courses list is null");
        } catch (e) {
            console.error("STORAGE: loadCourses fail", e);
            throw e; // Rethrow to main handler
        }

        // 2. Find Course
        let courseIndex;
        try {
            // Manual loop instead of findIndex to test function availability
            // const courseIndex = courses.findIndex(c => c.id === courseId);
            courseIndex = -1;
            for (let i = 0; i < courses.length; i++) {
                if (courses[i].id === courseId) {
                    courseIndex = i;
                    break;
                }
            }
        } catch (e) {
            console.error("STORAGE: inner loop fail", e);
            throw e;
        }

        if (courseIndex !== -1) {
            // 3. Find Hole
            try {
                const holes = courses[courseIndex].holes;
                let holeIndex = -1;
                for (let j = 0; j < holes.length; j++) {
                    if (holes[j].number === holeNumber) {
                        holeIndex = j;
                        break;
                    }
                }

                if (holeIndex !== -1) {
                    // 4. Update
                    courses[courseIndex].holes[holeIndex] = {
                        ...courses[courseIndex].holes[holeIndex],
                        ...data
                    };

                    // 5. Save
                    saveCourses(courses);
                }
            } catch (e) {
                console.error("STORAGE: Hole update/save fail", e);
                throw e;
            }
        } else {
            // Course not found, no action needed
        }
    } catch (outerErr) {
        console.error("STORAGE: Outer Error", outerErr);
        throw outerErr; // Ensure it bubbles up to main handler
    }

}

