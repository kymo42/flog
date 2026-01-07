import document from "document";
import { vibration } from "haptics";
import * as gps from "./gps";
import * as storage from "./storage";
import { calculateDistance, formatDistance } from "./distance";

// App state
let currentCourse = null;
let currentHole = 1;
let currentView = "main"; // main, hole-select, mark, course-list, settings
let courses = [];
let settings = {};
let markMode = null; // null, 'tee', 'front', 'middle', 'back', 'hazard'

// UI Elements - Main Screen
const mainScreen = document.getElementById("main-screen");
const distanceFront = document.getElementById("distance-front");
const distanceMiddle = document.getElementById("distance-middle");
const distanceBack = document.getElementById("distance-back");
const holeNumber = document.getElementById("hole-number");
const courseName = document.getElementById("course-name");
const gpsStatus = document.getElementById("gps-status");
const btnPrevHole = document.getElementById("btn-prev-hole");
const btnNextHole = document.getElementById("btn-next-hole");
const btnMark = document.getElementById("btn-mark");
const btnMenu = document.getElementById("btn-menu");

// Other screens
const holeSelectScreen = document.getElementById("hole-select-screen");
const markScreen = document.getElementById("mark-screen");
const courseListScreen = document.getElementById("course-list-screen");
const settingsScreen = document.getElementById("settings-screen");

// Initialize app
function init() {
    console.log("Golf Rangefinder starting...");

    // Load data
    courses = storage.loadCourses();
    settings = storage.loadSettings();
    const savedRound = storage.loadCurrentRound();

    if (savedRound && savedRound.courseId) {
        currentCourse = courses.find(c => c.id === savedRound.courseId);
        currentHole = savedRound.currentHole || 1;
    }

    // Setup UI
    setupEventListeners();
    updateUI();

    // Start GPS
    gps.startGPS(onGPSUpdate, onGPSError);

    console.log("App initialized");
}

// Setup event listeners
function setupEventListeners() {
    // Main screen buttons
    if (btnPrevHole) {
        btnPrevHole.onclick = () => {
            if (currentHole > 1) {
                currentHole--;
                updateUI();
                saveRoundState();
            }
        };
    }

    if (btnNextHole) {
        btnNextHole.onclick = () => {
            if (currentHole < 18) {
                currentHole++;
                updateUI();
                saveRoundState();
            }
        };
    }

    if (btnMark) {
        btnMark.onclick = () => {
            showMarkScreen();
        };
    }

    if (btnMenu) {
        btnMenu.onclick = () => {
            showMenu();
        };
    }

    // Hole select buttons
    for (let i = 1; i <= 18; i++) {
        const btn = document.getElementById(`hole-${i}`);
        if (btn) {
            btn.onclick = () => {
                currentHole = i;
                showMainScreen();
                updateUI();
                saveRoundState();
            };
        }
    }

    // Mark screen buttons
    const btnMarkTee = document.getElementById("btn-mark-tee");
    const btnMarkFront = document.getElementById("btn-mark-front");
    const btnMarkMiddle = document.getElementById("btn-mark-middle");
    const btnMarkBack = document.getElementById("btn-mark-back");
    const btnMarkHazard = document.getElementById("btn-mark-hazard");
    const btnBackMark = document.getElementById("btn-back-mark");

    if (btnMarkTee) btnMarkTee.onclick = () => markPosition("tee");
    if (btnMarkFront) btnMarkFront.onclick = () => markPosition("front");
    if (btnMarkMiddle) btnMarkMiddle.onclick = () => markPosition("middle");
    if (btnMarkBack) btnMarkBack.onclick = () => markPosition("back");
    if (btnMarkHazard) btnMarkHazard.onclick = () => markPosition("hazard");
    if (btnBackMark) btnBackMark.onclick = () => showMainScreen();

    // Settings buttons
    const btnUnitsYards = document.getElementById("btn-units-yards");
    const btnUnitsMeters = document.getElementById("btn-units-meters");
    const btnBackSettings = document.getElementById("btn-back-settings");

    if (btnUnitsYards) {
        btnUnitsYards.onclick = () => {
            settings.useYards = true;
            storage.saveSettings(settings);
            updateSettingsUI();
            updateUI();
        };
    }

    if (btnUnitsMeters) {
        btnUnitsMeters.onclick = () => {
            settings.useYards = false;
            storage.saveSettings(settings);
            updateSettingsUI();
            updateUI();
        };
    }

    if (btnBackSettings) {
        btnBackSettings.onclick = () => showMainScreen();
    }

    // Other back buttons
    const btnBackHole = document.getElementById("btn-back-hole");
    const btnBackCourses = document.getElementById("btn-back-courses");

    if (btnBackHole) btnBackHole.onclick = () => showMainScreen();
    if (btnBackCourses) btnBackCourses.onclick = () => showMainScreen();
}

// GPS callbacks
function onGPSUpdate(position) {
    updateDistances();
    updateGPSStatusUI();
}

function onGPSError(error) {
    if (gpsStatus) {
        gpsStatus.text = `GPS: ${error}`;
    }
}

