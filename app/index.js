import document from "document";
import { vibration } from "haptics";
import * as gps from "./gps";
import * as storage from "./storage";
import { calculateDistance } from "./distance";
import * as messaging from "messaging";
import { display } from "display";


console.log("Flog v4.1 - Debugging Save");

// State
let currentCourse = null;
let currentHole = 1;
let lastGpsPos = null;
let settings = storage.loadSettings();
let isSetupMode = false;

// UI Elements
const screens = ["start-screen", "list-screen", "main-screen", "mark-screen", "hole-select-screen"];
const txtDistance = document.getElementById("txt-distance");
const txtHoleNum = document.getElementById("txt-hole-num");
const txtUnit = document.getElementById("txt-unit");
const txtMainTitle = document.getElementById("txt-main-title");
const txtModeStatus = document.getElementById("txt-mode-status");
const txtGpsStatus = document.getElementById("txt-gps-status");
const rectModeBg = document.getElementById("rect-mode-bg");
const btnMark = document.getElementById("btn-mark");
const btnModeToggle = document.getElementById("btn-mode-toggle");
const btnLockedIndicator = document.getElementById("btn-locked-indicator");

function showScreen(screenId) {
    console.log(`UI: Show ${screenId}`);
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = (s === screenId) ? "inline" : "none";
    });

    // Reset display behavior to system defaults (Battery Safe)
    display.autoOff = true;
    if (screenId === "main-screen" || screenId === "mark-screen") {
        display.on = true; // Just wake it up initially
    }
}

// GPS Bars
const gpsBars = [
    document.getElementById("gps-bar-1"),
    document.getElementById("gps-bar-2"),
    document.getElementById("gps-bar-3"),
    document.getElementById("gps-bar-4")
];

function updateUI() {
    if (!currentCourse) return;

    // GPS Status (Graphical)
    const status = gps.getGPSStatus();
    const color = (status === "Excellent" || status === "Good") ? "#00ff00" : (status === "Fair" ? "#ffff00" : "#333333");
    const activeBars = (status === "Excellent") ? 4 : (status === "Good") ? 3 : (status === "Fair") ? 2 : (status === "Poor") ? 1 : 0;

    gpsBars.forEach((bar, i) => {
        if (bar) {
            bar.style.fill = (i < activeBars) ? color : "#333333";
        }
    });

    // Reset display behavior to system defaults (Battery Safe)

    // Distance updates UI regularly

    // Mode handling
    if (isSetupMode) {
        btnMark.style.display = "inline";
        btnLockedIndicator.style.display = "none";
        txtModeStatus.text = "DONE";
        if (rectModeBg) rectModeBg.style.fill = "#aa0000"; // Red for editing
    } else {
        btnMark.style.display = "none";
        btnLockedIndicator.style.display = "inline";
        txtModeStatus.text = "EDIT";
        if (rectModeBg) rectModeBg.style.fill = "#333333";
    }

    // Course Name Header
    if (txtMainTitle) txtMainTitle.text = currentCourse.name.toUpperCase().substring(0, 15);

    // Hole - H + number
    console.log(`Setting hole text: currentHole=${currentHole}, text=H${currentHole}`);
    txtHoleNum.text = `H ${currentHole}`;

    // Unit label - DEBUG: Show currentHole value
    txtUnit.text = `${settings.useYards ? "YARDS" : "METERS"} [H${currentHole}]`;

    // Distance
    if (lastGpsPos) {
        const hole = currentCourse.holes[currentHole - 1];
        if (hole && hole.latitude && hole.longitude) {
            const m = calculateDistance(
                lastGpsPos.latitude, lastGpsPos.longitude,
                hole.latitude, hole.longitude
            );
            const val = settings.useYards ? Math.round(m * 1.09361) : Math.round(m);
            txtDistance.text = val.toString();
        } else {
            txtDistance.text = "---";
        }
    } else {
        txtDistance.text = "---";
    }
}

function syncCourseToPhone() {
    if (currentCourse && messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({
            type: "export-course",
            data: currentCourse
        });
    }
}

function syncCourseListToPhone() {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        const courses = storage.loadCourses();
        messaging.peerSocket.send({
            type: "sync-courses",
            data: courses
        });
    }
}

/**
 * Remove courses that have no GPS data (accidental creations)
 * Only keeps courses where at least one hole has coordinates
 */
