const noblox = require("noblox.js");
const fs = require("fs");
const { roblox: robloxConfig } = require("../Config.js");

let loggedIn = false;

// Error logger
function logErrorToFile(error) {
  const logPath = "./RobloxLogs.json";
  let logs = [];

  if (fs.existsSync(logPath)) {
    try {
      logs = JSON.parse(fs.readFileSync(logPath));
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }
  }

  logs.push({
    time: new Date().toISOString(),
    error: typeof error === "string" ? error : error?.message || String(error)
  });

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

// Login function
async function loginRoblox() {
  if (loggedIn) return;
  try {
    await noblox.setCookie(robloxConfig.securityCookie);
    const user = await noblox.getAuthenticatedUser();
    console.log(`[ROBLOX] Logged in as ${user.username} (${user.id})`);
    loggedIn = true;
  } catch (err) {
    logErrorToFile(err);
  }
}

// Helper: parse Roblox username from any input
function parseRobloxUsername(input) {
  if (!input || typeof input !== "string") return null;
  input = input.trim();
  const match = input.match(/\b[a-zA-Z0-9_]{3,20}\b/);
  return match ? match[0] : null;
}

// Accept user into Roblox group
async function acceptUserToGroup(discordId, robloxUsername, memberRoles, robloxIdFromBloxlink = null) {
  await loginRoblox();

  try {
    // ------------------ Role Requirement Check ------------------
    const hasWLRole = memberRoles.some(r => robloxConfig.whitelistRoleIds.includes(r));
    if (!hasWLRole) return "You do not have a whitelisted Discord role.";

    const isStaff = memberRoles.includes("1290085306489639026");

    let robloxId;
    let robloxUsernameFinal;

    // ------------------ METHOD 1: Bloxlink Priority ------------------
    if (robloxIdFromBloxlink) {
      try {
        robloxUsernameFinal = await noblox.getUsernameFromId(robloxIdFromBloxlink);
        robloxId = robloxIdFromBloxlink;
      } catch {
        console.log("[BLOXLINK] Failed to resolve Roblox username from Bloxlink ID, will try display name.");
      }
    }

    // ------------------ METHOD 2: Display Name Fallback ------------------
    if (!robloxId && robloxUsername) {
      const cleanedUsername = parseRobloxUsername(robloxUsername);

      if (cleanedUsername) {
        try {
          robloxId = await noblox.getIdFromUsername(cleanedUsername);
          robloxUsernameFinal = cleanedUsername;
        } catch {
          // silently fail → no valid Roblox ID found
        }
      }
    }

    if (!robloxId) {
      return "<:ErrorX:1473547704444653568> Could not determine your Roblox username. Ensure that you have requested to join the group above and that you have verified with Bloxlink or Melonly.";
    }

    // ------------------ Group Role Fetch ------------------
    const groupRoles = await noblox.getRoles(robloxConfig.groupId);

    const targetRole = isStaff
      ? groupRoles.find(r => r.name === "NYC:RP Staff Team")
      : groupRoles.find(r => r.name === robloxConfig.assignRobloxRoleName);

    if (!targetRole) {
      return `Roblox group role "${isStaff ? "NYC:RP Staff Team" : robloxConfig.assignRobloxRoleName}" not found.`;
    }

    const currentRank = await noblox.getRankInGroup(robloxConfig.groupId, robloxId);

    // Already correct role
    if (currentRank > 0 && currentRank === targetRole.rank) {
      return `<:Check:1478581031971061983> ${robloxUsernameFinal} already has the role "${targetRole.name}".`;
    }

    // Accept pending join request
    try {
      await noblox.handleJoinRequest(robloxConfig.groupId, robloxId, true);
    } catch (err) {
      if (!String(err.message).includes("is not pending approval")) throw err;
    }

    // Assign role
    if (currentRank !== targetRole.rank) {
      try {
        await noblox.setRank(robloxConfig.groupId, robloxId, targetRole.rank);
      } catch (err) {
        if (!String(err.message).includes("same role")) throw err;
      }
    }

    return `<:Check:1478581031971061983> Successfully added ${robloxUsernameFinal} to the group as "${targetRole.name}".`;

  } catch (err) {
    logErrorToFile(err);
    return "Error: You may not have attempted to join the group, or verification failed.";
  }
}

module.exports = {
  loginRoblox,
  acceptUserToGroup
};