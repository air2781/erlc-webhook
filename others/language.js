const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "blanguage.json");
const LOG_CHANNEL_ID = "1455388497065279630";

let userData = new Map();

function loadLanguage() {
  delete require.cache[require.resolve(DATA_PATH)];
  return require(DATA_PATH);
}

function resetUser(userId) {
  userData.delete(userId);
}

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    const language = loadLanguage();
    const { words, bypass } = language;

    if (bypass?.[message.author.id]) return;

    // 🔒 FIX: match ONLY standalone words (not attached)
    const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

    const matches = message.content.match(regex);
    if (!matches) return;

    const now = Date.now();
    const userId = message.author.id;

    if (!userData.has(userId)) {
      userData.set(userId, { count: 0, first: now });
    }

    const data = userData.get(userId);

    if (now - data.first >= 24 * 60 * 60 * 1000) {
      data.count = 0;
      data.first = now;
    }

    data.count += matches.length;

    if (data.count === 5) {
      await message.reply({
        content:
          "⚠️ **Hey!** We noticed you’ve used excessive language multiple times today.\n" +
          "If you continue, you may be timed out.\n\n" +
          "-# This is an automated message which only monitors curse words, not the way they’re used."
      });
    }

    if (data.count >= 7) {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        resetUser(userId);
        return;
      }

      await member.timeout(
        60 * 60 * 1000,
        "Using excessive language multiple times."
      ).catch(() => {});

      resetUser(userId);

      const dmEmbed = new EmbedBuilder()
        .setTitle("Excessive Language Limit Exceeded")
        .setColor(0xfee75c)
        .setDescription(
          "> Due to you exceeding the basic limit of cursing, you are being timed out for **1 hour**.\n" +
          "> Please do not repeat this offense again."
        )
        .setFooter({
          text: `User Moderated: ${member.user.username} | ${member.user.id}`
        });

      member.send({ embeds: [dmEmbed] }).catch(() => {});

      const logEmbed = new EmbedBuilder()
        .setTitle("Automatic Timeout Issued")
        .setColor(0xed4245)
        .setDescription(
          `**User:** ${member.user.tag}\n` +
          `**ID:** ${member.user.id}\n` +
          `**Reason:** Excessive language`
        )
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("language_ignore")
          .setLabel("Ignore")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("language_void")
          .setLabel("Void")
          .setStyle(ButtonStyle.Danger)
      );

      const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          embeds: [logEmbed],
          components: [buttons]
        });
      }
    }
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
      resetUser(newMember.id);
    }
  });
};
