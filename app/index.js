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
        if (list[i]) {
            btn.style.display = "inline";
            txt.text = list[i].name || `Course ${i + 1}`;
            btn.onclick = () => {
                currentCourse = list[i];
                currentHole = 1;
                isSetupMode = false;
                showScreen("main-screen");
                updateUI();
                syncCourseToPhone();
            };
        } else {
            btn.style.display = "none";
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

    document.getElementById("btn-hole-jump").onclick = () => {
        vibration.start("bump");
        showScreen("hole-select-screen");
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
                document.getElementById("txt-mark-prompt").text = "ERR: VIB";
                return;
            }

            // 2. Storage
            try {
                console.log(`MARK: Saving ${lastGpsPos.latitude}, ${lastGpsPos.longitude}`);
                storage.updateHole(currentCourse.id, currentHole, {
                    latitude: lastGpsPos.latitude,
                    longitude: lastGpsPos.longitude
                });
                currentCourse = storage.loadCourse(currentCourse.id);
            } catch (e) {
                console.error("STORE ERR", e);
                document.getElementById("txt-mark-prompt").text = "ERR: STORE";
                return;
            }

            // 3. UI & Sync
            try {
                showScreen("main-screen");
                updateUI();
                syncCourseToPhone();
            } catch (e) {
                console.error("SYNC ERR", e);
                document.getElementById("txt-mark-prompt").text = "ERR: SYNC";
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
        const idx = courses.findIndex(c => c.id === currentCourse.id);
        if (idx !== -1) {
            courses[idx].name = currentCourse.name;
            storage.saveCourses(courses);
        }
        updateUI();
        syncCourseToPhone();
        vibration.start("nudge");
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
