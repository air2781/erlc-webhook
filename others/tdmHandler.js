const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const config = require("../Config");

const tdmPath = path.join(__dirname, "./commands/tdmconfig.json");

const API_BASE = "https://api.policeroleplay.community/v1/server";

// retry helper (for :pt, :pm, :tp, etc.)
async function sendCommand(cmd, retry = true) {
    try {
        const res = await fetch(`${API_BASE}/command`, {
            method: "POST",
            headers: {
                "server-key": config.serverKey,
                "Content-Type": "application/json",
                "Accept": "*/*"
            },
            body: JSON.stringify({ command: cmd })
        });

        if (res.status === 200) return true;

        if (retry) {
            await new Promise(r => setTimeout(r, 2000));
            return sendCommand(cmd, true);
        }

    } catch (e) {
        if (retry) {
            await new Promise(r => setTimeout(r, 2000));
            return sendCommand(cmd, true);
        }
    }
}

// fetch kill logs
async function getKillLogs() {
    try {
        const res = await fetch(`${API_BASE}/killlogs`, {
            method: "GET",
            headers: {
                "server-key": config.serverKey,
                "Accept": "*/*"
            }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

// convert timer string → seconds
function parseTime(val) {
    if (!val) return null;
    if (val.endsWith("m")) return parseInt(val) * 60;
    if (val.endsWith("s")) return parseInt(val);
    return null;
}

let activeMatch = false;
let countdown = 0;
let lastKillCheck = 0;
let warned10 = false;
let warned60 = false;
let lastTP = 0;

setInterval(async () => {
    if (!fs.existsSync(tdmPath)) return;

    let tdm = JSON.parse(fs.readFileSync(tdmPath, "utf8"));

    // HARD STOP if disabled
    if (!tdm.pluginactive) {
        activeMatch = false;
        countdown = 0;
        warned10 = false;
        warned60 = false;
        return;
    }

    // match start trigger
    if (tdm.matchactive && !activeMatch) {
        activeMatch = true;
        countdown = parseTime(tdm.timer);
        warned10 = false;
        warned60 = false;

        if (countdown) {
            await sendCommand(`:prty ${countdown}`);
        }
    }

    // if match not active, stop
    if (!tdm.matchactive) {
        activeMatch = false;
        return;
    }

    // no timer
    if (!countdown) return;

    // countdown tick
    countdown--;

    // stop instantly if disabled mid-run
    tdm = JSON.parse(fs.readFileSync(tdmPath, "utf8"));
    if (!tdm.pluginactive) {
        activeMatch = false;
        return;
    }

    // 60s warning
    if (countdown === 60 && !warned60) {
        warned60 = true;
        const mins = Math.floor(countdown / 60);
        await sendCommand(`:h The match will end in ${mins}m`);
    }

    // 10s start warning
    if (countdown === 10 && !warned10) {
        warned10 = true;
        await sendCommand(`:m Match is about to begin in 10 seconds`);
        await sendCommand(`:pt 10`);
    }

    // teleport logic (rate-limited + skip empty teams)
    if (tdm.tp && Date.now() - lastTP > 5000) {
        lastTP = Date.now();

        for (const team in tdm.teamassignments) {
            const players = tdm.teamassignments[team];
            if (!players || players.length === 0) continue;

            for (const user of players) {
                await sendCommand(`:tp ${user} ${tdm.tp}`);
            }
        }
    }

    // kill log checking
    const logs = await getKillLogs();
    for (const log of logs) {
        if (log.Timestamp <= lastKillCheck) continue;

        const killedName = log.Killed.split(":")[0].toLowerCase();

        for (const team in tdm.teamassignments) {
            const players = tdm.teamassignments[team];
            if (!players || players.length === 0) continue;

            if (players.some(p => p.toLowerCase() === killedName)) {
                await sendCommand(`:pm ${log.Killed.split(":")[0]} You have been killed. Call !mod for spectating, or stay downed.`);
            }
        }

        lastKillCheck = log.Timestamp;
    }

    // match end
    if (countdown <= 0) {
        await sendCommand(`:m The timer has been reached. All users are to STOP.`);
        await sendCommand(`:pt 100`);

        tdm.matchactive = false;
        fs.writeFileSync(tdmPath, JSON.stringify(tdm, null, 4));

        activeMatch = false;
        countdown = 0;
    }

}, 3500);