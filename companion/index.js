import { settingsStorage } from "settings";
import { me as companion } from "companion";

// Settings changed from phone app
settingsStorage.addEventListener("change", (evt) => {
    console.log(`Setting changed: ${evt.key} = ${evt.newValue}`);
});

console.log("Companion app started");
