import * as fs from "fs";

const COURSES_FILE = "courses.cbor";
const COURSES_BACKUP = "courses_backup.cbor";
const SETTINGS_FILE = "settings.cbor";
const CURRENT_ROUND_FILE = "current_round.cbor";
const GPS_CACHE_FILE = "gps_cache.cbor";

/**
 * Validate course data structure
 */
function validateCourse(course) {
    if (!course || !course.id || !course.holes) return false;
    if (!Array.isArray(course.holes) || course.holes.length !== 18) return false;
    return true;
}

/**
 * Validate courses array
 */
function validateCourses(courses) {
    if (!Array.isArray(courses) || courses.length === 0) return false;
    return courses.every(c => validateCourse(c));
}

/**
 * Save courses to file storage with backup
 * @param {Array} courses - Array of course objects
 * @returns {boolean} - Success status
 */
export function saveCourses(courses) {
    try {
        // Validate data before saving
        if (!validateCourses(courses)) {
            console.error("Invalid courses data - not saving");
            return false;
        }

        // Save to main file
        fs.writeFileSync(COURSES_FILE, courses, "cbor");

        // Save backup copy
        fs.writeFileSync(COURSES_BACKUP, courses, "cbor");

        console.log(`Saved ${courses.length} courses with backup`);
        return true;
    } catch (error) {
        console.error("Error saving courses:", error);
        return false;
    }
}

/**
 * Initialize 4 fixed courses with 18 holes each
 */
function initializeFixedCourses() {
    const courses = [];

    for (let courseNum = 1; courseNum <= 4; courseNum++) {
        const holes = [];
        for (let holeNum = 1; holeNum <= 18; holeNum++) {
            holes.push({
                number: holeNum,
                latitude: null,
                longitude: null
            });
        }

        courses.push({
            id: `course${courseNum}`,
            name: `Course ${courseNum}`,
            holes: holes
        });
    }

    return courses;
}

/**
 * Ensure a course has exactly 18 holes, preserving existing GPS data
 */
function ensureEighteenHoles(course) {
    const holes = course.holes || [];

    // If already 18 holes, return as is
    if (holes.length === 18) {
        return course;
    }

    // Create new 18-hole array
    const newHoles = [];
    for (let i = 0; i < 18; i++) {
        if (i < holes.length && holes[i]) {
            // Preserve existing hole data
            newHoles.push(holes[i]);
        } else {
            // Add new empty hole
            newHoles.push({
                number: i + 1,
                latitude: null,
                longitude: null
            });
        }
    }

    return {
        ...course,
        holes: newHoles
    };
}

/**
 * Load courses from file storage (creates 4 fixed courses if none exist, ensures all have 18 holes)
 * @returns {Array} Array of 4 course objects
 */
export function loadCourses() {
    try {
        const data = fs.readFileSync(COURSES_FILE, "cbor");
        if (data && data.length > 0) {
            // Ensure we have exactly 4 courses
            let courses = [];

            // Copy existing courses (up to 4)
            for (let i = 0; i < 4; i++) {
                if (i < data.length && data[i]) {
                    courses.push(ensureEighteenHoles(data[i]));
                } else {
                    // Create missing course
                    const holes = [];
                    for (let j = 0; j < 18; j++) {
                        holes.push({
                            number: j + 1,
                            latitude: null,
                            longitude: null
                        });
                    }
                    courses.push({
                        id: `course${i + 1}`,
                        name: `Course ${i + 1}`,
                        holes: holes
                    });
                }
            }

            // Save updated courses if we made changes
            saveCourses(courses);
            return courses;
        }
    } catch (error) {
        console.log("Main courses file error, trying backup:", error);
    }

    // Try backup file
    try {
        const data = fs.readFileSync(COURSES_BACKUP, "cbor");
        if (data && data.length > 0 && validateCourses(data)) {
            console.log(`Restored ${data.length} courses from backup!`);

            // Restore main file
            fs.writeFileSync(COURSES_FILE, data, "cbor");

            // Process backup data same as main
            let courses = [];
            for (let i = 0; i < 4; i++) {
                if (i < data.length && data[i]) {
                    courses.push(ensureEighteenHoles(data[i]));
                } else {
                    const holes = [];
                    for (let j = 0; j < 18; j++) {
                        holes.push({
                            number: j + 1,
                            latitude: null,
                            longitude: null
                        });
                    }
                    courses.push({
                        id: `course${i + 1}`,
                        name: `Course ${i + 1}`,
                        holes: holes
                    });
                }
            }

            saveCourses(courses);
            return courses;
        }
    } catch (error) {
        console.log("Backup also failed, initializing fresh");
    }

    // Initialize 4 fixed courses with 18 holes each
    const courses = initializeFixedCourses();
    saveCourses(courses);
    return courses;
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


/**
 * Delete a course by ID
 * @param {string} courseId
 */
export function deleteCourse(courseId) {
    try {
        const courses = loadCourses();
        const filteredCourses = [];
        for (let i = 0; i < courses.length; i++) {
            if (courses[i].id !== courseId) {
                filteredCourses.push(courses[i]);
            }
        }
        saveCourses(filteredCourses);
        console.log('Deleted course:', courseId);
    } catch (error) {
        console.error('Error deleting course:', error);
    }
}

/**
 * Save GPS position cache for instant resume
 */
export function saveGPSCache(cache) {
    try {
        fs.writeFileSync(GPS_CACHE_FILE, cache, "cbor");
    } catch (error) {
        console.error("Error saving GPS cache:", error);
    }
}

/**
 * Load GPS position cache
 */
export function loadGPSCache() {
    try {
        return fs.readFileSync(GPS_CACHE_FILE, "cbor");
    } catch (error) {
        return null;
    }
}
