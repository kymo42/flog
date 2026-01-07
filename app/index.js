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
const distanceFront = document.getElementById("distance-front");
const distanceMiddle = document.getElementById("distance-middle");
const distanceBack = document.getElementById("distance-back");
const holeNumber = document.getElementById("hole-number");
const courseName = document.getElementById("course-name");
const parDisplay = document.getElementById("par-display");
const gpsStatus = document.getElementById("gps-status");

// Other screens
const startScreen = document.getElementById("start-screen");
const mainScreen = document.getElementById("main-screen"); // Now initially hidden
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

    // Setup UI
    setupEventListeners();

    if (savedRound && savedRound.courseId) {
        currentCourse = courses.find(c => c.id === savedRound.courseId);
        currentHole = savedRound.currentHole || 1;
        showMainScreen(); // Resume game
    } else {
        showStartScreen(); // Initial Course Select
    }

    updateUI();

    // Start GPS
    gps.startGPS(onGPSUpdate, onGPSError);

    console.log("App initialized");
}

// Setup event listeners
function setupEventListeners() {
    // Start Screen Buttons
    const btnNewCourse = document.getElementById("btn-new-course");
    const btnLoadCourse = document.getElementById("btn-load-course");
    const btnSettingsStart = document.getElementById("btn-settings-start");

    console.log("Setup Event Listeners. BtnNewCourse: " + (btnNewCourse ? "FOUND" : "MISSING"));

    if (btnNewCourse) {
        btnNewCourse.onclick = () => {
            console.log("New Course Button CLICKED");
            // Create new course immediately
            currentCourse = storage.createCourse(`Course ${courses.length + 1}`);
            // Init holes
            for (let i = 1; i <= 18; i++) {
                currentCourse.holes.push(storage.createHole(i));
            }
            courses.push(currentCourse);
            storage.saveCourses(courses);

            // Go to mark screen for hole 1
            currentHole = 1;
            saveRoundState();
            showMainScreen(); // Go to main first so we have context, or straight to mark? User wants minimalist.
            // Let's go to main, "No Course" isn't a thing anymore.
        };
    }

    if (btnLoadCourse) {
        btnLoadCourse.onclick = () => {
            if (courses.length > 0) {
                // For now, just load the last one as a placeholder or cycle?
                // Ideally show list.
                // Simple logic for V1: Load most recent
                currentCourse = courses[courses.length - 1];
                currentHole = 1;
                saveRoundState();
                showMainScreen();
            } else {
                console.log("No saved courses");
                // Maybe vibrate error
                vibration.start("nudge");
            }
        };
    }

    if (btnSettingsStart) btnSettingsStart.onclick = () => showMenu();

    // Main screen buttons
    const btnPrevHole = document.getElementById("btn-prev-hole");
    const btnNextHole = document.getElementById("btn-next-hole");
    const btnMark = document.getElementById("btn-mark");

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
    const btnBackMark = document.getElementById("btn-back-mark");

    // Par buttons
    const btnPar3 = document.getElementById("btn-par-3");
    const btnPar4 = document.getElementById("btn-par-4");
    const btnPar5 = document.getElementById("btn-par-5");

    if (btnMarkTee) btnMarkTee.onclick = () => markPosition("tee");
    if (btnMarkFront) btnMarkFront.onclick = () => markPosition("front");
    if (btnMarkMiddle) btnMarkMiddle.onclick = () => markPosition("middle");
    if (btnMarkBack) btnMarkBack.onclick = () => markPosition("back");
    if (btnBackMark) btnBackMark.onclick = () => showMainScreen();

    if (btnPar3) btnPar3.onclick = () => setPar(3);
    if (btnPar4) btnPar4.onclick = () => setPar(4);
    if (btnPar5) btnPar5.onclick = () => setPar(5);

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
        // Go back to wherever we came from
        if (currentCourse) {
            showMainScreen();
        } else {
            showStartScreen();
        }
    }

    // Other back buttons
    const btnBackHole = document.getElementById("btn-back-hole");
    const btnBackCourses = document.getElementById("btn-back-courses");

    if (btnBackHole) btnBackHole.onclick = () => showMainScreen();
    if (btnBackCourses) btnBackCourses.onclick = () => showStartScreen();
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

    // Update Par Display
    if (parDisplay) {
        const hole = getCurrentHoleData();
        parDisplay.text = hole ? `Par ${hole.par || 4}` : "Par 4";
    }

    updateDistances();
    updateGPSStatusUI();
}

