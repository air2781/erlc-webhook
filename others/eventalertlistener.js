const fs = require("fs");
const path = require("path");

// File location — tries project root first (most reliable without .env)
let FILE_PATH = path.join(process.cwd(), "eventfunctionmode.json");

// If that doesn't work on your host, uncomment one of these instead:
// FILE_PATH = path.join(__dirname, "eventfunctionmode.json");
// FILE_PATH = path.join(__dirname, "../eventfunctionmode.json");

const ROLE_ID    = "1319403388495990824";
const CHANNEL_ID = "1290085308469346320";
const LOG_CHANNEL_ID = "1479534429985701948";

// helper to send logs to discord
async function sendLog(client, message) {
    try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (channel && channel.isTextBased()) {
            await channel.send({ content: message });
        }
    } catch {}
}

function isEventEnabled(client) {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            sendLog(client, `[Event] Config file missing: ${FILE_PATH}`);
            return false;
        }

        const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));

        const enabled = data.enabled === true;

        sendLog(client, `[Event] Mode: ${enabled ? "ENABLED" : "DISABLED"} (from ${FILE_PATH})`);

        return enabled;
    } catch (err) {
        sendLog(client, `[Event] Failed to read/parse config: ${err.message}`);
        return false;
    }
}

module.exports = {
    start: (client) => {
        sendLog(client, "[Event Listener] Listener registered");

        client.on("guildMemberUpdate", async (oldMember, newMember) => {
            // Skip everything if event is off/misconfigured
            if (!isEventEnabled(client)) return;

            try {
                const hadRole  = oldMember.roles.cache.has(ROLE_ID);
                const hasRole = newMember.roles.cache.has(ROLE_ID);

                // Only trigger when the specific role is *added*
                if (hadRole || !hasRole) return;

                sendLog(client, `[Event] Detected role add → ${newMember.user.tag} (${newMember.id})`);

                const channel = newMember.guild.channels.cache.get(CHANNEL_ID);
                if (!channel) {
                    sendLog(client, `[Event] Channel ${CHANNEL_ID} not found`);
                    return;
                }

                if (!channel.isTextBased()) {
                    sendLog(client, `[Event] Channel ${CHANNEL_ID} is not a text channel`);
                    return;
                }

                await channel.send({
                    content:
                        `<@${newMember.id}> at this time, an event is being hosted by a HR+.\n` +
                        `Before moderating or continuing duties, please confirm with the host of what's going on and how you can assist them with it.`
                });

                sendLog(client, `[Event] Message sent to ${newMember.user.tag}`);

            } catch (err) {
                sendLog(client, `[Event Listener] Error: ${err.message}`);
            }
        });
    }
};