function cleanupEmptyCourses() {
    try {
        const courses = storage.loadCourses();
        const coursesWithData = [];

        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];
            let hasData = false;

            // Check if any hole has GPS coordinates
            for (let j = 0; j < course.holes.length; j++) {
                if (course.holes[j].latitude && course.holes[j].longitude) {
                    hasData = true;
                    break;
                }
            }

            if (hasData) {
                coursesWithData.push(course);
            } else {
                console.log("Removing empty course:", course.name);
            }
        }

        // Only save if we actually removed something
        if (coursesWithData.length < courses.length) {
            storage.saveCourses(coursesWithData);
            console.log(`Cleaned up ${courses.length - coursesWithData.length} empty courses`);
        }
    } catch (error) {
        console.error("Error cleaning up courses:", error);
    }
}

// Track delete confirmation states
const deleteConfirmStates = {};

function updateCourseList() {
    const list = storage.loadCourses();
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`btn-course-${i}`);
        const txt = document.getElementById(`txt-course-${i}`);
        const deleteBtn = document.getElementById(`btn-delete-${i}`);

        if (list[i]) {
            btn.style.display = "inline";
            txt.text = list[i].name || `Course ${i + 1}`;

            // Course load handler
            btn.onclick = () => {
                currentCourse = list[i];
                currentHole = 1;
                isSetupMode = false;
                showScreen("main-screen");
                updateUI();
                syncCourseToPhone();
                storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
            };

            // Delete handler with two-factor confirmation
            if (deleteBtn) {
                const deleteTxt = document.getElementById(`txt-delete-${i}`);
                const deleteRect = document.getElementById(`rect-delete-${i}`);

                // Reset state on list refresh
                if (deleteTxt) deleteTxt.text = "X";
                if (deleteRect) deleteRect.style.fill = "#aa0000";
                deleteConfirmStates[i] = false;

                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // Prevent course load

                    if (deleteConfirmStates[i]) {
                        // Second tap - actually delete
                        storage.deleteCourse(list[i].id);
                        vibration.start("confirmation");
                        updateCourseList(); // Refresh list
                        syncCourseListToPhone();
                    } else {
                        // First tap - show confirmation
                        deleteConfirmStates[i] = true;
                        if (deleteTxt) deleteTxt.text = "?";
                        if (deleteRect) deleteRect.style.fill = "#ff0000";
                        vibration.start("nudge");

                        // Reset after 3 seconds
                        setTimeout(() => {
                            if (deleteConfirmStates[i]) {
                                deleteConfirmStates[i] = false;
                                const resetTxt = document.getElementById(`txt-delete-${i}`);
                                const resetRect = document.getElementById(`rect-delete-${i}`);
                                if (resetTxt) resetTxt.text = "X";
                                if (resetRect) resetRect.style.fill = "#aa0000";
                            }
                        }, 3000);
                    }
                };
            }
        } else {
            btn.style.display = "none";
        }
    }
}

function setupEventListeners() {
    // START SCREEN - 3 Course Buttons
    const courses = storage.loadCourses(); // Always returns 3 courses

    document.getElementById("btn-course-1").onclick = () => {
        vibration.start("bump");
        currentCourse = courses[0]; // RAGC 1
        currentHole = 1;
        isSetupMode = true; // Start in edit mode
        showScreen("main-screen");
        updateUI();
        storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
    };

    document.getElementById("btn-course-2").onclick = () => {
        vibration.start("bump");
        currentCourse = courses[1]; // RAGC 2
        currentHole = 1;
        isSetupMode = true; // Start in edit mode
        showScreen("main-screen");
        updateUI();
        storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
    };

    document.getElementById("btn-course-3").onclick = () => {
        vibration.start("bump");
        currentCourse = courses[2]; // Course 3
        currentHole = 1;
        isSetupMode = true; // Start in edit mode
        showScreen("main-screen");
        updateUI();
        storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
    };

    document.getElementById("btn-course-4").onclick = () => {
        vibration.start("bump");
        currentCourse = courses[3]; // Course 4
        currentHole = 1;
        isSetupMode = true; // Start in edit mode
        showScreen("main-screen");
        updateUI();
        storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
    };

    // MAIN SCREEN
    btnModeToggle.onclick = () => {
        isSetupMode = !isSetupMode;
        vibration.start("bump");
        updateUI();
    };

    // MENU button to return to course selection
    document.getElementById("btn-main-menu").onclick = () => {
        vibration.start("bump");
        showScreen("start-screen");
    };

    // Hole grid removed - use prev/next buttons only

    document.getElementById("btn-prev-hole").onclick = () => {
        if (currentHole > 1) {
            currentHole--;
            vibration.start("bump");
            updateUI();
            storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
        }
    };
    document.getElementById("btn-next-hole").onclick = () => {
        if (currentHole < 18) {
            currentHole++;
            vibration.start("bump");
            updateUI();
            storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
        }
    };
    document.getElementById("btn-mark").onclick = () => {
        // Reset Mark Screen Text
        document.getElementById("txt-mark-prompt").text = "Mark Green Location?";
        document.getElementById("txt-mark-confirm-btn").text = "YES, SET HERE";
        showScreen("mark-screen");
    };

    // HOLE SELECT
    document.getElementById("btn-hole-select-back").onclick = () => showScreen("main-screen");
    for (let i = 0; i < 18; i++) {
        const btn = document.getElementById(`hole-grid-${i}`);
        if (btn) {
            btn.onclick = () => {
                currentHole = i + 1;
                vibration.start("bump");
                showScreen("main-screen");
                updateUI();
                storage.saveCurrentRound({ courseId: currentCourse.id, currentHole, timestamp: Date.now() });
            };
        }
    }

    // MARK
    document.getElementById("btn-mark-confirm").onclick = () => {
        console.log("MARK: Button Clicked");
        console.log(`MARK: GPS Lock: ${lastGpsPos ? 'YES' : 'NO'}`);

        if (lastGpsPos) {
            // 1. Vibration
            try {
                if (vibration) vibration.start("confirmation");
            } catch (e) {
                console.error("VIB ERR", e);
            }

            // 2. Storage
            try {
                storage.updateHole(currentCourse.id, currentHole, {
                    latitude: lastGpsPos.latitude,
                    longitude: lastGpsPos.longitude
                });
                currentCourse = storage.loadCourse(currentCourse.id);
            } catch (e) {
                console.error("STORE ERR", e);
                document.getElementById("txt-mark-prompt").text = "SAVE FAILED";
                return;
            }

            // 3. UI & Sync
            try {
                showScreen("main-screen");
                updateUI();
                syncCourseToPhone();
            } catch (e) {
                console.error("SYNC ERR", e);
            }
        } else {
            console.warn("Mark attempted without GPS lock");
            vibration.start("nudge");
            document.getElementById("txt-mark-prompt").text = "NO GPS SIGNAL";
            document.getElementById("txt-mark-confirm-btn").text = "WAITING...";
        }
    };
    document.getElementById("btn-mark-cancel").onclick = () => showScreen("main-screen");
}

