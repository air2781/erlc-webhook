const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

const CHANNEL_ID = "1319134759636435038";
const CATEGORY_ID = "1418383022000181288";
const QUEUE_FILE = "./marketqueue1.json";

async function getProcessingCount(guild) {
  // Force fetch all channels so cache isn't empty
  await guild.channels.fetch();

  return guild.channels.cache.filter(
    ch => ch.parentId === CATEGORY_ID && ch.type !== 4
  ).size;
}

function getTotalQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return 0;
  const data = JSON.parse(fs.readFileSync(QUEUE_FILE));
  return data.total || 0;
}

function saveTotalQueue(total) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify({ total }, null, 2));
}

function buildStatus(total) {
  if (total <= 10) {
    return {
      emoji: "<:Check:1473547604921942046>",
      text: "We are currently operating smoothly with no significant delays."
    };
  }

  if (total <= 17) {
    return {
      emoji: "<:Warning:1473548393006633196>",
      text: "We are experiencing moderate demand which may cause slight delays."
    };
  }

  return {
    emoji: "<:ErrorX:1473547704444653568>",
    text: "Demand has exceeded capacity heavily, causing delays extending to months."
  };
}

async function updateQueueEmbed(client, guild) {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });

  const existing = messages.find(
    m => m.embeds.length && m.embeds[0].title === "Queue Status"
  );

  const processing = await getProcessingCount(guild);
  const total = getTotalQueue();
  const status = buildStatus(total);

  const embed = new EmbedBuilder()
    .setTitle("Queue Status")
    .setColor("Yellow")
    .setDescription(
      `> This status only represents any type of purchase involving a ping.\n\n` +
      `> Queue Processing Count: **${processing}**\n` +
      `> Total Queue In-Line: **${total}**\n` +
      `> **Advised Status:** ${status.emoji} — ${status.text}`
    );

  if (existing) {
    await existing.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

module.exports = {
  updateQueueEmbed,
  getTotalQueue,
  saveTotalQueue
};
