/**
 * Config for Discord bot and Roblox group
 * Handles Roblox cookie sanitization and masking
 */

/**
 * Sanitize Roblox cookie
 * Keeps the full value, removes whitespace, quotes, and extra attributes
 */
function sanitizeCookie(raw) {
  if (!raw) return null;
  let cookie = raw.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  // If someone pasted the full header like ".ROBLOSECURITY=abc123; path=/", keep only the value
  if (cookie.includes(';')) cookie = cookie.split(';')[0];
  // If the cookie has "name=value", extract only the value
  if (cookie.includes('=')) cookie = cookie.split('=').slice(1).join('=');
  return cookie;
}

/**
 * Mask cookie for logging/debugging
 */
function maskCookie(cookie) {
  if (!cookie) return null;
  if (cookie.length <= 12) return '***';
  return cookie.slice(0, 6) + '...' + cookie.slice(-6);
}

// Full Roblox cookie including the warning prefix
const rawCookie = "";

const SecurityCookie = sanitizeCookie(rawCookie);
const MaskedSecurityCookie = maskCookie(SecurityCookie);

module.exports = {
  bot: {
    token: "",
    clientId: "1453177011668521010",
    guildId: "1290085306489639023",
    discordEmbedChannelId: "1312854884969873418"
  },

  bloxlink: {
    apiKey: "f1b677db-72d3-4ff4-a2a1-bdb9e7d5925a"
  },

  roblox: {
    groupId: 15990892,
    securityCookie: SecurityCookie,
    maskedCookie: MaskedSecurityCookie,
    whitelistRoleIds: [
      "1312852163000664175",
      "1330398732679643296",
      "1290085306489639026"
    ],
    assignRobloxRoleName: "Whitelisted Member"
  },

  erlc: {
    baseUrl: "https://api.policeroleplay.community",
    apiKey: "", // same structure style as maskedCookie

    endpoints: {
      v1: {
        server: "/v1/server",
        players: "/v1/server/players",
        queue: "/v1/server/queue",
        logs: "/v1/server/logs",
        command: "/v1/server/command"
      },

      v2: {
        server: "/v2/server",
        players: "/v2/players", // ✅ Correct V2 players endpoint
        command: "/v2/server/command"
      }
    }
  }
};