// Messaging
messaging.peerSocket.onmessage = (evt) => {
    const d = evt.data;
    if (d.key === "courseName" && currentCourse && d.courseId) {
        // Rename course
        const courses = storage.loadCourses();
        for (let i = 0; i < courses.length; i++) {
            if (courses[i].id === d.courseId) {
                courses[i].name = d.newValue;
                storage.saveCourses(courses);
                if (currentCourse.id === d.courseId) {
                    currentCourse.name = d.newValue;
                    updateUI();
                }
                break;
            }
        }
        syncCourseListToPhone();
        vibration.start("nudge");
    } else if (d.key === "deleteCourse" && d.courseId) {
        // Delete course from phone
        storage.deleteCourse(d.courseId);
        syncCourseListToPhone();
        vibration.start("confirmation");
    } else if (d.key === "useYards") {
        settings.useYards = d.newValue;
        storage.saveSettings(settings);
        updateUI();
    } else if (d.type === "import-course") {
        vibration.start("celebration");
        const newCourse = d.data;
        newCourse.id = Date.now().toString();
        const courses = storage.loadCourses();
        courses.push(newCourse);
        storage.saveCourses(courses);
        currentCourse = newCourse;
        currentHole = 1;
        isSetupMode = false;
        showScreen("main-screen");
        updateUI();
        syncCourseToPhone();
    }
};


gps.startGPS((pos) => { lastGpsPos = pos; updateUI(); }, (err) => { console.warn(err); });

// GPS on wrist-raise for instant updates
display.onchange = () => {
    if (display.on && currentCourse) {
        console.log("Wrist raised - updating GPS");
        // UI will auto-update via GPS callback
        updateUI(); // Force immediate UI refresh
    }
};

setupEventListeners();

// Clean up empty courses and sync to phone on startup
setTimeout(() => {
    cleanupEmptyCourses();
    syncCourseListToPhone();
}, 1000);

// Auto-resume last round if available
const savedRound = storage.loadCurrentRound();
if (savedRound && savedRound.courseId) {
    const timeSince = Date.now() - (savedRound.timestamp || 0);
    // Auto-resume if less than 24 hours old
    if (timeSince < 24 * 60 * 60 * 1000) {
        currentCourse = storage.loadCourse(savedRound.courseId);
        if (currentCourse) {
            currentHole = savedRound.currentHole || 1;
            isSetupMode = false;
            showScreen("main-screen");
            updateUI();
            syncCourseToPhone();
            console.log("Auto-resumed round:", currentCourse.name, "Hole", currentHole);
        } else {
            showScreen("start-screen");
        }
    } else {
        showScreen("start-screen");
    }
} else {
    showScreen("start-screen");
}

if (vibration) vibration.start("nudge");