// Update settings UI (Desaturated Logic)
function updateSettingsUI() {
    const btnUnitsYards = document.getElementById("btn-units-yards");
    const btnUnitsMeters = document.getElementById("btn-units-meters");

    if (btnUnitsYards && btnUnitsMeters) {
        if (settings.useYards) {
            // Yards Active: White/Grey fill? Or Dark fill?
            // Let's use fill color. #333333 is default. #666666 active?
            btnUnitsYards.style.fill = "#666666"; // Active
            btnUnitsMeters.style.fill = "#222222"; // Inactive
        } else {
            btnUnitsYards.style.fill = "#222222";
            btnUnitsMeters.style.fill = "#666666";
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
function showStartScreen() {
    hideAllScreens();
    if (startScreen) startScreen.style.display = "inline";
    currentView = "start";

    // Update Load button text/state if courses exist
    const textLoad = document.getElementById("text-load-course");
    if (textLoad) {
        textLoad.text = (courses.length > 0) ? `Load Saved (${courses.length})` : "Load Saved (0)";
    }
}

function showMainScreen() {
    hideAllScreens();
    if (mainScreen) mainScreen.style.display = "inline";
    currentView = "main";

    // Update local variables for UI - ensure we have references
    // (Variables defined at top are consts for elements, but we need to update content)
    updateUI();
}

function showHoleSelectScreen() {
    hideAllScreens();
    if (holeSelectScreen) holeSelectScreen.style.display = "inline";
    currentView = "hole-select";
}

function showMarkScreen() {
    // We assume currentCourse exists by this point
    hideAllScreens();
    if (markScreen) markScreen.style.display = "inline";

    const markHoleNum = document.getElementById("mark-hole-num");
    if (markHoleNum) {
        markHoleNum.text = `Hole ${currentHole}`;
    }

    // Update Par buttons state
    updateParButtonsUI();

    currentView = "mark";
}

function updateParButtonsUI() {
    const hole = getCurrentHoleData();
    const currentPar = hole ? (hole.par || 4) : 4;

    const btnPar3 = document.getElementById("btn-par-3");
    const btnPar4 = document.getElementById("btn-par-4");
    const btnPar5 = document.getElementById("btn-par-5");

    const activeColor = "#666666";
    const inactiveColor = "#333333";

    if (btnPar3) btnPar3.style.fill = (currentPar === 3) ? activeColor : inactiveColor;
    if (btnPar4) btnPar4.style.fill = (currentPar === 4) ? activeColor : inactiveColor;
    if (btnPar5) btnPar5.style.fill = (currentPar === 5) ? activeColor : inactiveColor;
}

function setPar(par) {
    if (!currentCourse) return;

    let hole = getCurrentHoleData();
    if (!hole) {
        hole = storage.createHole(currentHole);
        currentCourse.holes.push(hole);
    }

    hole.par = par;
    storage.saveCourses(courses);

    // Feedback
    if (settings.vibrationEnabled) {
        vibration.start("bump");
    }

    updateParButtonsUI();
}

function showCourseList() {
    hideAllScreens();
    if (courseListScreen) courseListScreen.style.display = "inline";
    currentView = "course-list";
}

function showMenu() {
    hideAllScreens();
    if (settingsScreen) settingsScreen.style.display = "inline";
    currentView = "settings";
    updateSettingsUI();
}

function hideAllScreens() {
    if (startScreen) startScreen.style.display = "none";
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
