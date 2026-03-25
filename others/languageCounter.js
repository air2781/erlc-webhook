const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const FILE_PATH = path.join(__dirname, "../blanguage.json");
const LOG_CHANNEL_ID = "1455388497065279630";

const USER_LANGUAGE = new Map();

function loadData() {
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
}

module.exports = async (message) => {
  if (!message.guild || message.author.bot) return;

  const member = message.member;
  if (!member) return;

  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

  const data = loadData();
  const BAD_WORDS = data.words || [];
  const BYPASS = data.bypass || {};

  if (BYPASS[message.author.id] === true) return;

  // ❌ NO SIMPLIFICATION
  // ✅ Just lowercase and split normally
  const tokens = message.content.toLowerCase().split(/\s+/);

  let curseCount = 0;

  for (const token of tokens) {
    if (!token) continue;

    // Exact-ish detection without simplification
    if (token.includes("shit")) {
      curseCount++;
      continue;
    }

    if (token.includes("fuck")) {
      curseCount++;
      continue;
    }

    for (const word of BAD_WORDS) {
      if (token.includes(word.toLowerCase())) {
        curseCount++;
        break;
      }
    }
  }

  if (curseCount === 0) return;

  const userId = message.author.id;
  const now = Date.now();

  if (!USER_LANGUAGE.has(userId)) {
    USER_LANGUAGE.set(userId, { count: curseCount, firstTime: now });
  } else {
    const info = USER_LANGUAGE.get(userId);
    if (now - info.firstTime >= 86400000) {
      info.count = curseCount;
      info.firstTime = now;
    } else {
      info.count += curseCount;
    }
  }

  const info = USER_LANGUAGE.get(userId);

  if (info.count >= 5 && info.count < 7) {
    await message.reply({
      content:
        "⚠️ **Hey!** We notice you use excessive language a lot of times today, which is why for safety purposes if you continue to curse more, you will be timed out.\n" +
        "-# This is an automated message which only monitors the curse words, not the way its used."
    });
  }

  if (info.count >= 7) {
    if (!member.moderatable) {
      USER_LANGUAGE.delete(userId);
      return;
    }

    await member.timeout(
      60 * 60 * 1000,
      "Using excessive language multiple times."
    );

    USER_LANGUAGE.delete(userId);

    const embed = new EmbedBuilder()
      .setTitle("Excessive Language Limit Exceeded")
      .setColor("Yellow")
      .setDescription(
        "> Due to you exceeding the basic limit of cursing, you are being timed out for 1 hour. Please do not repeat this offense again."
      )
      .setFooter({
        text: `User Moderated: ${message.author.username} | ${message.author.id}`
      })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("log_ignore")
        .setLabel("Ignore")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("log_investigate")
        .setLabel("Void")
        .setStyle(ButtonStyle.Danger)
    );

    const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [embed],
        components: [buttons]
      });
    }

    try {
      await message.author.send({ embeds: [embed] });
    } catch {}
  }
};
