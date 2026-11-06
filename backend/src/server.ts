import { app } from "./app.js";
import { env } from "./config/env.js";
import { sessionRepository } from "./repositories/sessionRepository.js";

const PORT = env.PORT || 3000;

void sessionRepository.deleteExpired().catch((err) => {
  console.error("[CampusBites Server] Failed to clean up expired sessions on startup:", err);
});

app.listen(PORT, () => {
  console.log(`[CampusBites Server] Listening on http://localhost:${PORT}`);
});
