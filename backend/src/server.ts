import { app } from "./app.js";
import { env } from "./config/env.js";
import { sessionRepository } from "./repositories/sessionRepository.js";

const PORT = env.PORT || 3000;

void sessionRepository.deleteExpired().catch((err) => {
  console.error("[Omazon Server] Failed to clean up expired sessions on startup:", err);
});

// Cloud Run injects PORT and routes traffic to the container's external interface,
// so bind to 0.0.0.0 rather than loopback only.
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`[Omazon Server] Listening on http://${HOST}:${PORT}`);
});
