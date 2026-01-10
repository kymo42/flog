import { settingsStorage } from "settings";
import * as messaging from "messaging";

console.log("Companion sharing service started");

// Listen for messages from the watch
messaging.peerSocket.onmessage = (evt) => {
    const d = evt.data;
    if (d.type === "export-course") {
        console.log("Generating export code for: " + d.data.name);
        // Serialize course to base64 code
        const json = JSON.stringify(d.data);
        const code = btoa(json); // Simple Base64
        settingsStorage.setItem("courseExportCode", code);
    } else if (d.type === "sync-courses") {
        console.log("Syncing courses to phone");
        settingsStorage.setItem("courseList", JSON.stringify(d.data));
    }
};

// Listen for settings changes from the phone
settingsStorage.onchange = (evt) => {
    if (evt.key === "courseImportCode" && evt.newValue) {
        try {
            const rawCode = JSON.parse(evt.newValue);
            if (rawCode && rawCode.length > 20) {
                console.log("Importing course from code...");
                const decodedJson = atob(rawCode);
                const courseData = JSON.parse(decodedJson);

                if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
                    messaging.peerSocket.send({
                        type: "import-course",
                        data: courseData
                    });
                    // Clear the import field after success
                    settingsStorage.removeItem("courseImportCode");
                }
            }
        } catch (e) {
            console.error("Invalid Course Code format");
        }
    } else if (evt.key === "renameCourse" && evt.newValue) {
        try {
            const data = JSON.parse(evt.newValue);
            if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
                messaging.peerSocket.send({
                    key: "courseName",
                    courseId: data.id,
                    newValue: data.name
                });
            }
            settingsStorage.removeItem("renameCourse");
        } catch (e) {
            console.error("Invalid rename data");
        }
    } else if (evt.key === "deleteCourse" && evt.newValue) {
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send({
                key: "deleteCourse",
                courseId: evt.newValue
            });
        }
        settingsStorage.removeItem("deleteCourse");
    } else {
        // Standard settings forwarding
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send({
                key: evt.key,
                newValue: JSON.parse(evt.newValue)
            });
        }
    }
};
