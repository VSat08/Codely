/**
 * Cleanup job — purges rooms inactive for 30+ days.
 * Runs every hour.
 */

const { rooms } = require('./roomStore');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function startCleanup() {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, room] of rooms) {
      if (now - room.lastActivity > THIRTY_DAYS_MS) {
        rooms.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cleanup] Purged ${cleaned} stale room(s). Active: ${rooms.size}`);
    }
  }, ONE_HOUR_MS);
}

module.exports = { startCleanup };