// Update distance calculations
function updateDistances() {
    const position = gps.getCurrentPosition();

    if (!position || !currentCourse) {
        if (distanceFront) distanceFront.text = "--";
        if (distanceMiddle) distanceMiddle.text = "--";
        if (distanceBack) distanceBack.text = "--";
        return;
    }

    const hole = getCurrentHoleData();
    if (!hole) {
        if (distanceFront) distanceFront.text = "--";
        if (distanceMiddle) distanceMiddle.text = "--";
        if (distanceBack) distanceBack.text = "--";
        return;
    }

    // Calculate distances
    if (hole.front) {
        const dist = calculateDistance(
            position.latitude,
            position.longitude,
            hole.front.lat,
            hole.front.lon
        );
        if (distanceFront) {
            distanceFront.text = formatDistance(dist, settings.useYards);
        }
    } else {
        if (distanceFront) distanceFront.text = "--";
    }

    if (hole.middle) {
        const dist = calculateDistance(
            position.latitude,
            position.longitude,
            hole.middle.lat,
            hole.middle.lon
        );
        if (distanceMiddle) {
            distanceMiddle.text = formatDistance(dist, settings.useYards);
        }
    } else {
        if (distanceMiddle) distanceMiddle.text = "--";
    }

    if (hole.back) {
        const dist = calculateDistance(
            position.latitude,
            position.longitude,
            hole.back.lat,
            hole.back.lon
        );
        if (distanceBack) {
            distanceBack.text = formatDistance(dist, settings.useYards);
        }
    } else {
        if (distanceBack) distanceBack.text = "--";
    }
}

// Update GPS status display
function updateGPSStatusUI() {
    if (gpsStatus) {
        const status = gps.getGPSStatus();
        const position = gps.getCurrentPosition();
        if (position) {
            gpsStatus.text = `GPS: ${status} (±${Math.round(position.accuracy)}m)`;
        } else {
            gpsStatus.text = `GPS: ${status}`;
        }
    }
}

// Get current hole data
function getCurrentHoleData() {
    if (!currentCourse || !currentCourse.holes) {
        return null;
    }
    return currentCourse.holes.find(h => h.number === currentHole);
}

// Update UI
function updateUI() {
    if (holeNumber) {
        holeNumber.text = `Hole ${currentHole}`;
    }

    if (courseName) {
        courseName.text = currentCourse ? currentCourse.name : "No Course";
    }

    updateDistances();
    updateGPSStatusUI();
}

// Update settings UI
function updateSettingsUI() {
    const btnUnitsYards = document.getElementById("btn-units-yards");
    const btnUnitsMeters = document.getElementById("btn-units-meters");

    if (btnUnitsYards && btnUnitsMeters) {
        if (settings.useYards) {
            btnUnitsYards.style.fill = "#4CAF50";
            btnUnitsMeters.style.fill = "#757575";
        } else {
            btnUnitsYards.style.fill = "#757575";
            btnUnitsMeters.style.fill = "#4CAF50";
        }
    }
}

// Save current round state
function saveRoundState() {
    if (currentCourse) {
        storage.saveCurrentRound({
            courseId: currentCourse.id,
            currentHole: currentHole,
            timestamp: Date.now()
        });
    }
}

// Screen navigation
function showMainScreen() {
    hideAllScreens();
    if (mainScreen) mainScreen.style.display = "inline";
    currentView = "main";
}

function showHoleSelectScreen() {
    hideAllScreens();
    if (holeSelectScreen) holeSelectScreen.style.display = "inline";
    currentView = "hole-select";
}

function showMarkScreen() {
    if (!currentCourse) {
        // Create a default course automatically
        currentCourse = storage.createCourse("My Course");
        // Initialize all 18 holes
        for (let i = 1; i <= 18; i++) {
            currentCourse.holes.push(storage.createHole(i));
        }
        courses.push(currentCourse);
        storage.saveCourses(courses);
    }

    hideAllScreens();
    if (markScreen) markScreen.style.display = "inline";

    // Update hole number on mark screen
    const markHoleNum = document.getElementById("mark-hole-num");
    if (markHoleNum) {
        markHoleNum.text = `Hole ${currentHole}`;
    }

    currentView = "mark";
}

function showCourseList() {
    hideAllScreens();
    if (courseListScreen) courseListScreen.style.display = "inline";
    currentView = "course-list";
    // TODO: Populate course list
}

function showMenu() {
    hideAllScreens();
    if (settingsScreen) settingsScreen.style.display = "inline";
    currentView = "settings";
}

function hideAllScreens() {
    if (mainScreen) mainScreen.style.display = "none";
    if (holeSelectScreen) holeSelectScreen.style.display = "none";
    if (markScreen) markScreen.style.display = "none";
    if (courseListScreen) courseListScreen.style.display = "none";
    if (settingsScreen) settingsScreen.style.display = "none";
}

// Mark position
export function markPosition(type) {
    const position = gps.getCurrentPosition();

    if (!position) {
        console.log("No GPS position available");
        return;
    }

    if (!currentCourse) {
        console.log("No course selected");
        return;
    }

    // Ensure hole exists
    let hole = getCurrentHoleData();
    if (!hole) {
        hole = storage.createHole(currentHole);
        currentCourse.holes.push(hole);
    }

    // Save position
    const pos = {
        lat: position.latitude,
        lon: position.longitude
    };

    if (type === "front" || type === "middle" || type === "back" || type === "tee") {
        hole[type] = pos;
    } else if (type === "hazard") {
        if (!hole.hazards) hole.hazards = [];
        hole.hazards.push(pos);
    }

    // Save course
    storage.saveCourses(courses);

    // Vibrate feedback
    if (settings.vibrationEnabled) {
        vibration.start("confirmation");
    }

    console.log(`Marked ${type} for hole ${currentHole}`);
    updateUI();
}

// Start the app
init();

// Update distances every 2 seconds
setInterval(() => {
    if (currentView === "main") {
        updateDistances();
    }
}, 2000);
