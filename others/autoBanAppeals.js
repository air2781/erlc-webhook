const fs = require("fs");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

const GUILD_ID = "1290085306489639023";
const STAFF_ROLE_ID = "1290085306489639026";

const IGNORED_CATEGORIES = [
  "1446179826049220760",
  "1290085309190504468",
  "1342963163313864704",
  "1290085309190504467"
];

const DISABLE_PATH = path.join(__dirname, "DisableAutoBanAppeals.json");

const BAN_APPEAL_TAG = "9KQ4M2X7A1";

const BAN_APPEAL_KEYWORDS = [
  "ban appeal",
  "appeal ban",
  "appeal my ban",
  "how can i appeal my ban",
  "how do i appeal my ban",
  "how to appeal ban",
  "how to do ban appeal",
  "can i appeal my ban",
  "where do i appeal my ban",
  "ban appealed",
  "appealing ban",
  "ban appeal form",
  "appeal a ban",
  "appeal for ban",
  "i got banned how do i appeal",
  "how can i appeal a ban",
  "ban appeal link",
  "appeal suspension",
  "appeal my suspension",
  "server ban appeal",
  "discord ban appeal"
];

const cooldown = new Map();
const COOLDOWN_MS = 60_000;

function loadDisabled() {
  if (!fs.existsSync(DISABLE_PATH)) {
    fs.writeFileSync(DISABLE_PATH, JSON.stringify({ disabled: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DISABLE_PATH, "utf8"));
}

function saveDisabled(data) {
  fs.writeFileSync(DISABLE_PATH, JSON.stringify(data, null, 2));
}

module.exports = async (client, message) => {
  try {
    if (!message.guild) return;
    if (message.guild.id !== GUILD_ID) return;
    if (message.author.bot) return;

    // 🚫 Ignore chosen categories
    if (IGNORED_CATEGORIES.includes(message.channel.parentId)) return;

    const member = message.member;
    if (!member) return;

    const disabledData = loadDisabled();
    if (disabledData.disabled.includes(message.author.id)) return;

    // Opt-out handling
    if (message.reference?.messageId) {
      const repliedTo = await message.channel.messages
        .fetch(message.reference.messageId)
        .catch(() => null);

      if (
        repliedTo &&
        repliedTo.author.id === client.user.id &&
        repliedTo.content.includes(BAN_APPEAL_TAG) &&
        message.content.toLowerCase().trim() === "yes"
      ) {
        disabledData.disabled.push(message.author.id);
        saveDisabled(disabledData);

        return message.reply(
          "✅ You will no longer receive automated ban appeal messages."
        );
      }
    }

    // Ignore staff/admin
    if (
      member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      member.roles.cache.has(STAFF_ROLE_ID)
    ) return;

    const content = message.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

    const matched = BAN_APPEAL_KEYWORDS.some(k => content.includes(k));
    if (!matched) return;

    const last = cooldown.get(message.author.id);
    if (last && Date.now() - last < COOLDOWN_MS) return;
    cooldown.set(message.author.id, Date.now());

    await message.reply({
      content:
        "You can complete a ban appeal for your ban by clicking " +
        "[**here**](https://melonly.xyz/dashboard/7324250617478647808/applications/7324488391871959040).\n" +
        "Please note that if your account is recently made, you may not be able to submit an appeal for up to **7 days**. " +
        "Ban appeals are reviewed every **2–7 days**. If you do not receive a response after that time, please open a ticket.\n" +
        "-# Don’t want to receive these automated messages? Reply **\"yes\"** to this message.\n" +
        `-# ${BAN_APPEAL_TAG}`
    });

  } catch (err) {
    console.error("AutoBanAppeals error:", err);
  }
};
