const fs = require("fs");
const path = require("path");

const WARRANT_LOG_PATH = path.join(__dirname, "./warrantlogs.json");

module.exports.start = () => {

    setInterval(() => {

        if (!fs.existsSync(WARRANT_LOG_PATH)) return;

        let warrants = JSON.parse(fs.readFileSync(WARRANT_LOG_PATH, "utf-8"));
        if (!warrants.length) return;

        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;

        const beforeCount = warrants.length;

        warrants = warrants.filter(w => {
            if (!w.createdAt) return false; // remove corrupted entries
            return now - w.createdAt < threeDays;
        });

        const afterCount = warrants.length;

        if (beforeCount !== afterCount) {
            fs.writeFileSync(WARRANT_LOG_PATH, JSON.stringify(warrants, null, 2));
            console.log(`[WARRANT HANDLER] Removed ${beforeCount - afterCount} expired warrant(s).`);
        }

    }, 60 * 60 * 1000); // check every 1 hour

};