const CHECK_GUILD_ID = "1290085306489639023";
const CHECK_USER_ID = "1472782984670347516";

const ALERT_CHANNELS = [
  "1424290893258817536",
  "1376285160038731797"
];

const ALERT_USERS = [
  "819219946042032175",
  "942789806818213949"
];

let triggered = false;
let failureCount = 0;
const REQUIRED_CONFIRMATIONS = 3; // 3 consecutive checks

module.exports = {
  name: "emergencylockdown",

  start: (client) => {
    setInterval(async () => {
      if (triggered) return;

      const guild = client.guilds.cache.get(CHECK_GUILD_ID);
      if (!guild) return; // bot not ready or removed

      try {
        // ✅ CACHE CHECK FIRST
        if (guild.members.cache.has(CHECK_USER_ID)) {
          failureCount = 0;
          return;
        }

        // 🔁 BACKUP FETCH
        const member = await guild.members.fetch(CHECK_USER_ID).catch(() => null);

        if (member) {
          failureCount = 0;
          return;
        }

        // ❌ CONFIRMED MISS
        failureCount++;

        if (failureCount < REQUIRED_CONFIRMATIONS) return;

        triggered = true;

        const alertMessage =
`# EMERGENCY ALERT: POSSIBLE ACTVE RAID

> **WARNING: A possible raid might be occurring at this time. Service Bot *New York City Roleplay* was removed from the server. Wick may be compromised. The bot will not take action due to Discord Limitations and possible false alarm.**

> Cozzy, Air, and other officials have been notified.
-# @everyone @here`;

        // 📢 SEND TO CHANNELS
        for (const channelId of ALERT_CHANNELS) {
          const channel = guild.channels.cache.get(channelId);
          if (channel) channel.send(alertMessage);
        }

        // 📩 DM OFFICIALS
        for (const userId of ALERT_USERS) {
          const user = await client.users.fetch(userId).catch(() => null);
          if (user) user.send(alertMessage);
        }

        console.log("[EMERGENCY] Lockdown triggered for guild 1290085306489639023");

      } catch {
        // silent fail = safety
      }
    }, 3000);
  }
};
