import document from "document";
import { vibration } from "haptics";
import * as gps from "./gps";
import * as storage from "./storage";
import { calculateDistance } from "./distance";
import * as messaging from "messaging";

console.log("Flog v3.8 - Mode Safety Update");

// State
let currentCourse = null;
let currentHole = 1;
let lastGpsPos = null;
let settings = storage.loadSettings();
let isSetupMode = false;

// UI Elements
const screens = ["start-screen", "list-screen", "main-screen", "mark-screen"];
const txtDistance = document.getElementById("txt-distance");
const txtHoleNum = document.getElementById("txt-hole-num");
const txtUnit = document.getElementById("txt-unit");
const txtMainTitle = document.getElementById("txt-main-title");
const txtModeStatus = document.getElementById("txt-mode-status");
const btnMark = document.getElementById("btn-mark");
const btnModeToggle = document.getElementById("btn-mode-toggle");
const btnLockedIndicator = document.getElementById("btn-locked-indicator");

function showScreen(screenId) {
    console.log(`UI: Show ${screenId}`);
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = (s === screenId) ? "inline" : "none";
    });
}

function updateUI() {
    if (!currentCourse) return;

    // Mode handling
    if (isSetupMode) {
        btnMark.style.display = "inline";
        btnLockedIndicator.style.display = "none";
        txtModeStatus.text = "DONE";
        txtModeStatus.parent.getElementById("rect").style.fill = "#aa0000"; // Red for editing
    } else {
        btnMark.style.display = "none";
        btnLockedIndicator.style.display = "inline";
        txtModeStatus.text = "EDIT";
        txtModeStatus.parent.getElementById("rect").style.fill = "#333333";
    }

    // Course Name Header
    if (txtMainTitle) txtMainTitle.text = currentCourse.name.toUpperCase().substring(0, 15);

    // Hole
    txtHoleNum.text = `HOLE ${currentHole}`;

    // Unit label
    txtUnit.text = settings.useYards ? "YARDS TO CENTER" : "METERS TO CENTER";

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
                isSetupMode = false; // Initial Play Mode for saved courses
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
        isSetupMode = true; // Auto Setup for new course
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
    document.getElementById("btn-mark").onclick = () => { showScreen("mark-screen"); };

    // MARK
    document.getElementById("btn-mark-confirm").onclick = () => {
        if (lastGpsPos) {
            vibration.start("celebration");
            storage.updateHole(currentCourse.id, currentHole, {
                latitude: lastGpsPos.latitude,
                longitude: lastGpsPos.longitude
            });
            currentCourse = storage.loadCourse(currentCourse.id);
            showScreen("main-screen");
            updateUI();
            syncCourseToPhone();
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
vibration.start("nudge");
