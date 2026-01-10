import document from "document";
import { vibration } from "haptics";
import * as gps from "./gps";
import * as storage from "./storage";
import { calculateDistance } from "./distance";
import * as messaging from "messaging";
import { display } from "display";
import { me as appbit } from "appbit";

// Keep App Alive (No Timeout)
appbit.appTimeoutEnabled = false;

console.log("Flog v5.0 - Battery Saver & Usability");

// State
let currentCourse = null;
let currentHole = 1;
let lastGpsPos = null;
let settings = storage.loadSettings();
let isSetupMode = false;

// UI Elements
const screens = ["start-screen", "list-screen", "main-screen", "mark-screen"]; // Removed hole-select-screen
const txtDistance = document.getElementById("txt-distance");
const txtHoleNum = document.getElementById("txt-hole-num");
const txtUnit = document.getElementById("txt-unit");
const txtMainTitle = document.getElementById("txt-main-title");
const txtModeStatus = document.getElementById("txt-mode-status");
const rectModeBg = document.getElementById("rect-mode-bg");
const btnMark = document.getElementById("btn-mark");
const btnModeToggle = document.getElementById("btn-mode-toggle");
const btnLockedIndicator = document.getElementById("btn-locked-indicator");

// Smart GPS Handling
display.addEventListener("change", () => {
    if (display.on) {
        console.log("Display ON - Starting GPS");
        // Update UI immediately with old data if available
        updateUI();
        // Start GPS
        gps.startGPS((pos) => {
            lastGpsPos = pos;
            updateUI();
        }, (err) => { console.warn(err); });
    } else {
        console.log("Display OFF - Stopping GPS");
        gps.stopGPS();
    }
});

// Initial GPS Start
gps.startGPS((pos) => { lastGpsPos = pos; updateUI(); }, (err) => { console.warn(err); });

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
    const btnDelete = document.getElementById("btn-delete-course");
    if (isSetupMode) {
        btnMark.style.display = "inline";
        if (btnDelete) btnDelete.style.display = "inline";
        btnLockedIndicator.style.display = "none";
        txtModeStatus.text = "DONE";
        if (rectModeBg) rectModeBg.style.fill = "#aa0000"; // Red for editing
    } else {
        btnMark.style.display = "none";
        if (btnDelete) btnDelete.style.display = "none";
        btnLockedIndicator.style.display = "inline";
        txtModeStatus.text = "EDIT";
        if (rectModeBg) rectModeBg.style.fill = "#333333";
    }

    // Course Name Header
    if (txtMainTitle) txtMainTitle.text = currentCourse.name.toUpperCase().substring(0, 15);

    // Hole
    txtHoleNum.text = `HOLE ${currentHole}`;

    // Unit label
    txtUnit.text = settings.useYards ? "YARDS" : "METERS";

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

function updateCourseList() {
    const list = storage.loadCourses();
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`btn-course-${i}`);
        const txt = document.getElementById(`txt-course-${i}`);
        const delBtn = document.getElementById(`btn-delete-${i}`);

        if (list[i]) {
            btn.style.display = "inline";
            if (delBtn) delBtn.style.display = "inline";

            txt.text = list[i].name || `Course ${i + 1}`;
            btn.onclick = () => {
                currentCourse = list[i];
                currentHole = 1;
                isSetupMode = false;
                showScreen("main-screen");
                updateUI();
                syncCourseToPhone();
            };

            // Delete Handler
            if (delBtn) {
                delBtn.onclick = () => {
                    vibration.start("confirmation");
                    storage.deleteCourse(list[i].id);
                    updateCourseList(); // Refresh
                };
            }

        } else {
            btn.style.display = "none";
            if (delBtn) delBtn.style.display = "none";
        }
    }
}

function setupEventListeners() {
    // START
    document.getElementById("btn-new-course").onclick = () => {
        vibration.start("bump");
        currentCourse = storage.createCourse(`New Round ${new Date().getHours()}:${new Date().getMinutes()}`);
        currentHole = 1;
        isSetupMode = true;
        showScreen("main-screen");
        updateUI();
        syncCourseToPhone();
    };

    document.getElementById("btn-load-list").onclick = () => {
        vibration.start("bump");
        updateCourseList();
        showScreen("list-screen");
    };

    // LIST
    document.getElementById("btn-list-back").onclick = () => showScreen("start-screen");

    // MAIN
    btnModeToggle.onclick = () => {
        isSetupMode = !isSetupMode;
        vibration.start("bump");
        updateUI();
    };


    document.getElementById("btn-prev-hole").onclick = () => {
        if (currentHole > 1) { currentHole--; vibration.start("bump"); updateUI(); }
    };
    document.getElementById("btn-next-hole").onclick = () => {
        if (currentHole < 18) { currentHole++; vibration.start("bump"); updateUI(); }
    };
    document.getElementById("btn-mark").onclick = () => {
        // Reset Mark Screen Text
        document.getElementById("txt-mark-prompt").text = "Mark Green Location?";
        document.getElementById("txt-mark-confirm-btn").text = "YES, SET HERE";
        showScreen("mark-screen");
    };


    // SWIPE TO EXIT (Right Swipe on Main Screen)
    let touchStartX = 0;
    rectModeBg.onmousedown = (evt) => {
        touchStartX = evt.screenX;
    };
    rectModeBg.onmouseup = (evt) => {
        if (evt.screenX - touchStartX > 100) {
            // Swipe Right Detected -> Exit
            vibration.start("nudge");
            // Save before exit
            if (currentCourse) {
                // Save state if needed, but we already save on edit
                isSetupMode = false;
                updateUI(); // Reset UI state
                showScreen("start-screen");
            }
        }
    };

    // DELETE COURSE (Main Screen)
    document.getElementById("btn-delete-course").onclick = () => {
        vibration.start("confirmation");
        storage.deleteCourse(currentCourse.id);

        // Exit
        currentCourse = null;
        isSetupMode = false;
        showScreen("start-screen");
    };

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
    if (d.key === "courseName" && currentCourse) {
        currentCourse.name = d.newValue;
        const courses = storage.loadCourses();
        let idx = -1;
        for (let i = 0; i < courses.length; i++) {
            if (courses[i].id === currentCourse.id) {
                idx = i;
                break;
            }
        }
        if (idx !== -1) {
            courses[idx].name = currentCourse.name;
            storage.saveCourses(courses);
        }
        updateUI();
        syncCourseToPhone();
        if (vibration) vibration.start("confirmation");
        console.log(`UI: Course renamed to ${d.newValue}`);
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


setupEventListeners();
showScreen("start-screen");
if (vibration) vibration.start("nudge");
