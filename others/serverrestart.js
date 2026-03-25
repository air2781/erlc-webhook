module.exports = {
    name: "rs",
    run: async (client, message, args) => {
        // Only allow specific user
        if (message.author.id !== "942789806818213949") {
            return message.reply("You do not have permission to run this command.");
        }

        // Delete the command message
        await message.delete().catch(() => {});

        // Send a temporary message
        const sentMsg = await message.channel.send("⚠️ Restarting the server...");

        // Small delay to ensure the message sends before exiting
        setTimeout(() => {
            console.log("Server is restarting...");
            process.exit(0); // Node.js process exits, PM2/Docker will restart it
        }, 1000);
    }
};
