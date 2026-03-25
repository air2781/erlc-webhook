module.exports = function(client) {
  const { sendFridayLogs } = require("./ticketloghandler");

  function msUntilNextFridayNoon() {
    const now = new Date();
    const next = new Date();

    const day = now.getDay();
    const diff = (5 - day + 7) % 7;

    next.setDate(now.getDate() + diff);
    next.setHours(12, 0, 0, 0);

    if (next <= now) next.setDate(next.getDate() + 7);

    return next - now;
  }

  function scheduleFridayLogs(client) {
    const timeout = msUntilNextFridayNoon();

    setTimeout(async () => {
      try {
        await sendFridayLogs(client);
        console.log("[TICKET LOGS] ✅ Friday logs sent successfully.");
      } catch (err) {
        console.error("[TICKET LOGS] ❌ Failed sending Friday logs:", err);
      }

      scheduleFridayLogs(client);
    }, timeout);
  }

  scheduleFridayLogs(client);
};