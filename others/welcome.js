const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  const GUILD_ID = "1290085306489639023";
  const LOG_CHANNEL_ID = "1479534429985701948";

  const headerImages = [
    "https://media.discordapp.net/attachments/1424290893258817536/1453988517251121254/image.png",
    "https://media.discordapp.net/attachments/1424290893258817536/1453988254281109575/image.png"
  ];

  client.on("guildMemberAdd", async (member) => {
    if (member.guild.id !== GUILD_ID) return;

    const logChannel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
    const memberCount = member.guild.memberCount;

    // Bot check
    if (member.user.bot) {
      if (logChannel) {
        logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Yellow")
              .setTitle(`Welcome Message Sent #${memberCount}`)
              .setDescription(`> *User **${member.user.tag}** welcome message not sent as it is a bot.*`)
          ]
        });
      }
      return;
    }

    const headerImage =
      headerImages[Math.floor(Math.random() * headerImages.length)];

    const embed1 = new EmbedBuilder()
      .setImage(headerImage)
      .setColor("Blue");

    const embed2 = new EmbedBuilder()
      .setColor("Blue")
      .setImage("https://media.discordapp.net/attachments/1423405329902735400/1444595333144379544/phonto.jpg")
      .setDescription(
        `Thank you for choosing **<:resized_imageremovebgpreview:1453989716973322294> New York City Roleplay**! We are so delighted to have you here, and we hope you enjoy the immersive environment we have set for our server.\n\n` +
        `**What's NYC:RP Known For?**\n` +
        `- 🎊 24/7 Active Sessions (250+ days)\n` +
        `- 👨‍✈️ Professional Staff & Strict Moderation\n` +
        `- 🏗️ Continuous Development & Improvements\n\n` +
        `**Main Channels & Resources:**\n` +
        `- <:912926arrow:1453991959923392634> https://discord.com/channels/1290085306489639023/1290085307437420632\n` +
        `- <:912926arrow:1453991959923392634> https://discord.com/channels/1290085306489639023/1324767916708855841\n` +
        `- <:912926arrow:1453991959923392634> https://discord.com/channels/1290085306489639023/1290085307437420633\n\n` +
        `*"If there is anything New York City Roleplay can do to improve your experience, we highly ask you to utilize our suggestions and feedback channels, or to directly contact us."*\n` +
        `**Cozzy, Founder**`
      )
      .setFooter({
        text: "New York City Roleplay",
        iconURL:
          "https://media.discordapp.net/attachments/1424290893258817536/1453989651500105810/resized_image-removebg-preview.png"
      });

    try {
      await member.send({ embeds: [embed1, embed2] });

      if (logChannel) {
        logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Yellow")
              .setTitle(`Welcome Message Sent #${memberCount}`)
              .setDescription(`> *User **${member.user.tag}** welcome message received.*`)
          ]
        });
      }
    } catch {
      if (logChannel) {
        logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Yellow")
              .setTitle(`Welcome Message Sent #${memberCount}`)
              .setDescription(
                `> *User **${member.user.tag}** welcome message didn't receive. This might be because of their DMs being off.*`
              )
          ]
        });
      }
    }
  });
};
